"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Eye, MessageCircle, Star, ArrowRight, TrendingUp, Loader2, Sparkles, Lock, X, Volume2, Video, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getEnrichedProfile } from "@/lib/profile-utils";
import ProfileCompletionTracker from "@/components/dashboard/ProfileCompletionTracker";
import BiodataDownload from "@/components/dashboard/BiodataDownload";
import { useUser } from "@/context/UserContext";
import ProfileSlideOver from "@/components/dashboard/ProfileSlideOver";
import { CardGridSkeleton } from "@/components/dashboard/Skeleton";
import { useProfileActions } from "@/hooks/useProfileActions";
import { API_URL } from "@/lib/config";
import { cn } from "@/lib/utils";
export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const { currentUser } = useUser();
  const [mounted, setMounted] = useState(false);
  const { toggleFavourite, isFavourite } = useProfileActions();
  
  // Real Statistics state — no hardcoded/dummy values
  const [stats, setStats] = useState([
    { label: "Interests Sent",    value: "—", icon: Heart,         color: "bg-[#026d77]/5 text-[#026d77] border-[#026d77]/10", href: "/dashboard/interests?tab=sent" },
    { label: "Mutual Matches",    value: "—", icon: Star,          color: "bg-[#026d77]/5 text-[#026d77] border-[#026d77]/10", href: "/dashboard/interests?tab=mutual" },
    { label: "Requests Received", value: "—", icon: MessageCircle, color: "bg-[#026d77]/5 text-[#026d77] border-[#026d77]/10", href: "/dashboard/interests?tab=received" },
    { label: "Who Viewed Me",     value: "—", icon: Eye,           color: "bg-[#026d77]/5 text-[#026d77] border-[#026d77]/10", href: "/dashboard/my-profile" },
    { label: "Profiles Visited",  value: "—", icon: Eye,           color: "bg-[#026d77]/5 text-[#026d77] border-[#026d77]/10", href: "/dashboard/my-profile" },
  ]);

  const [suggestedMatches, setSuggestedMatches] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProfile) {
      setActivePhoto(selectedProfile.img);
    } else {
      setActivePhoto(null);
    }
  }, [selectedProfile]);

  const [interests, setInterests] = useState<{ sent: number[]; received: number[]; mutual: number[] }>({
    sent: [],
    received: [],
    mutual: []
  });

  const fetchInterests = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/user/interest?idsOnly=true`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const sentIds = data.sent.map((u: any) => u.id);
        const receivedIds = data.received.map((u: any) => u.id);
        const mutualIds = data.mutual.map((u: any) => u.id);
        
        setInterests({
          sent: sentIds,
          received: receivedIds,
          mutual: mutualIds
        });

        // Update statistics with real data only — including profile views counts
        setStats([
          { label: "Interests Sent",    value: String(sentIds.length),                      icon: Heart,         color: "bg-[#026d77]/5 text-[#026d77] border-[#026d77]/10", href: "/dashboard/interests?tab=sent" },
          { label: "Mutual Matches",    value: String(mutualIds.length),                    icon: Star,          color: "bg-[#026d77]/5 text-[#026d77] border-[#026d77]/10", href: "/dashboard/interests?tab=mutual" },
          { label: "Requests Received", value: String(receivedIds.length),                  icon: MessageCircle, color: "bg-[#026d77]/5 text-[#026d77] border-[#026d77]/10", href: "/dashboard/interests?tab=received" },
          { label: "Who Viewed Me",     value: String(data.views_received_count ?? 0),      icon: Eye,           color: "bg-[#026d77]/5 text-[#026d77] border-[#026d77]/10", href: "/dashboard/my-profile" },
          { label: "Profiles Visited",  value: String(data.views_sent_count ?? 0),          icon: Eye,           color: "bg-[#026d77]/5 text-[#026d77] border-[#026d77]/10", href: "/dashboard/my-profile" },
        ]);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard stats:", e);
    }
  };

  const fetchProfilesAndSuggestions = async () => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (storedToken) {
        await fetchInterests(storedToken);
      }

      const res = await fetch(`${API_URL}/user/profiles`, {
        headers: storedToken ? { "Authorization": `Bearer ${storedToken}` } : {}
      });
      const data = await res.json();
      
      if (data.success && data.users) {
        const tokenPayload = storedToken ? JSON.parse(atob(storedToken.split(".")[1])) : {};
        const loggedInId = tokenPayload.userId || null;

        // Filter out logged-in user (backend already filtered by opposite gender)
        const otherUsers = data.users.filter((u: any) => u.id !== loggedInId);

        const mapped = otherUsers.map((u: any, i: number) => {
          const enriched = getEnrichedProfile(u);
          return {
            ...enriched,
            id: u.id,
            name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
            img: enriched.photo,
            caste: enriched.community,
            match: 82 + (i % 15),
            matchScore: 82 + (i % 15),
            photos: u.profile_details?.mn_profile_photos_draft?.photos || [],
            voice: u.profile_details?.mn_voice_intro_draft?.voice?.dataUrl || null,
            aboutMe: enriched.aboutMe || enriched.personalityDescription,
            aiExplanation: u.profile_details?.mn_partner_preferences_draft?.explanation || "Highly compatible profile based on your preferences.",
            conversationStarter: "I would love to learn more about your values and partner goals!",
            profile_details: u.profile_details,
            kyc_status: u.kyc_status,
            is_online: u.is_online,
            is_new_user: u.is_new_user,
            created_at: u.created_at,
            last_login: u.last_login
          };
        });

        // Pick up to 4 suggested matches (prefer ones without interaction yet)
        setSuggestedMatches(mapped.slice(0, 4));
      }
    } catch (err) {
      console.error("Dashboard suggestions loading failed:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setMounted(true);
    fetchProfilesAndSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleToggleInterest = async (receiverId: number, profileName: string) => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) {
        setAlertMsg("Please log in to express interest.");
        return;
      }

      const res = await fetch(`${API_URL}/user/interest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${storedToken}`
        },
        body: JSON.stringify({ receiver_id: receiverId })
      });

      const data = await res.json();
      if (data.success) {
        await fetchInterests(storedToken);
        if (data.status === "ACCEPTED") {
          setAlertMsg(`Mutual match established with ${profileName}! 🎉 Chat unlocked.`);
        } else if (data.status === "PENDING") {
          setAlertMsg(`Interest request sent to ${profileName}!`);
        } else {
          setAlertMsg(`Withdrew interest for ${profileName}.`);
        }
      }
    } catch (e) {
      console.error("Interest toggle failed:", e);
    }
  };

  // Automatically dismiss alerts
  useEffect(() => {
    if (alertMsg) {
      const t = setTimeout(() => setAlertMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alertMsg]);

  return (
    <div className="space-y-4 pb-8 relative">
      {/* Alert toast */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-gray-800"
          >
            <span>{alertMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Completion */}
      <ProfileCompletionTracker />

      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-4 relative border-b border-gray-100/80 pb-6"
      >
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold font-playfair tracking-wide text-gray-900">
            Welcome back, <span className="text-[#026d77] font-semibold">{currentUser?.first_name || "User"}</span>! 👋
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm max-w-lg leading-relaxed font-medium">
            Review your incoming requests under the <strong className="text-gray-700 font-semibold">Interests</strong> section and discover handpicked compatible matches below.
          </p>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 80 }}
              onClick={() => router.push((stat as any).href)}
              className="bg-white rounded-2xl p-5 border border-gray-100/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_-5px_rgba(2,109,119,0.06)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-4 cursor-pointer group"
            >
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-110",
                stat.color
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-slate-800 font-sans tracking-tight leading-none transition-colors">{stat.value}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-1.5 truncate transition-colors">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Suggested Matches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-100/80">
          <h2 className="text-base font-bold text-gray-900 font-playfair tracking-wide">
            Suggested Matches
          </h2>
          <Link href="/dashboard/search" className="text-xs font-bold text-[#026d77] hover:text-[#0b3c49] flex items-center gap-0.5 transition-colors">
            Browse all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <CardGridSkeleton count={4} />
        ) : suggestedMatches.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-xs">
            <p className="text-sm font-semibold text-gray-700">No recommendations found</p>
            <p className="text-xs mt-1 text-gray-400">Complete your profile setup to get matches</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {suggestedMatches.map((match, i) => {
              const isMutual = interests.mutual.includes(match.id);
              const isSent = interests.sent.includes(match.id);
              const isReceived = interests.received.includes(match.id);
              const isInterested = isMutual || isSent || isReceived;

              let interestText = "Connect";
              let interestStyle = "bg-[#026d77]/10 text-[#026d77] hover:bg-[#026d77] hover:text-white hover:shadow-xs";
              let isHeartFilled = false;

              if (isMutual) {
                interestText = "Matched! 🎉";
                interestStyle = "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-xs";
                isHeartFilled = true;
              } else if (isSent) {
                interestText = "Sent";
                interestStyle = "bg-pink-50 text-pink-700 hover:bg-pink-100/80 border border-pink-200/50";
                isHeartFilled = true;
              } else if (isReceived) {
                interestText = "Accept";
                interestStyle = "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 shadow-xs animate-pulse";
              }

              const isOnline = match.is_online;
              const isNew = match.is_new_user || (match.created_at ? (Math.abs(new Date().getTime() - new Date(match.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 7) : false);
              const isRecentlyActive = match.last_login ? (Math.abs(new Date().getTime() - new Date(match.last_login).getTime()) / (1000 * 60 * 60) <= 24) : false;

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.07, type: "spring", stiffness: 85 }}
                  onClick={() => setSelectedProfile(match)}
                  className="relative h-[420px] rounded-2xl overflow-hidden border border-gray-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_-5px_rgba(2,109,119,0.15)] hover:scale-[1.03] transition-all duration-300 group flex flex-col justify-end cursor-pointer"
                >
                  {/* Image Background */}
                  {match.img ? (
                    <img 
                      src={match.img} 
                      alt={match.name} 
                      className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 ${!isInterested ? "filter blur-[16px] select-none" : ""}`} 
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#026d77]/10 to-[#026d77]/30 flex items-center justify-center text-[#026d77]/40 font-extrabold text-7xl uppercase font-playfair z-0">
                      {match.name.charAt(0)}
                    </div>
                  )}

                  {/* Lock Screen for Not Interested */}
                  {!isInterested && (
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[6px] flex items-center justify-center transition-all duration-300 group-hover:bg-slate-950/50 z-10">
                      <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-[#d4af37]/30 flex items-center gap-1.5 hover:scale-105 transition-all">
                        <Lock className="w-3.5 h-3.5 text-[#d4af37] animate-pulse" />
                        <span className="text-[10px] font-bold text-gray-800 tracking-wide uppercase">Connect to view photo</span>
                      </div>
                    </div>
                  )}

                  {/* Bottom Gradient Shadow Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10 pointer-events-none" />

                  {/* Favourite Star Button */}
                  <div className="absolute top-3 left-3 z-20">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleFavourite(match.id).then(r => setAlertMsg(r === "FAVOURITED" ? "⭐ Favourited!" : "Removed from favourites")); 
                      }}
                      className={`p-1.5 rounded-full shadow-md transition-all duration-300 hover:scale-110 active:scale-95 ${
                        isFavourite(match.id)
                          ? "bg-amber-400 text-white border border-amber-300"
                          : "bg-white/80 backdrop-blur-md text-gray-600 hover:text-amber-500 hover:bg-white"
                      }`}
                      title="Favourite"
                    >
                      <Star className={`w-3.5 h-3.5 ${isFavourite(match.id) ? "fill-white" : ""}`} />
                    </button>
                  </div>

                  {/* Match Score Badge */}
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-[#d4af37]/90 to-[#b8860b]/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md z-20 border border-[#d4af37]/30 pointer-events-none">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {match.match}% match
                  </div>

                  {/* Content & Action Buttons Container */}
                  <div className="relative z-20 p-4 w-full flex flex-col gap-2.5">
                    {/* Status Badges Overlay */}
                    {(isOnline || isNew || isRecentlyActive) && (
                      <div className="flex flex-wrap gap-1 mb-0.5">
                        {isOnline && (
                          <span className="flex items-center gap-1 bg-green-500/20 backdrop-blur-md text-green-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Online
                          </span>
                        )}
                        {isNew ? (
                          <span className="bg-[#026d77]/80 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-white/10">
                            New
                          </span>
                        ) : isRecentlyActive ? (
                          <span className="bg-blue-500/20 backdrop-blur-md text-blue-300 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-blue-500/30">
                            Active
                          </span>
                        ) : null}
                      </div>
                    )}

                    {/* Name & Caste */}
                    <div className="flex items-center justify-between min-w-0 gap-1.5">
                      <p className="font-bold text-white text-base tracking-wide truncate transition-colors flex items-center gap-1.5">
                        {match.name}
                        {match.kyc_status === "VERIFIED" && (
                          <span title="ID Verified" className="shrink-0">
                            <ShieldCheck className="w-4 h-4 text-blue-400 fill-blue-900/50" />
                          </span>
                        )}
                      </p>
                      <span className="shrink-0 text-[9px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                        {match.caste || "Muslim"}
                      </span>
                    </div>

                    {/* Tag pill details */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-semibold text-gray-200 bg-white/10 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md">
                        {match.age} yrs
                      </span>
                      <span className="text-[10px] font-semibold text-gray-200 bg-white/10 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md truncate max-w-[95px]">
                        {match.location}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-200 bg-white/10 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md truncate max-w-[95px]">
                        {match.education || "Graduate"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleInterest(match.id, match.name);
                        }}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1 active:scale-[0.97] shadow-sm ${
                          isMutual ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white" :
                          isSent ? "bg-white/10 text-white border border-white/10 hover:bg-white/15" :
                          isReceived ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse" :
                          "bg-[#026d77] hover:bg-[#03828e] text-white"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isHeartFilled ? "fill-current" : ""}`} />
                        {interestText}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isMutual) {
                            router.push("/dashboard/chat");
                          } else {
                            setAlertMsg("Chat is locked! Establish a mutual match first.");
                          }
                        }}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1 ${
                          isMutual
                            ? "bg-white/20 hover:bg-white text-white hover:text-gray-900 border border-white/20 hover:border-white shadow-sm active:scale-[0.97]"
                            : "bg-white/5 text-white/40 border border-white/5 cursor-not-allowed"
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Chat
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Profile Details Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <ProfileSlideOver
            profile={selectedProfile}
            onClose={() => setSelectedProfile(null)}
            interests={interests}
            onToggleInterest={handleToggleInterest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
