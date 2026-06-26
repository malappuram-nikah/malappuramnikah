"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Search, Heart, MessageSquare, Check, Sparkles, X } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: number;
  user_id: number;
  sender_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: number;
    first_name: string;
    last_name: string;
    gender: string;
    location: string;
    profile_details?: any;
  };
}

import AmbientMusicPlayer from "@/components/dashboard/AmbientMusicPlayer";

export default function DashboardHeader() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Auth & Real-Time Socket
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("mn_token");
    setToken(storedToken);

    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        if (payload.userId) {
          setUserId(payload.userId);
          
          // Connect to real-time notification socket room
          const socket = io("http://localhost:3333", {
            transports: ["websocket", "polling"]
          });
          socketRef.current = socket;
          socket.emit("join", payload.userId);

          // Realtime incoming notifications alert handler
          socket.on("notification", (newNotif: any) => {
            // Re-fetch notifications to load rich DB details
            fetchNotificationsList(storedToken);
          });

          // Fetch initial notification list
          fetchNotificationsList(storedToken);
          fetchUserProfile(payload.userId, storedToken);

          return () => {
            socket.disconnect();
          };
        }
      } catch (err) {
        console.error("DashboardHeader setup error:", err);
      }
    }
  }, []);

  const fetchUserProfile = async (uId: number, jwtToken: string) => {
    try {
      const res = await fetch(`http://localhost:3333/user/${uId}`, {
        headers: { "Authorization": `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUserName(data.user.first_name || "User");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotificationsList = async (jwtToken: string) => {
    try {
      const res = await fetch("http://localhost:3333/user/notifications", {
        headers: { "Authorization": `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3333/user/notifications/read-all", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically set all local notifications to is_read: true
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    setShowDropdown(false);
    if (!token) return;

    // Mark as read in DB
    try {
      await fetch(`http://localhost:3333/user/notifications/${notif.id}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error(err);
    }

    // Smart Redirect based on notification trigger type
    if (notif.type === "NEW_MESSAGE") {
      router.push("/dashboard/chat");
    } else {
      router.push("/dashboard/search");
    }
  };

  // Profile Image Resolver
  const getAvatarUrl = (sender?: any) => {
    if (!sender) return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60";
    const photos = sender.profile_details?.mn_profile_photos_draft?.photos;
    if (photos && photos.length > 0) {
      const primary = photos.find((p: any) => p.isPrimary);
      if (primary) return primary.dataUrl;
      return photos[0].dataUrl;
    }
    return sender.gender === "Female"
      ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60";
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between shrink-0 relative z-30">
      {/* Search Bar placeholder */}
      <div className="relative flex-1 max-w-sm">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search profiles..."
          onClick={() => router.push("/dashboard/search")}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
        />
      </div>

      {/* Action triggers */}
      <div className="flex items-center gap-4 ml-4 relative" ref={dropdownRef}>
        <AmbientMusicPlayer />
        
        {/* Notification Bell with counter */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`relative p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors ${
            showDropdown ? "bg-gray-50 text-brand-600" : ""
          }`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center animate-pulse border border-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Real-time drop-down menu panel */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden z-50 flex flex-col"
            >
              {/* Dropdown Header */}
              <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-brand-600" /> Notifications
                  {unreadCount > 0 && (
                    <span className="bg-brand-100 text-brand-700 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                      {unreadCount} new
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-brand-600 hover:text-brand-700 font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              {/* Notification items list */}
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Sparkles className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-700">All caught up!</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Likes and message alerts appear here.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isUnread = !notif.is_read;
                    const isInterest = notif.type.startsWith("INTEREST");
                    const iconStyle = isInterest 
                      ? "bg-pink-50 text-pink-600 border border-pink-100" 
                      : "bg-brand-50 text-brand-600 border border-brand-100";

                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full p-4 flex gap-3 hover:bg-gray-50/70 text-left transition-colors relative ${
                          isUnread ? "bg-brand-50/20" : ""
                        }`}
                      >
                        <div className="shrink-0 relative">
                          <img
                            src={getAvatarUrl(notif.sender)}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-gray-100"
                          />
                          <span className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ${iconStyle}`}>
                            {isInterest ? <Heart className="w-2.5 h-2.5 fill-current" /> : <MessageSquare className="w-2.5 h-2.5 fill-current" />}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className={`text-xs font-bold text-gray-900 truncate ${isUnread ? "pr-2" : ""}`}>
                              {notif.title}
                            </p>
                            {isUnread && (
                              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed break-words">
                            {notif.message}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-1.5">
                            {new Date(notif.created_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User initials block */}
        <div className="w-9 h-9 rounded-xl bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-extrabold text-sm cursor-pointer hover:bg-brand-200 transition-colors uppercase shadow-sm">
          {userName.charAt(0)}
        </div>
      </div>
    </header>
  );
}
