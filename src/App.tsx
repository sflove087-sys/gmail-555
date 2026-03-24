import React, { useState, useEffect } from "react";
import { 
  Mail, Send, CheckCircle, XCircle, LogOut, ExternalLink, 
  Settings, Bell, Menu, X, Tag, MessageSquare, User, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [loginError, setLoginError] = useState("");
  
  const [status, setStatus] = useState<{ connected: boolean; hasTelegram: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginCode === "22330") {
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Invalid access code. Please try again.");
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch("/api/auth/url");
      const { url } = await res.json();
      const authWindow = window.open(url, "google_oauth", "width=600,height=700");
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
          fetchStatus();
          window.removeEventListener("message", handleMessage);
        }
      };
      window.addEventListener("message", handleMessage);
    } catch (err) {
      console.error("Failed to get auth URL", err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    fetchStatus();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl"
        >
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-orange-500/20 rounded-3xl">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-2">Secure Access</h2>
          <p className="text-gray-400 text-center mb-8 text-sm">Enter your 5-digit code to continue</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <input 
                type="password"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                placeholder="•••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-center text-2xl tracking-[1em] focus:outline-none focus:border-orange-500 transition-all"
                maxLength={5}
              />
            </div>
            {loginError && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center"
              >
                {loginError}
              </motion.p>
            )}
            <button 
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20 active:scale-95"
            >
              Unlock Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tighter text-xl">SYNC.IO</span>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-white/5 rounded-xl transition-all"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Hamburger Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-40 bg-[#0a0a0a] pt-24 px-6"
          >
            <div className="max-w-xl mx-auto space-y-4">
              {[
                { id: "dashboard", icon: Settings, label: "Dashboard" },
                { id: "gmail-list", icon: User, label: "Gmail Connections" },
                { id: "discounts", icon: Tag, label: "Discount Offers" },
                { id: "sms", icon: MessageSquare, label: "SMS Messages" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-6 rounded-3xl border transition-all ${
                    activeTab === item.id 
                    ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20" 
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xl font-semibold">{item.label}</span>
                </button>
              ))}
              
              <button 
                onClick={() => setIsLoggedIn(false)}
                className="w-full flex items-center gap-4 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all mt-12"
              >
                <LogOut className="w-6 h-6" />
                <span className="text-xl font-semibold">Lock Dashboard</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20">
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <header className="mb-16 space-y-4">
              <div className="flex items-center gap-3 text-orange-500">
                <Mail className="w-5 h-5" />
                <span className="text-xs font-mono uppercase tracking-widest">Live Sync Active</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none">
                GMAIL TO <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">
                  TELEGRAM
                </span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl">
                Bridge your inbox to your chat. Automatically forward incoming emails to your Telegram bot in real-time.
              </p>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Connection Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-3 bg-orange-500/10 rounded-2xl">
                    <Mail className="w-6 h-6 text-orange-500" />
                  </div>
                  {status?.connected ? (
                    <span className="flex items-center gap-2 text-xs font-mono text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> CONNECTED
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                      <XCircle className="w-3 h-3" /> DISCONNECTED
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">Google Account</h3>
                <p className="text-gray-400 text-sm mb-8">Connect your Gmail account to start monitoring for new messages.</p>
                {status?.connected ? (
                  <button onClick={handleLogout} className="w-full group flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl transition-all">
                    <LogOut className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    <span>Disconnect Account</span>
                  </button>
                ) : (
                  <button onClick={handleConnect} className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl transition-all font-semibold shadow-lg shadow-orange-500/20">
                    <ExternalLink className="w-4 h-4" />
                    Connect Gmail
                  </button>
                )}
              </div>

              {/* Telegram Config Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-3 bg-blue-500/10 rounded-2xl">
                    <Send className="w-6 h-6 text-blue-400" />
                  </div>
                  {status?.hasTelegram ? (
                    <span className="flex items-center gap-2 text-xs font-mono text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> CONFIGURED
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-xs font-mono text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full">
                      <Settings className="w-3 h-3" /> ACTION REQUIRED
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">Telegram Bot</h3>
                <p className="text-gray-400 text-sm mb-8">Set your Bot Token and Chat ID in the environment variables.</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <div className="flex-1">
                      <p className="text-xs font-mono text-gray-500 uppercase tracking-tighter">Bot Token</p>
                      <p className="text-sm font-mono truncate">{process.env.TELEGRAM_BOT_TOKEN ? "••••••••••••••••" : "Not set"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "gmail-list" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <h2 className="text-4xl font-bold tracking-tight">Connected Accounts</h2>
            <div className="grid gap-4">
              {status?.connected ? (
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Primary Gmail</p>
                      <p className="text-gray-400 text-sm">Active & Monitoring</p>
                    </div>
                  </div>
                  <button className="p-3 hover:bg-white/5 rounded-xl transition-all">
                    <Settings className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                  <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No accounts connected yet.</p>
                  <button onClick={handleConnect} className="mt-4 text-orange-500 font-semibold hover:underline">Connect your first account</button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "discounts" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <h2 className="text-4xl font-bold tracking-tight">Special Offers</h2>
            <div className="grid gap-6">
              {[
                { title: "Annual Plan", discount: "40% OFF", description: "Save big with our yearly subscription." },
                { title: "Early Bird", discount: "20% OFF", description: "For new users connecting within 24h." },
              ].map((offer, i) => (
                <div key={i} className="bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/20 p-8 rounded-[2rem] flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{offer.title}</h3>
                    <p className="text-gray-400">{offer.description}</p>
                  </div>
                  <div className="text-3xl font-black text-orange-500">{offer.discount}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "sms" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-bold tracking-tight">SMS Center</h2>
              <button className="bg-orange-500 p-4 rounded-2xl shadow-lg shadow-orange-500/20">
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { from: "+1 234 567 890", msg: "Your verification code is 22330", time: "2m ago" },
                { from: "System", msg: "Gmail sync successfully established.", time: "1h ago" },
              ].map((sms, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-orange-400">{sms.from}</span>
                    <span className="text-xs text-gray-500 font-mono">{sms.time}</span>
                  </div>
                  <p className="text-gray-300">{sms.msg}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-white/5 text-center text-gray-500 text-xs font-mono uppercase tracking-widest">
        &copy; 2026 SYNC.IO &bull; Built with AI Studio
      </footer>
    </div>
  );
}
