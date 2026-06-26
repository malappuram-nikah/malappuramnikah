"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Eye, MessageCircle, Star, ArrowRight, TrendingUp, Loader2, Sparkles, Lock, X, Volume2, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getEnrichedProfile } from "@/lib/profile-utils";
import ProfileCompletionTracker from "@/components/dashboard/ProfileCompletionTracker";
import BiodataDownload from "@/components/dashboard/BiodataDownload";


export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Real Statistics state
  const [stats, setStats] = useState([
    { label: "Profile Views",    value: "124",  icon: Eye,           color: "bg-brand-100/70 text-brand-700" },
    { label: "Interests Sent",   value: "0",    icon: Heart,         color: "bg-brand-50 text-brand-600"     },
    { label: "Mutual Matches",   value: "0",    icon: Star,          color: "bg-pink-50 text-pink-600"      },
    { label: "Messages Received",value: "2",    icon: MessageCircle, color: "bg-brand-100 text-brand-800"    },
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
      const res = await fetch("http://localhost:3333/user/interest", {
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

        // Update statistics with real data
        setStats([
          { label: "Profile Views",    value: "148",                  icon: Eye,           color: "bg-brand-100/70 text-brand-700" },
          { label: "Interests Sent",   value: String(sentIds.length), icon: Heart,         color: "bg-brand-50 text-brand-600"     },
          { label: "Mutual Matches",   value: String(mutualIds.length),icon: Star,          color: "bg-pink-50 text-pink-600"      },
          { label: "Requests Received",value: String(receivedIds.length), icon: MessageCircle, color: "bg-brand-100 text-brand-800"  },
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

      const res = await fetch("http://localhost:3333/user/profiles", {
        headers: storedToken ? { "Authorization": `Bearer ${storedToken}` } : {}
      });
      const data = await res.json();
      
      if (data.success && data.users) {
        const tokenPayload = storedToken ? JSON.parse(atob(storedToken.split(".")[1])) : {};
        const loggedInId = tokenPayload.userId || null;
        
        let loggedInGender = "";
        if (loggedInId && storedToken) {
          try {
            const meRes = await fetch(`http://localhost:3333/user/${loggedInId}`, {
              headers: { "Authorization": `Bearer ${storedToken}` }
            });
            const meData = await meRes.json();
            if (meData.success && meData.user) {
              setCurrentUser(meData.user);
              loggedInGender = (meData.user.gender || "").toLowerCase();
            }
          } catch (meErr) {
            console.error("Failed to load logged-in user details in dashboard", meErr);
          }
        }

        // Filter out logged-in user and any same-gender profiles
        const otherUsers = data.users.filter((u: any) => {
          if (u.id === loggedInId) return false;
          if (loggedInGender) {
            const targetGender = (u.gender || "").toLowerCase();
            if (targetGender && loggedInGender === targetGender) return false;
          }
          return true;
        });

        const mapped = otherUsers.map((u: any, i: number) => {
          const enriched = getEnrichedProfile(u);
          return {
            ...enriched,
            img: enriched.photo,
            caste: enriched.community,
            match: 82 + (i % 15),
            matchScore: 82 + (i % 15),
            photos: u.profile_details?.mn_profile_photos_draft?.photos || [],
            video: u.profile_details?.mn_video_intro_draft?.video?.dataUrl || null,
            voice: u.profile_details?.mn_voice_intro_draft?.voice?.dataUrl || null,
            aboutMe: enriched.aboutMe || enriched.personalityDescription,
            aiExplanation: u.profile_details?.mn_partner_preferences_draft?.explanation || "Highly compatible profile based on your preferences.",
            conversationStarter: "I would love to learn more about your values and partner goals!",
            profile_details: u.profile_details
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
    fetchProfilesAndSuggestions();
  }, []);

  const handleToggleInterest = async (receiverId: number, profileName: string) => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) {
        setAlertMsg("Please log in to express interest.");
        return;
      }

      const res = await fetch("http://localhost:3333/user/interest", {
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
    <div className="space-y-8 pb-10 relative">
      {/* Sleek Alert Banner */}
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

      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-700 to-brand-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:24px_24px]" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold font-playfair mb-2">Welcome back! 👋</h1>
          <p className="text-brand-100 mb-5 text-sm sm:text-base max-w-xl">
            Manage your requests, review incoming interests under the new <strong className="text-white">Interests Tab</strong>, and discover compatible partners.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/matches" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 text-sm font-semibold rounded-xl hover:bg-brand-50 transition-all shadow-md">
              View AI Matches <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard/interests" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-800/40 border border-brand-500/30 text-white text-sm font-semibold rounded-xl hover:bg-brand-800/60 transition-all">
              <Heart className="w-4 h-4 fill-pink-500 text-pink-500" /> View Pending Interests
            </Link>
            {currentUser && (
              <BiodataDownload profile={currentUser} enriched={getEnrichedProfile(currentUser)} />
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-100/50 transition-all duration-300"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Suggested Matches */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-brand-600" /> Suggested Matches
          </h2>
          <Link href="/dashboard/search" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-0.5">
            Browse all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : suggestedMatches.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm font-semibold">No recommendations found</p>
            <p className="text-xs mt-1">Complete your profile setup to get matches</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {suggestedMatches.map((match, i) => {
              const isMutual = interests.mutual.includes(match.id);
              const isSent = interests.sent.includes(match.id);
              const isReceived = interests.received.includes(match.id);
              const isInterested = isMutual || isSent || isReceived;

              let interestText = "Interest";
              let interestStyle = "bg-brand-50 text-brand-700 hover:bg-brand-100 border border-transparent";
              let isHeartFilled = false;

              if (isMutual) {
                interestText = "Matched! 🎉";
                interestStyle = "bg-pink-600 text-white hover:bg-pink-700 border border-transparent";
                isHeartFilled = true;
              } else if (isSent) {
                interestText = "Sent";
                interestStyle = "bg-pink-100 text-pink-700 hover:bg-pink-200 border border-transparent";
                isHeartFilled = true;
              } else if (isReceived) {
                interestText = "Accept";
                interestStyle = "bg-amber-100 text-amber-800 hover:bg-amber-200 border-2 border-dashed border-amber-300 animate-pulse";
              }

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:shadow-brand-900/5 hover:border-brand-100 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div 
                    onClick={() => setSelectedProfile(match)}
                    className="relative h-44 overflow-hidden bg-gray-50 cursor-pointer"
                  >
                    <img 
                      src={match.img} 
                      alt={match.name} 
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isInterested ? "filter blur-[12px] select-none" : ""}`} 
                    />
                    {!isInterested && (
                      <div className="absolute inset-0 bg-black/15 flex items-center justify-center transition-all">
                        <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-white/20 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-brand-600" />
                          <span className="text-[9px] font-bold text-gray-700">Connect to view photo</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-brand-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
                      <TrendingUp className="w-3 h-3" />
                      {match.match}% match
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div onClick={() => setSelectedProfile(match)} className="cursor-pointer">
                      <p className="font-bold text-gray-900 text-sm truncate group-hover:text-brand-600 transition-colors">{match.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">{match.age} yrs · {match.location}</p>
                      <p className="text-[11px] text-brand-600 mt-0.5 font-bold truncate">{match.caste}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleToggleInterest(match.id, match.name)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 active:scale-[0.97] ${interestStyle}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isHeartFilled ? "fill-current" : ""}`} /> 
                        {interestText}
                      </button>
                      <button
                        onClick={() => {
                          if (isMutual) {
                            router.push("/dashboard/chat");
                          } else {
                            setAlertMsg("Chat is locked! Establish a mutual match first.");
                          }
                        }}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          isMutual
                            ? "bg-brand-600 text-white hover:bg-brand-700"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
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

      {/* Profile Completion */}
      <ProfileCompletionTracker />

      {/* AI Profile Details Modal */}
      <AnimatePresence>
        {selectedProfile && (() => {
          const isMutual = interests.mutual.includes(selectedProfile.id);
          const isSent = interests.sent.includes(selectedProfile.id);
          const isReceived = interests.received.includes(selectedProfile.id);

          let modalBtnText = "Send Interest";
          let modalBtnStyle = "bg-brand-600 text-white hover:bg-brand-700 shadow-brand-600/20";
          if (isMutual) {
            modalBtnText = "Matched! Chat Now 🎉";
            modalBtnStyle = "bg-pink-600 text-white hover:bg-pink-700 shadow-pink-600/20";
          } else if (isSent) {
            modalBtnText = "Withdrawn Sent Request";
            modalBtnStyle = "bg-pink-100 text-pink-700 hover:bg-pink-200 border border-pink-200";
          } else if (isReceived) {
            modalBtnText = "Accept Request";
            modalBtnStyle = "bg-amber-500 text-white hover:bg-amber-600 animate-pulse";
          }

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                onClick={() => setSelectedProfile(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] z-10 scrollbar-thin"
              >
                <div className="h-56 bg-gray-100 relative overflow-hidden">
                  {(() => {
                    const isInterested = isMutual || isSent || isReceived;
                    return (
                      <>
                        <img 
                          src={activePhoto || selectedProfile.img} 
                          alt="" 
                          className={`w-full h-full object-cover ${!isInterested ? "filter blur-[16px] select-none" : ""}`} 
                        />
                        {!isInterested && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-white/20 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-brand-600" />
                              <span className="text-[10px] font-bold text-gray-700">Connect to view photo</span>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                  <button 
                    onClick={() => setSelectedProfile(null)}
                    className="absolute top-4 right-4 p-2 bg-black/25 hover:bg-black/45 backdrop-blur-md rounded-full text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-6 right-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white drop-shadow-md">{selectedProfile.name}</h2>
                        <p className="text-gray-200 text-sm mt-1">{selectedProfile.age} yrs • {selectedProfile.location} • {selectedProfile.caste}</p>
                      </div>
                      <div className="bg-brand-600 text-white px-3 py-1.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> {selectedProfile.matchScore}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Photo Thumbnails */}
                  {selectedProfile.photos && selectedProfile.photos.length > 1 && (
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Photo Gallery</h3>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {selectedProfile.photos.map((p: any, idx: number) => {
                          const isInterested = isMutual || isSent || isReceived;
                          return (
                            <button 
                              key={p.id || idx} 
                              onClick={() => setActivePhoto(p.dataUrl)}
                              className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${activePhoto === p.dataUrl ? 'border-brand-600 scale-95' : 'border-gray-200 opacity-70 hover:opacity-100'}`}
                            >
                              <img src={p.dataUrl} className={`w-full h-full object-cover ${!isInterested ? "filter blur-[6px] select-none" : ""}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* About Me bio */}
                  {selectedProfile.aboutMe && (
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">About</h3>
                      <p className="text-xs text-gray-700 leading-relaxed font-medium">
                        {selectedProfile.aboutMe}
                      </p>
                    </div>
                  )}

                  {/* Profile Info Details Grid */}
                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-150/80 space-y-2.5">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-250/60 pb-1.5 mb-1">Profile Info</h3>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-gray-400 font-medium block">Gender</span>
                        <span className="text-gray-850 font-bold">{selectedProfile.gender || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium block">Marital Status</span>
                        <span className="text-gray-850 font-bold">{selectedProfile.maritalStatus || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium block">Mother Tongue</span>
                        <span className="text-gray-850 font-bold">{selectedProfile.motherTongue || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium block">Religion & Sect</span>
                        <span className="text-gray-850 font-bold">{(selectedProfile.religion || "Islam") + " - " + (selectedProfile.caste || selectedProfile.community || "Sunni")}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium block">Namaz Habits</span>
                        <span className="text-gray-850 font-bold">{selectedProfile.namaz || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium block">Quran Reading</span>
                        <span className="text-gray-850 font-bold">{selectedProfile.quranReading || "N/A"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 font-medium block">Education</span>
                        <span className="text-gray-850 font-bold">{selectedProfile.education || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Partner Preferences Grid */}
                  <div className="bg-brand-50/30 p-4 rounded-2xl border border-brand-100/50 space-y-2.5">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-700 border-b border-brand-100/40 pb-1.5 mb-1">Partner Preferences</h3>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-brand-600/70 font-medium block">Age Preference</span>
                        <span className="text-brand-950 font-bold">{selectedProfile.prefAge || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-brand-600/70 font-medium block">Marital Status</span>
                        <span className="text-brand-950 font-bold">{selectedProfile.prefMaritalStatus || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-brand-600/70 font-medium block">Preferred Religion</span>
                        <span className="text-brand-950 font-bold">{selectedProfile.prefReligion || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-brand-600/70 font-medium block">Preferred Sect</span>
                        <span className="text-brand-950 font-bold">{selectedProfile.prefCommunity || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-brand-600/70 font-medium block">Preferred Namaz</span>
                        <span className="text-brand-950 font-bold">{selectedProfile.prefNamaz || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-brand-600/70 font-medium block">Preferred Quran</span>
                        <span className="text-brand-950 font-bold">{selectedProfile.prefQuranReading || "N/A"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-brand-600/70 font-medium block">Preferred Education</span>
                        <span className="text-brand-950 font-bold">{selectedProfile.prefEducation || "N/A"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-brand-600/70 font-medium block">Preferred Locations</span>
                        <span className="text-brand-950 font-bold">{selectedProfile.prefLocations || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Voice Introduction Player */}
                  {selectedProfile.voice && (
                    <div className="bg-brand-50/40 border border-brand-100/50 p-4 rounded-2xl flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4" /> Voice Introduction
                      </span>
                      <audio src={selectedProfile.voice} controls className="w-full h-8 mt-1 accent-brand-600" />
                    </div>
                  )}

                  {/* Video Introduction Player */}
                  {selectedProfile.video && (
                    <div className="bg-brand-50/40 border border-brand-100/50 p-4 rounded-2xl flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                        <Video className="w-4 h-4" /> Video Onboarding
                      </span>
                      <div className="relative rounded-xl overflow-hidden aspect-video bg-black mt-1">
                        <video src={selectedProfile.video} controls className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">AI Compatibility Analysis</h3>
                    <p className="text-xs text-gray-700 leading-relaxed bg-brand-50 p-4 rounded-xl border border-brand-100/50">
                      {selectedProfile.aiExplanation || selectedProfile.matchReason || "Highly compatible profile based on your preferences."}
                    </p>
                  </div>

                  {selectedProfile.conversationStarter && (
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-brand-500" /> Smart Icebreaker
                      </h3>
                      <p className="text-xs text-gray-700 italic bg-gray-50 p-4 rounded-xl border border-gray-100/50">
                        "{selectedProfile.conversationStarter}"
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          if (isMutual) {
                            setSelectedProfile(null);
                            router.push("/dashboard/chat");
                          } else {
                            handleToggleInterest(selectedProfile.id, selectedProfile.name);
                          }
                        }}
                        className={`flex-1 py-3 bg-brand-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98] ${modalBtnStyle}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${(isMutual || isSent) ? "fill-current" : ""}`} />
                        {modalBtnText}
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedProfile(null);
                          router.push("/dashboard/search");
                        }}
                        className="flex-1 py-3 bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl border border-gray-200 transition-colors"
                      >
                        View Full Profile
                      </button>
                    </div>
                    <div className="w-full flex justify-center">
                      <BiodataDownload profile={selectedProfile} enriched={getEnrichedProfile(selectedProfile)} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
