"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, ArrowRight, Loader2, Sparkles, X, Check, Unlock, Inbox, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

interface Profile {
  id: number;
  first_name: string;
  last_name: string;
  gender: string;
  location: string;
  cast: string;
  dob: string;
  profile_details?: any;
  interest_status?: string;
}

export default function InterestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sent" | "received" | "mutual">("mutual");
  const [initialTabSet, setInitialTabSet] = useState(false);
  const [sentList, setSentList] = useState<any[]>([]);
  const [receivedList, setReceivedList] = useState<any[]>([]);
  const [mutualList, setMutualList] = useState<any[]>([]);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const fetchAllInterests = async () => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/user/interest`, {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const data = await res.json();
      
      if (data.success) {
        const resolveAvatar = (u: Profile, index: number) => {
          let avatar = `https://i.pravatar.cc/200?img=${30 + (index % 30)}`;
          const photos = u.profile_details?.mn_profile_photos_draft?.photos;
          if (photos && photos.length > 0) {
            const primary = photos.find((p: any) => p.isPrimary);
            avatar = primary ? primary.dataUrl : photos[0].dataUrl;
          }
          return avatar;
        };

        const mapUser = (u: Profile, idx: number) => {
          if (!u) return null;
          return {
            id: u.id,
            name: `${u.first_name} ${u.last_name}`,
            age: u.dob ? Math.floor((new Date().getTime() - new Date(u.dob).getTime()) / 31557600000) : 25,
            location: u.location || "Kerala",
            img: resolveAvatar(u, idx),
            caste: u.cast || "Sunni",
            gender: u.gender,
            interest_status: u.interest_status || "PENDING"
          };
        };

        const sent = (data.sent || [])
          .map((u: Profile, i: number) => mapUser(u, i))
          .filter(Boolean)
          .filter((p: any) => p.interest_status === "PENDING");

        const received = (data.received || [])
          .map((u: Profile, i: number) => mapUser(u, i))
          .filter(Boolean)
          .filter((p: any) => p.interest_status === "PENDING");

        const mutual = (data.mutual || [])
          .map((u: Profile, i: number) => mapUser(u, i))
          .filter(Boolean);

        setSentList(sent);
        setReceivedList(received);
        setMutualList(mutual);

        // Smart Initial Tab Focus: Focus on the tab that actually has items so the user doesn't see an empty page first
        if (!initialTabSet) {
          if (mutual.length > 0) {
            setActiveTab("mutual");
          } else if (received.length > 0) {
            setActiveTab("received");
          } else if (sent.length > 0) {
            setActiveTab("sent");
          }
          setInitialTabSet(true);
        }
      }
    } catch (e) {
      console.error("Failed to load interests:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllInterests();
  }, []);

  // Handle express/accept/withdraw interest toggling
  const handleAction = async (targetId: number, successMessage: string) => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) return;

      setLoading(true);
      const res = await fetch(`${API_URL}/user/interest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${storedToken}`
        },
        body: JSON.stringify({ receiver_id: targetId })
      });

      const data = await res.json();
      if (data.success) {
        setAlertMsg(successMessage);
        await fetchAllInterests();
      }
    } catch (e) {
      console.error("Action failed:", e);
    } finally {
      setLoading(false);
    }
  };

  // Automatically dismiss alerts
  useEffect(() => {
    if (alertMsg) {
      const t = setTimeout(() => setAlertMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alertMsg]);

  const activeList = activeTab === "mutual" ? mutualList : activeTab === "sent" ? sentList : receivedList;

  return (
    <div className="space-y-8 pb-10 relative">
      {/* Dynamic alert banner */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 border border-gray-800"
          >
            <span>{alertMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-2xl font-bold font-playfair text-gray-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-brand-600 fill-brand-600" />
          Interests & Matches
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your connections. Discover mutual matches, incoming responses, and outgoing interest requests.
        </p>
      </div>

      {/* Modern Tabs */}
      <div className="flex bg-gray-100/80 p-1.5 rounded-2xl w-full max-w-md border border-gray-200/50">
        {[
          { id: "mutual", label: "Matches", count: mutualList.length, icon: Sparkles },
          { id: "received", label: "Received", count: receivedList.length, icon: Inbox },
          { id: "sent", label: "Sent", count: sentList.length, icon: Send },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all relative ${
                isActive
                  ? "bg-white text-brand-700 shadow-sm border border-gray-200/40"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-brand-600" : "text-gray-400"}`} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-600"} font-extrabold`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin mb-3 text-brand-500" />
          <p className="font-semibold text-sm">Loading your interests...</p>
        </div>
      ) : activeList.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 mb-4 border border-brand-100/50">
            {activeTab === "mutual" ? (
              <Sparkles className="w-8 h-8" />
            ) : activeTab === "sent" ? (
              <Send className="w-7 h-7" />
            ) : (
              <Inbox className="w-8 h-8" />
            )}
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {activeTab === "mutual"
              ? "No Mutual Matches Yet"
              : activeTab === "sent"
              ? "No Sent Interests"
              : "No Interests Received"}
          </h3>
          <p className="text-gray-500 text-xs mt-1 max-w-sm px-6">
            {activeTab === "mutual"
              ? "Interests become mutual when both of you express interest in each other. Keep exploring profiles!"
              : activeTab === "sent"
              ? "When you find profiles you like in Search, press the Interest button to send a request."
              : "Incoming interest requests will appear here. Upgrade your profile or keep it complete to stand out!"}
          </p>
          <button
            onClick={() => router.push("/dashboard/search")}
            className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/10 transition-colors"
          >
            Explore Profiles <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {activeList.map((p, idx) => {
            const isMatched = p.interest_status === "ACCEPTED";
            
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:shadow-brand-900/5 hover:border-brand-100 transition-all duration-300 flex flex-col"
              >
                {/* Profile Card Header with Photo */}
                <div className="h-44 relative bg-gray-50 overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/10 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h3 className="font-bold text-sm truncate">{p.name}</h3>
                    <p className="text-[10px] text-gray-200 mt-0.5">{p.age} yrs • {p.location}</p>
                  </div>
                  {isMatched && (
                    <span className="absolute top-3 right-3 bg-pink-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Mutual Match
                    </span>
                  )}
                </div>

                {/* Card Details & Actions */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="text-[11px] text-gray-500 font-medium flex items-center justify-between">
                    <span>Community: <strong className="text-gray-800 font-semibold">{p.caste}</strong></span>
                    <span className="text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md font-semibold">Verified</span>
                  </div>

                  <div className="flex gap-2">
                    {/* Mutual Match / Accepted Relationship Actions */}
                    {isMatched ? (
                      <button
                        onClick={() => router.push("/dashboard/chat")}
                        className="w-full py-2.5 bg-brand-600 text-white hover:bg-brand-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Chat Now
                      </button>
                    ) : (
                      <>
                        {/* Pending Received Requests Actions */}
                        {activeTab === "received" && (
                          <>
                            <button
                              onClick={() => handleAction(p.id, `Match established with ${p.name}! 🎉`)}
                              className="flex-1 py-2.5 bg-brand-600 text-white hover:bg-brand-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            >
                              <Check className="w-3.5 h-3.5" /> Accept
                            </button>
                            <button
                              onClick={() => handleAction(p.id, `Interest request from ${p.name} declined.`)}
                              className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-gray-200 active:scale-[0.98]"
                            >
                              <X className="w-3.5 h-3.5 text-gray-400" /> Ignore
                            </button>
                          </>
                        )}

                        {/* Pending Sent Requests Actions */}
                        {activeTab === "sent" && (
                          <button
                            onClick={() => handleAction(p.id, `Withdrew interest for ${p.name}.`)}
                            className="w-full py-2.5 bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                          >
                            <X className="w-3.5 h-3.5" /> Withdraw Request
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
