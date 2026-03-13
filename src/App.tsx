import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Send, 
  History, 
  User as UserIcon, 
  ShieldCheck, 
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertCircle,
  LogOut,
  LogIn
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---
interface Announcement {
  id: number;
  message: string;
  created_at: string;
}

interface Notification {
  id: number;
  message: string;
  is_read: number;
  created_at: string;
}

const ADMIN_TOKEN = "admin-secret-token-2026";
const BASE_URL = "https://wpadocker-production.up.railway.app";

export default function App() {
  const [view, setView] = useState<"admin" | "user">("admin");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; msg: string }>({ type: null, msg: "" });
  const [loading, setLoading] = useState(false);

  // --- API Calls ---

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/announcements/history`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
      
      const countRes = await fetch(`${BASE_URL}/api/v1/notifications/unread_count`);
      if (countRes.ok) {
        const countData = await countRes.json();
        setUnreadCount(countData.unread_count);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const sendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setStatus({ type: null, msg: "" });

    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({ message })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", msg: "Announcement sent successfully!" });
        setMessage("");
        fetchHistory();
      } else {
        setStatus({ type: "error", msg: data.message || "Failed to send announcement" });
      }
    } catch (err) {
      setStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${BASE_URL}/api/v1/notifications/read_all`, { method: "POST" });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  useEffect(() => {
    if (view === "admin") {
      if (isAdminLoggedIn) fetchHistory();
    } else {
      fetchNotifications();
    }
  }, [view, isAdminLoggedIn]);

  // Polling for user notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (view === "user") fetchNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, [view]);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Navigation Rail */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#141414]/10 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#141414] rounded flex items-center justify-center text-white font-bold italic">W</div>
          <span className="font-serif italic text-xl tracking-tight">WPA Conference 2026</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView("admin")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              view === "admin" ? "bg-[#141414] text-white" : "hover:bg-[#141414]/5"
            }`}
          >
            <ShieldCheck size={16} />
            Admin
          </button>
          <button 
            onClick={() => setView("user")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all relative ${
              view === "user" ? "bg-[#141414] text-white" : "hover:bg-[#141414]/5"
            }`}
          >
            <UserIcon size={16} />
            User
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {view === "admin" ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {!isAdminLoggedIn ? (
                <div className="bg-white border border-[#141414]/10 p-12 rounded-3xl text-center space-y-6 shadow-sm">
                  <div className="w-16 h-16 bg-[#141414]/5 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck size={32} className="text-[#141414]" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-serif italic">Admin Access</h2>
                    <p className="text-[#141414]/60 max-w-xs mx-auto">Please sign in to the administrative dashboard to manage announcements.</p>
                  </div>
                  <button 
                    onClick={() => setIsAdminLoggedIn(true)}
                    className="bg-[#141414] text-white px-8 py-3 rounded-full font-medium hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                  >
                    <LogIn size={18} />
                    Sign In as Admin
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h1 className="text-4xl font-serif italic">Admin Dashboard</h1>
                      <p className="text-[#141414]/60 text-sm uppercase tracking-widest font-mono">Announcement Control Center</p>
                    </div>
                    <button 
                      onClick={() => setIsAdminLoggedIn(false)}
                      className="text-sm font-mono opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      LOGOUT
                    </button>
                  </div>

                  {/* Send Form */}
                  <div className="bg-white border border-[#141414] p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(20,20,20,0.05)]">
                    <form onSubmit={sendAnnouncement} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest opacity-50 flex items-center gap-2">
                          <Bell size={12} />
                          Broadcast Message
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Welcome to WPA Conference 2026..."
                          className="w-full h-32 p-4 bg-[#F5F5F0] border border-[#141414]/10 rounded-2xl focus:outline-none focus:border-[#141414] transition-colors resize-none"
                        />
                      </div>

                      {status.type && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className={`flex items-center gap-2 text-sm p-3 rounded-xl ${
                            status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {status.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                          {status.msg}
                        </motion.div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className="w-full bg-[#141414] text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-[#141414]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send size={18} />
                            SEND ANNOUNCEMENT
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* History */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest opacity-50">
                      <History size={12} />
                      Announcement History
                    </div>
                    <div className="space-y-3">
                      {history.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-[#141414]/20 rounded-3xl text-[#141414]/40 italic font-serif">
                          No announcements sent yet.
                        </div>
                      ) : (
                        history.map((item) => (
                          <div key={item.id} className="bg-white border border-[#141414]/5 p-5 rounded-2xl flex items-start justify-between group hover:border-[#141414]/20 transition-colors">
                            <div className="space-y-1">
                              <p className="text-[#141414]">{item.message}</p>
                              <div className="flex items-center gap-2 text-[10px] font-mono opacity-40">
                                <Clock size={10} />
                                {new Date(item.created_at).toLocaleString()}
                              </div>
                            </div>
                            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <CheckCircle2 size={14} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="user"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h1 className="text-4xl font-serif italic">Notifications</h1>
                  <p className="text-[#141414]/60 text-sm uppercase tracking-widest font-mono">Delegate Updates</p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs font-mono px-4 py-2 border border-[#141414]/20 rounded-full hover:bg-[#141414] hover:text-white transition-all"
                  >
                    MARK ALL AS READ
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-24 bg-white border border-[#141414]/10 rounded-3xl space-y-4">
                    <div className="w-16 h-16 bg-[#141414]/5 rounded-full flex items-center justify-center mx-auto text-[#141414]/20">
                      <Bell size={32} />
                    </div>
                    <p className="text-[#141414]/40 italic font-serif">No notifications at the moment.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <motion.div 
                      layout
                      key={notif.id} 
                      className={`bg-white border p-6 rounded-3xl flex items-start gap-4 transition-all ${
                        notif.is_read === 0 ? "border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,0.05)]" : "border-[#141414]/10 opacity-70"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        notif.is_read === 0 ? "bg-[#141414] text-white" : "bg-[#141414]/5 text-[#141414]/40"
                      }`}>
                        <Bell size={18} />
                      </div>
                      <div className="space-y-2 flex-1">
                        <p className={`text-lg leading-tight ${notif.is_read === 0 ? "font-medium" : "text-[#141414]/60"}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-mono opacity-40 uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(notif.created_at).toLocaleTimeString()}
                          </span>
                          <span>•</span>
                          <span>{new Date(notif.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {notif.is_read === 0 && (
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-[#F5F5F0] border-t border-[#141414]/5 flex items-center justify-center px-6 z-40">
        <p className="text-[10px] font-mono opacity-30 uppercase tracking-[0.2em]">
          WPA Conference 2026 • Administrative System v1.0
        </p>
      </footer>
    </div>
  );
}
