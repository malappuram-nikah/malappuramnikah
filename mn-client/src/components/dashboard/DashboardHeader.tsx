"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from "react";
import { Bell, Search, Heart, MessageSquare, Check, Sparkles, X, User, Settings, LogOut } from "lucide-react";
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
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const calculateCompletionPercent = () => {
    const draftKeys = [
      "mn_basic_details_draft",
      "mn_religious_info_draft",
      "mn_professional_info_draft",
      "mn_family_details_draft",
      "mn_interests_draft",
      "mn_habits_draft",
      "mn_partner_preferences_draft",
      "mn_profile_photos_draft",
      "mn_video_intro_draft",
      "mn_voice_intro_draft"
    ];
    let completedCount = 0;
    draftKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (key === "mn_profile_photos_draft" && (!parsed.photos || parsed.photos.length === 0)) {
            // not complete
          } else if (key === "mn_video_intro_draft" && !parsed.video) {
            // not complete
          } else if (key === "mn_voice_intro_draft" && !parsed.voice) {
            // not complete
          } else {
            completedCount++;
          }
        }
      } catch (e) {}
    });
    setCompletionPercent(Math.round((completedCount / draftKeys.length) * 100));
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update completion percent when profile dropdown is opened
  useEffect(() => {
    if (showProfileDropdown) {
      calculateCompletionPercent();
    }
  }, [showProfileDropdown]);

  const fetchUserProfile = async (uId: number, jwtToken: string) => {
    try {
      const res = await fetch(`http://localhost:3333/user/${uId}?t=${Date.now()}`, {
        headers: { "Authorization": `Bearer ${jwtToken}` },
        cache: "no-store"
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setUserName(data.user.first_name || "User");
        calculateCompletionPercent();
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
          socket.on("notification", () => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!sender) return "";
    const photos = sender.profile_details?.mn_profile_photos_draft?.photos;
    if (photos && photos.length > 0) {
      const primary = photos.find((p: any) => p.isPrimary);
      if (primary) return primary.dataUrl;
      return photos[0].dataUrl;
    }
    return "";
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
                          {getAvatarUrl(notif.sender) ? (
                            <img
                              src={getAvatarUrl(notif.sender)}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover border border-gray-100"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-extrabold text-xs uppercase shrink-0">
                              {(notif.sender?.first_name || notif.title || "U").charAt(0)}
                            </div>
                          )}
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

        {/* User initials / avatar block */}
        {(() => {
          const userPhotos = user?.profile_details?.mn_profile_photos_draft?.photos;
          const userPhotoUrl = userPhotos && userPhotos.length > 0 
            ? (userPhotos.find((p: any) => p.isPrimary)?.dataUrl || userPhotos[0].dataUrl)
            : null;

          return (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-9 h-9 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-extrabold text-sm cursor-pointer hover:bg-brand-200 transition-colors uppercase shadow-sm overflow-hidden focus:outline-none"
              >
                {userPhotoUrl ? (
                  <img 
                    src={userPhotoUrl} 
                    alt={userName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  userName.charAt(0)
                )}
              </button>

              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden z-50 flex flex-col"
                  >
                    {/* Dropdown Header / Simple Profile Details */}
                    <div className="p-4 border-b border-gray-100 flex flex-col gap-1.5 bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm overflow-hidden shrink-0">
                          {userPhotoUrl ? (
                            <img src={userPhotoUrl} alt={userName} className="w-full h-full object-cover" />
                          ) : (
                            userName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-gray-900 truncate">
                            {user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "User Profile"}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {user?.mobile_number || ""}
                          </p>
                        </div>
                      </div>

                      {user && (
                        <div className="mt-2.5 pt-2.5 border-t border-gray-150/50 grid grid-cols-2 gap-2 text-[10px] text-gray-600">
                          <div>
                            <span className="text-gray-400 block font-medium">Community</span>
                            <span className="font-bold text-gray-800 truncate block">{user.cast || ""}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-medium">Location</span>
                            <span className="font-bold text-gray-800 truncate block">{user.location || ""}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-medium">Gender</span>
                            <span className="font-bold text-gray-800 truncate block">{user.gender || ""}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-medium">Age</span>
                            <span className="font-bold text-gray-800 truncate block">
                              {(() => {
                                if (user.dob) {
                                  const birthYear = parseInt(user.dob.split("-")[0], 10);
                                  if (!isNaN(birthYear)) {
                                    return (new Date().getFullYear() - birthYear).toString() + " yrs";
                                  }
                                }
                                return "";
                              })()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Profile Completion indicator */}
                    <div className="px-4 py-3 bg-brand-50/30 border-b border-gray-100 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-brand-700">
                        <span>Profile strength</span>
                        <span>{completionPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-600 rounded-full" style={{ width: `${completionPercent}%` }} />
                      </div>
                    </div>

                    {/* Actions List */}
                    <div className="p-1.5 flex flex-col gap-0.5">
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          router.push("/dashboard/profile-builder");
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-brand-50 hover:text-brand-700 rounded-xl transition-all flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        Edit Matrimony Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          router.push("/dashboard/settings");
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-brand-50 hover:text-brand-700 rounded-xl transition-all flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        Account Settings
                      </button>
                    </div>

                    {/* Footer Sign Out */}
                    <div className="p-1.5 border-t border-gray-100 bg-gray-50/50">
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          localStorage.removeItem("mn_token");
                          localStorage.removeItem("mn_logged_in_user_id");
                          const draftKeys = [
                            "mn_basic_details_draft",
                            "mn_religious_info_draft",
                            "mn_professional_info_draft",
                            "mn_family_details_draft",
                            "mn_interests_draft",
                            "mn_habits_draft",
                            "mn_partner_preferences_draft",
                            "mn_profile_photos_draft",
                            "mn_video_intro_draft",
                            "mn_voice_intro_draft"
                          ];
                          draftKeys.forEach((key) => localStorage.removeItem(key));
                          window.location.href = "/login";
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}
      </div>
    </header>
  );
}
