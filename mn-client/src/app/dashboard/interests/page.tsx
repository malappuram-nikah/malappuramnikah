"use client";
/* eslint-disable react-hooks/set-state-in-effect */

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
  const [activeTab, setActiveTab] = useState<"mutual" | "received" | "sent" | "viewed_me" | "visited">((() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "mutual" || tab === "received" || tab === "sent" || tab === "viewed_me" || tab === "visited") {
        return tab;
      }
    }
    return "mutual";
  })());
  
  const [mutualList, setMutualList] = useState<any[]>([]);
  const [receivedList, setReceivedList] = useState<any[]>([]);
  const [sentList, setSentList] = useState<any[]>([]);
  const [viewedMeList, setViewedMeList] = useState<any[]>([]);
  const [visitedList, setVisitedList] = useState<any[]>([]);
  
  const [mutualPage, setMutualPage] = useState(1);
  const [receivedPage, setReceivedPage] = useState(1);
  const [sentPage, setSentPage] = useState(1);
  const [viewedMePage, setViewedMePage] = useState(1);
  const [visitedPage, setVisitedPage] = useState(1);
  
  const [mutualHasMore, setMutualHasMore] = useState(true);
  const [receivedHasMore, setReceivedHasMore] = useState(true);
  const [sentHasMore, setSentHasMore] = useState(true);
  const [viewedMeHasMore, setViewedMeHasMore] = useState(true);
  const [visitedHasMore, setVisitedHasMore] = useState(true);
  
  const [fetching, setFetching] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const resolveAvatar = (u: any, index: number) => {
    let avatar = "";
    const photos = u.profile_details?.mn_profile_photos_draft?.photos;
    if (photos && photos.length > 0) {
      const primary = photos.find((p: any) => p.isPrimary);
      avatar = primary ? primary.dataUrl : photos[0].dataUrl;
    }
    return avatar;
  };

  const mapUser = (u: any, idx: number) => {
    if (!u) return null;
    const profileDetails = u.profile_details || {};
    const professional = profileDetails.mn_professional_info_draft || {};
    const basic = profileDetails.mn_basic_details_draft || {};
    return {
      id: u.id,
      uuid: u.uuid || String(u.id),
      mnId: (u as any).mn_id || (u.id ? `MN-${100000 + u.id}` : "MN-ID"),
      name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Member",
      age: u.dob ? Math.floor((new Date().getTime() - new Date(u.dob).getTime()) / 31557600000) : 25,
      location: basic.presentLocation || u.location || "Kerala",
      img: resolveAvatar(u, idx),
      caste: u.cast || "Sunni",
      gender: u.gender,
      education: professional.education || "Not specified",
      profession: professional.profession || "Not specified",
      interest_status: u.interest_status || "PENDING",
      is_online: Boolean(u.is_online),
      viewed_at: u.viewed_at || null
    };
  };

  const fetchTab = async (tab: "mutual" | "received" | "sent" | "viewed_me" | "visited", page: number, isLoadMore = false) => {
    if (fetching) return;
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }
      
      setFetching(true);
      if (!isLoadMore) setLoading(true);

      const res = await fetch(`${API_URL}/user/interest?type=${tab}&page=${page}&limit=20`, {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const data = await res.json();
      
      if (data.success) {
        const mapped = (data.users || []).map((u: any, i: number) => mapUser(u, i)).filter(Boolean);
        const hasMore = data.hasMore || false;
        
        const dedupe = (prev: any[], next: any[]) => {
          const map = new Map(prev.map(p => [p.id, p]));
          next.forEach(n => map.set(n.id, n));
          return Array.from(map.values());
        };
        
        if (tab === "mutual") {
          setMutualList(prev => isLoadMore ? dedupe(prev, mapped) : dedupe([], mapped));
          setMutualHasMore(hasMore);
        } else if (tab === "received") {
          setReceivedList(prev => isLoadMore ? dedupe(prev, mapped) : dedupe([], mapped));
          setReceivedHasMore(hasMore);
        } else if (tab === "sent") {
          setSentList(prev => isLoadMore ? dedupe(prev, mapped) : dedupe([], mapped));
          setSentHasMore(hasMore);
        } else if (tab === "viewed_me") {
          setViewedMeList(prev => isLoadMore ? dedupe(prev, mapped) : dedupe([], mapped));
          setViewedMeHasMore(hasMore);
        } else if (tab === "visited") {
          setVisitedList(prev => isLoadMore ? dedupe(prev, mapped) : dedupe([], mapped));
          setVisitedHasMore(hasMore);
        }
      }
    } catch (e) {
      console.error("Failed to load interests:", e);
    } finally {
      setFetching(false);
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTab(activeTab, 1, false);
  }, [activeTab]);

  const loadMore = () => {
    if (activeTab === "mutual" && mutualHasMore && !fetching) {
      const next = mutualPage + 1;
      setMutualPage(next);
      fetchTab("mutual", next, true);
    } else if (activeTab === "received" && receivedHasMore && !fetching) {
      const next = receivedPage + 1;
      setReceivedPage(next);
      fetchTab("received", next, true);
    } else if (activeTab === "sent" && sentHasMore && !fetching) {
      const next = sentPage + 1;
      setSentPage(next);
      fetchTab("sent", next, true);
    } else if (activeTab === "viewed_me" && viewedMeHasMore && !fetching) {
      const next = viewedMePage + 1;
      setViewedMePage(next);
      fetchTab("viewed_me", next, true);
    } else if (activeTab === "visited" && visitedHasMore && !fetching) {
      const next = visitedPage + 1;
      setVisitedPage(next);
      fetchTab("visited", next, true);
    }
  };

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    const target = document.getElementById("infinite-scroll-trigger");
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [activeTab, mutualHasMore, receivedHasMore, sentHasMore, viewedMeHasMore, visitedHasMore, fetching, mutualPage, receivedPage, sentPage, viewedMePage, visitedPage]);


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
        // Refresh current tab
        fetchTab(activeTab, 1, false);
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

  const activeList =
    activeTab === "mutual"
      ? mutualList
      : activeTab === "sent"
      ? sentList
      : activeTab === "received"
      ? receivedList
      : activeTab === "viewed_me"
      ? viewedMeList
      : visitedList;

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
          Interests & Profile Views
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your connections. Discover accepted interests, incoming requests, profile views, and visited profiles.
        </p>
      </div>

      {/* Modern Scrollable Tabs */}
      <div className="flex bg-gray-100/80 p-1.5 rounded-2xl w-full max-w-2xl border border-gray-200/50 overflow-x-auto gap-1">
        {[
          { id: "mutual", label: "Accepted", count: mutualList.length, icon: Check },
          { id: "received", label: "Received", count: receivedList.length, icon: Inbox },
          { id: "sent", label: "Sent", count: sentList.length, icon: Send },
          { id: "viewed_me", label: "Who Viewed Me", count: viewedMeList.length, icon: Sparkles },
          { id: "visited", label: "Profiles Visited", count: visitedList.length, icon: ArrowRight },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all relative shrink-0 cursor-pointer ${
                isActive
                  ? "bg-white text-brand-700 shadow-sm border border-gray-200/40"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-brand-600" : "text-gray-400"}`} />
              <span className="whitespace-nowrap">{tab.label}</span>
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
          <p className="font-semibold text-sm">Loading profiles...</p>
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
              ? "No Accepted Interests Yet"
              : activeTab === "sent"
              ? "No Sent Interests"
              : activeTab === "received"
              ? "No Interests Received"
              : activeTab === "viewed_me"
              ? "No Profile Visitors Yet"
              : "No Visited Profiles Yet"}
          </h3>
          <p className="text-gray-500 text-xs mt-1 max-w-sm px-6">
            {activeTab === "mutual"
              ? "Interests become mutual when both of you express interest in each other. Keep exploring profiles!"
              : activeTab === "sent"
              ? "When you find profiles you like in Search, press the Interest button to send a request."
              : activeTab === "received"
              ? "Incoming interest requests will appear here."
              : activeTab === "viewed_me"
              ? "Members who view your profile will appear here. Keep your profile updated to get noticed!"
              : "Profiles you visit will be listed here for quick access."}
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
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
        >
          {activeList.map((p, idx) => {
            const isMatched = p.interest_status === "ACCEPTED";
            
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => router.push(`/dashboard/profile/${p.uuid || p.id}`)}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-brand-900/10 hover:border-brand-200 transition-all duration-300 flex flex-col cursor-pointer group select-none"
              >
                {/* Profile Card Header with Portrait Photo (aspect-[4/5]) */}
                <div className="relative aspect-[4/5] w-full bg-gray-900 overflow-hidden">
                  {p.img ? (
                    <img
                      src={p.img}
                      alt={p.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#026d77]/20 to-[#026d77]/40 flex flex-col items-center justify-center p-4">
                      <img src="/logoMain-01.svg" alt="MN Logo" className="w-20 h-20 object-contain opacity-70 mb-2" />
                      <span className="text-xs font-bold text-white/80 tracking-wider">Malappuram Nikah</span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                    <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/20 shadow-sm">
                      {p.mnId}
                    </span>
                    {isMatched ? (
                      <span className="bg-pink-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Verified ID
                      </span>
                    )}
                  </div>

                  {/* Bottom Vignette Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                  {/* Overlay Name & Age & Location */}
                  <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none z-10">
                    <h3 className="font-bold text-base truncate flex items-center gap-1.5 group-hover:text-brand-200 transition-colors">
                      {p.name}
                      {p.is_online && (
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" title="Online now" />
                      )}
                    </h3>
                    <p className="text-xs text-gray-200 mt-0.5 font-medium truncate">
                      {p.age} yrs • {p.caste || "Muslim"} • {p.location}
                    </p>
                  </div>
                </div>

                {/* Card Details & Actions */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-white">
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-50/80 p-2.5 rounded-xl border border-gray-150">
                    <div className="flex flex-col truncate">
                      <span className="text-[10px] text-gray-400 font-medium">Profession</span>
                      <span className="font-semibold text-gray-800 truncate">{p.profession || "Not specified"}</span>
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-[10px] text-gray-400 font-medium">Education</span>
                      <span className="font-semibold text-gray-800 truncate">{p.education || "Not specified"}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
                    {/* Actions */}
                    {isMatched ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/dashboard/chat");
                        }}
                        className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Start Chat
                      </button>
                    ) : (
                      <>
                        {activeTab === "received" && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(p.id, `Match established with ${p.name}! 🎉`);
                              }}
                              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Accept
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(p.id, `Interest request from ${p.name} declined.`);
                              }}
                              className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-gray-200 active:scale-[0.98] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5 text-gray-400" /> Ignore
                            </button>
                          </>
                        )}

                        {activeTab === "sent" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(p.id, `Withdrew interest for ${p.name}.`);
                            }}
                            className="w-full py-2.5 bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer border border-pink-100"
                          >
                            <X className="w-3.5 h-3.5" /> Withdraw Request
                          </button>
                        )}

                        {(activeTab === "viewed_me" || activeTab === "visited") && (
                          <div className="flex w-full gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/profile/${p.uuid || p.id}`);
                              }}
                              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              View Profile
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(p.id, `Expressed interest in ${p.name}!`);
                              }}
                              className="px-3.5 py-2.5 bg-pink-50 text-pink-700 hover:bg-pink-100 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-pink-100"
                              title="Express Interest"
                            >
                              <Heart className="w-4 h-4 text-pink-600 fill-pink-600" />
                            </button>
                          </div>
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
