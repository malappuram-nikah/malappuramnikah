"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Send, Search, Phone, Video, MessageSquare, AlertCircle, ArrowLeft, ExternalLink, CheckCheck, User, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";

interface PeerProfile {
  id: number;
  first_name: string;
  last_name: string;
  cast: string;
  location: string;
  gender: string;
  profile_details?: any;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [matches, setMatches] = useState<PeerProfile[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<PeerProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mobile View state: on small screens, controls whether we show the list or the conversation
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  
  // Track unread counts per peer ID
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedPeerRef = useRef<PeerProfile | null>(null);

  useEffect(() => {
    selectedPeerRef.current = selectedPeer;
  }, [selectedPeer]);

  // 1. Initial Authentication & Socket Connection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("mn_token");
    setToken(storedToken);

    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        if (payload.userId) {
          setUserId(payload.userId);
          
          // Connect to Realtime Socket.io server
          const socket = io(`${API_URL}`, {
            transports: ["websocket", "polling"]
          });
          socketRef.current = socket;

          // Join personal socket room
          socket.emit("join", payload.userId);

          // Handle real-time private messages
          socket.on("private_message", (msg: Message) => {
            setMessages((prev) => {
              // Append only if the message belongs to current selected peer session
              const currentPeer = selectedPeerRef.current;
              const isCurrentChat =
                (msg.sender_id === payload.userId && msg.receiver_id === currentPeer?.id) ||
                (msg.sender_id === currentPeer?.id && msg.receiver_id === payload.userId);
              
              if (isCurrentChat) {
                return [...prev, msg];
              }
              return prev;
            });

            // If message is from another match, increment their unread counter
            const currentPeer = selectedPeerRef.current;
            if (msg.sender_id !== payload.userId && msg.sender_id !== currentPeer?.id) {
              setUnreadCounts((prev) => ({
                ...prev,
                [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
              }));
            }
          });

          return () => {
            socket.disconnect();
          };
        }
      } catch (e) {
        console.error("Token parsing error:", e);
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  // 2. Fetch Mutual Matches
  useEffect(() => {
    if (!token) return;

    const fetchMatches = async () => {
      try {
        const res = await fetch(`${API_URL}/user/interest?type=mutual&page=1&limit=50`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success && data.users) {
          setMatches(data.users);
          
          // Automatically select first match if on desktop/tablet and none is selected
          if (data.users.length > 0 && !selectedPeer) {
            setSelectedPeer(data.users[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch mutual matches:", err);
      } finally {
        setIsLoadingMatches(false);
      }
    };

    fetchMatches();
  }, [token]);

  // 3. Fetch Message History when Peer changes
  useEffect(() => {
    if (!token || !selectedPeer) return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(`${API_URL}/user/chat/history/${selectedPeer.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
          
          // Reset unread count for this peer
          setUnreadCounts((prev) => ({
            ...prev,
            [selectedPeer.id]: 0
          }));
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [selectedPeer, token]);

  // 4. Scroll to Bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mobileView]);

  // 5. Send Message REST handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token || !selectedPeer || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      const res = await fetch(`${API_URL}/user/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_id: selectedPeer.id,
          content
        })
      });
      
      const data = await res.json();
      if (!data.success) {
        console.error("Failed to send message:", data.message);
      }
    } catch (err) {
      console.error("Message send network error:", err);
    }
  };

  // Profile Image Resolver
  const getAvatarUrl = (peer: PeerProfile) => {
    const photos = peer.profile_details?.mn_profile_photos_draft?.photos;
    if (photos && photos.length > 0) {
      const primary = photos.find((p: any) => p.isPrimary);
      if (primary) return primary.dataUrl;
      return photos[0].dataUrl;
    }
    return "";
  };

  // Filter matches based on search query
  const filteredMatches = matches.filter((peer) => {
    const fullName = `${peer.first_name || ""} ${peer.last_name || ""}`.toLowerCase();
    const cast = (peer.cast || "").toLowerCase();
    const loc = (peer.location || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || cast.includes(query) || loc.includes(query);
  });

  const selectPeerOnMobile = (peer: PeerProfile) => {
    setSelectedPeer(peer);
    setMobileView("chat");
  };

  if (isLoadingMatches) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center h-[calc(100dvh-7rem)] sm:h-[calc(100dvh-8rem)] md:h-[calc(100vh-10rem)] shadow-sm">
        <div className="text-center p-6">
          <span className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin inline-block mb-3" />
          <p className="text-sm font-medium text-gray-500">Loading secure chat conversations...</p>
        </div>
      </div>
    );
  }

  // If there are absolutely no mutual interests matched yet
  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center p-6 h-[calc(100dvh-7rem)] sm:h-[calc(100dvh-8rem)] md:h-[calc(100vh-10rem)] shadow-sm">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mx-auto mb-4">
            <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Chatting is Locked</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
            To ensure complete privacy and modesty, chatting is unlocked <strong>only when you and another member mutually express interest</strong> in each other!
          </p>
          <button
            onClick={() => router.push("/dashboard/search")}
            className="mt-5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            Find Prospective Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white md:rounded-2xl md:border md:border-gray-100 overflow-hidden flex flex-1 h-full w-full shadow-none md:shadow-sm relative">
      {/* Sidebar - Conversation list */}
      <div
        className={`w-full md:w-72 lg:w-80 shrink-0 border-r border-gray-100 flex flex-col bg-white transition-all ${
          mobileView === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Search header */}
        <div className="p-3.5 sm:p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-2 md:hidden">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              Messages
            </h2>
            <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
              {matches.length} Matches
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search mutual matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder:text-gray-400"
            />
          </div>
        </div>
        
        {/* Conversation list */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-50 pb-20 sm:pb-0">
          {filteredMatches.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-xs">
              No matching conversation found
            </div>
          ) : (
            filteredMatches.map((peer) => {
              const isSelected = selectedPeer?.id === peer.id;
              const unread = unreadCounts[peer.id] || 0;
              const avatar = getAvatarUrl(peer);
              return (
                <button
                  key={peer.id}
                  type="button"
                  onClick={() => selectPeerOnMobile(peer)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3.5 sm:px-4 sm:py-4 hover:bg-gray-50/80 transition-colors text-left relative cursor-pointer ${
                    isSelected ? "bg-brand-50/70" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt=""
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-gray-100 shadow-2xs"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-extrabold text-xs sm:text-sm uppercase shadow-2xs">
                        {peer.first_name?.charAt(0) || "U"}
                      </div>
                    )}
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-brand-600 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                        {unread}
                      </span>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {peer.first_name} {peer.last_name}
                      </p>
                      <span className="text-[9px] text-gray-400 font-medium shrink-0">
                        Mutual
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {peer.cast || "Sunni"} • {peer.location || "Malappuram"}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="hidden md:block absolute right-0 top-0 bottom-0 w-1 bg-brand-600 rounded-l" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat window */}
      <div
        className={`flex-1 min-h-0 flex flex-col bg-gray-50/20 overflow-hidden ${
          mobileView === "list" ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedPeer ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-3.5 py-3 sm:px-6 sm:py-3.5 border-b border-gray-100 bg-white shrink-0 shadow-2xs">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
                  title="Back to Conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {getAvatarUrl(selectedPeer) ? (
                  <img
                    src={getAvatarUrl(selectedPeer)}
                    alt=""
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-100 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-extrabold text-xs sm:text-sm uppercase shrink-0">
                    {selectedPeer.first_name?.charAt(0) || "U"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                    {selectedPeer.first_name} {selectedPeer.last_name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Online & Active
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/profile/${selectedPeer.id}`)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="View Full Profile"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Audio calls coming soon!")}
                  className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors cursor-pointer"
                  title="Audio Call (Coming Soon)"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Video calls coming soon!")}
                  className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors cursor-pointer"
                  title="Video Call (Coming Soon)"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages display */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-5 space-y-3 sm:space-y-4">
              {isLoadingHistory ? (
                <div className="h-full flex items-center justify-center">
                  <span className="w-6 h-6 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 mb-2">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800">No Messages Yet</p>
                  <p className="text-[11px] sm:text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                    Say Assalamu Alaikum to open your mutual matched conversation with pious intention.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === userId;
                  const messageTime = new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-md px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-xs sm:text-sm shadow-2xs ${
                          isMe
                            ? "bg-brand-600 text-white rounded-br-xs"
                            : "bg-white text-gray-800 rounded-bl-xs border border-gray-150"
                        }`}
                      >
                        <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                        <div
                          className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                            isMe ? "text-brand-100" : "text-gray-400"
                          }`}
                        >
                          <span>{messageTime}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-brand-200" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 pb-20 sm:pb-4 border-t border-gray-100 bg-white shrink-0 z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder-gray-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 sm:p-3.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 active:scale-[0.96] transition-all disabled:opacity-40 disabled:scale-100 shrink-0 shadow-sm cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
            <h3 className="text-sm font-bold text-gray-900">Select a Conversation</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Pick a mutual match from the left menu to start messaging safely.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
