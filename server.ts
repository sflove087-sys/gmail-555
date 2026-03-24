import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import cookieSession from "cookie-session";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy is essential for cookies to work behind the AI Studio proxy
  app.set("trust proxy", 1);

  app.use(express.json());
  app.use(
    cookieSession({
      name: "session",
      keys: ["gmail-telegram-sync-secret"],
      maxAge: 24 * 60 * 60 * 1000,
      secure: true,
      sameSite: "none",
    })
  );

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/auth/google/callback`
  );

  let activeTokens: any = null;

  // --- API Routes (Must be defined BEFORE Vite middleware) ---

  app.get("/api/status", (req, res) => {
    res.json({
      connected: !!req.session?.tokens || !!activeTokens,
      hasTelegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    });
  });

  app.get("/api/auth/url", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify"
      ],
      prompt: "consent",
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      req.session!.tokens = tokens;
      activeTokens = tokens;
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session = null;
    activeTokens = null;
    res.json({ success: true });
  });

  // --- Gmail Polling Logic ---
  async function sendTelegramMessage(text: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) return;
    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      });
    } catch (error) {
      console.error("Error sending Telegram message:", error);
    }
  }

  async function pollGmail() {
    if (!activeTokens) return;
    oauth2Client.setCredentials(activeTokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    try {
      const res = await gmail.users.messages.list({
        userId: "me",
        maxResults: 5,
        q: "is:unread",
      });
      const messages = res.data.messages || [];
      for (const msg of messages) {
        const message = await gmail.users.messages.get({ userId: "me", id: msg.id! });
        await gmail.users.messages.modify({
          userId: "me",
          id: msg.id!,
          requestBody: { removeLabelIds: ["UNREAD"] },
        });
        const headers = message.data.payload?.headers;
        const subject = headers?.find((h) => h.name === "Subject")?.value || "No Subject";
        const from = headers?.find((h) => h.name === "From")?.value || "Unknown Sender";
        const snippet = message.data.snippet || "";
        const telegramText = `📬 <b>New Email</b>\n\n👤 <b>From:</b> ${from}\n📝 <b>Subject:</b> ${subject}\n\n<i>${snippet}</i>`;
        await sendTelegramMessage(telegramText);
      }
    } catch (error) {
      console.error("Error polling Gmail:", error);
      if ((error as any).code === 401) activeTokens = null;
    }
  }

  setInterval(pollGmail, 30000);

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
