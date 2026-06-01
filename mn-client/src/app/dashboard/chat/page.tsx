"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, Phone, Video, MessageSquare, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

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
  
  // Track unread counts per peer ID
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          const socket = io("http://localhost:3333", {
            transports: ["websocket", "polling"]
          });
          socketRef.current = socket;

          // Join personal socket room
          socket.emit("join", payload.userId);

          // Handle real-time private messages
          socket.on("private_message", (msg: Message) => {
            setMessages((prev) => {
              // Append only if the message belongs to current selected peer session
              const isCurrentChat =
                (msg.sender_id === payload.userId && msg.receiver_id === selectedPeer?.id) ||
                (msg.sender_id === selectedPeer?.id && msg.receiver_id === payload.userId);
              
              if (isCurrentChat) {
                return [...prev, msg];
              }
              return prev;
            });

            // If message is from another match, increment their unread counter
            if (msg.sender_id !== payload.userId && msg.sender_id !== selectedPeer?.id) {
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
  }, [selectedPeer]);

  // 2. Fetch Mutual Matches
  useEffect(() => {
    if (!token) return;

    const fetchMatches = async () => {
      try {
        const res = await fetch("http://localhost:3333/user/interest", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success && data.mutual) {
          setMatches(data.mutual);
          
          // Automatically select first match if present and none is selected
          if (data.mutual.length > 0 && !selectedPeer) {
            setSelectedPeer(data.mutual[0]);
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
        const res = await fetch(`http://localhost:3333/user/chat/history/${selectedPeer.id}`, {
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
  }, [messages]);

  // 5. Send Message REST handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token || !selectedPeer || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      const res = await fetch("http://localhost:3333/user/chat/message", {
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
    return peer.gender === "Female" 
      ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=60"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=60";
  };

  // Filter matches based on search query
  const filteredMatches = matches.filter((peer) => {
    const fullName = `${peer.first_name} ${peer.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (isLoadingMatches) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center h-[calc(100vh-12rem)] shadow-sm">
        <div className="text-center">
          <span className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin inline-block mb-3" />
          <p className="text-sm font-medium text-gray-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  // If there are absolutely no mutual interests matched yet
  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center p-8 h-[calc(100vh-12rem)] shadow-sm">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mx-auto mb-5">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Chatting is Locked</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            To ensure complete privacy and modesty, chatting is unlocked **only when you and another member mutually express interest** in each other!
          </p>
          <button
            onClick={() => router.push("/dashboard/search")}
            className="mt-6 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-brand-600/10 active:scale-[0.98]"
          >
            Find Prospective Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex h-[calc(100vh-12rem)] shadow-sm">
      {/* Sidebar - Conversation list */}
      <div className="w-full sm:w-72 lg:w-80 shrink-0 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
          {filteredMatches.map((peer) => {
            const isSelected = selectedPeer?.id === peer.id;
            const unread = unreadCounts[peer.id] || 0;
            return (
              <button
                key={peer.id}
                onClick={() => setSelectedPeer(peer)}
                className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50/70 transition-colors text-left relative ${
                  isSelected ? "bg-brand-50/60" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={getAvatarUrl(peer)}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border border-gray-100"
                  />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {peer.first_name} {peer.last_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {peer.cast} • {peer.location}
                  </p>
                </div>
                {isSelected && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1 flex flex-col bg-gray-50/20">
        {selectedPeer ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <img
                  src={getAvatarUrl(selectedPeer)}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-gray-100"
                />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {selectedPeer.first_name} {selectedPeer.last_name}
                  </p>
                  <p className="text-xs text-brand-500 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                    Chat Active
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors">
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages display */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {isLoadingHistory ? (
                <div className="h-full flex items-center justify-center">
                  <span className="w-6 h-6 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-brand-200 mb-2" />
                  <p className="text-sm font-semibold text-gray-800">No Messages Yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
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
                        className={`max-w-xs sm:max-w-md px-4 py-3 rounded-2xl text-sm shadow-sm ${
                          isMe
                            ? "bg-brand-600 text-white rounded-br-sm"
                            : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
                        }`}
                      >
                        <p className="leading-relaxed break-words">{msg.content}</p>
                        <p
                          className={`text-[9px] text-right mt-1.5 ${
                            isMe ? "text-brand-200" : "text-gray-400"
                          }`}
                        >
                          {messageTime}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message safely..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder-gray-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shrink-0 shadow-sm"
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
