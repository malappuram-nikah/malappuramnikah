"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Heart, MessageCircle, TrendingUp, Loader2, Lock, Unlock, Layers, X, Sparkles, Volume2, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCompare } from "@/context/CompareContext";
import { getEnrichedProfile } from "@/lib/profile-utils";
import { LOCATIONS } from "@/lib/constants";

export default function SearchPage() {
  const router = useRouter();
  const { addToCompare, removeFromCompare, isCompared, alertMsg: globalAlert, setAlertMsg: setGlobalAlert } = useCompare();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ ageMin: "", ageMax: "", location: "", caste: "Any" });
  const [showFilters, setShowFilters] = useState(false);
  const [interests, setInterests] = useState<{ sent: number[]; received: number[]; mutual: number[] }>({
    sent: [],
    received: [],
    mutual: []
  });
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (selectedProfile) {
      setActivePhoto(selectedProfile.img);
    } else {
      setActivePhoto(null);
    }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [selectedProfile]);
  
  useEffect(() => {
    if (globalAlert) {
      setAlertMsg(globalAlert);
      setGlobalAlert(null);
    }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [globalAlert, setGlobalAlert]);

  const fetchInterests = async (token: string) => {
    try {
      const res = await fetch("http://localhost:3333/user/interest", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInterests({
          sent: data.sent.map((u: any) => u.id),
          received: data.received.map((u: any) => u.id),
          mutual: data.mutual.map((u: any) => u.id)
        });
      }
    } catch (e) {
      console.error("Failed to fetch interests:", e);
    }
  };

  useEffect(() => {
    setMounted(true);
    const fetchProfiles = async () => {
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
                loggedInGender = (meData.user.gender || "").toLowerCase();
              }
            } catch (meErr) {
              console.error("Failed to load logged-in user details in search", meErr);
            }
          }

          // Filter out the logged-in user and any same-gender profiles
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
              match: 80 + Math.floor(Math.random() * 15),
              matchScore: 80 + Math.floor(Math.random() * 15),
              photos: u.profile_details?.mn_profile_photos_draft?.photos || [],
              video: u.profile_details?.mn_video_intro_draft?.video?.dataUrl || null,
              voice: u.profile_details?.mn_voice_intro_draft?.voice?.dataUrl || null,
              aboutMe: enriched.aboutMe || enriched.personalityDescription,
              aiExplanation: u.profile_details?.mn_partner_preferences_draft?.explanation || "Highly compatible profile based on your preferences.",
              conversationStarter: "I would love to learn more about your values and partner goals!"
            };
          });
          setProfiles(mapped);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const handleToggleInterest = async (receiverId: number) => {
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
          setAlertMsg("Match Established! 🎉 Chatting is now unlocked.");
        } else if (data.status === "PENDING") {
          setAlertMsg("Interest expressed! Pious notification sent.");
        } else {
          setAlertMsg("Interest withdrawn.");
        }
      }
    } catch (e) {
      console.error("Interest toggle failed:", e);
    }
  };

  const filtered = profiles.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.location.toLowerCase().includes(query.toLowerCase());
    const matchesCaste = filters.caste === "Any" || p.caste === filters.caste;
    const matchesLoc = !filters.location || p.location.toLowerCase().includes(filters.location.toLowerCase());
    const matchesAgeMin = !filters.ageMin || p.age >= parseInt(filters.ageMin);
    const matchesAgeMax = !filters.ageMax || p.age <= parseInt(filters.ageMax);
    return matchesQuery && matchesCaste && matchesLoc && matchesAgeMin && matchesAgeMax;
  });

  // Automatically dismiss alerts
  useEffect(() => {
    if (alertMsg) {
      const t = setTimeout(() => setAlertMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alertMsg]);

  return (
    <div className="space-y-6 relative">
      {/* Sleek dynamic alert banner */}
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
        <h1 className="text-2xl font-bold font-playfair text-gray-900">Search Profiles</h1>
        <p className="text-sm text-gray-500 mt-1">Find your ideal life partner from thousands of verified profiles</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or location..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium border transition-all ${showFilters ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-700 border-gray-200 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700"}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 shadow-sm"
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Min Age</label>
            <input type="number" placeholder="18" value={filters.ageMin} onChange={(e) => setFilters({...filters, ageMin: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Max Age</label>
            <input type="number" placeholder="40" value={filters.ageMax} onChange={(e) => setFilters({...filters, ageMax: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
            <select
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50 text-gray-700 font-medium appearance-none"
            >
              <option value="">Any</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Community</label>
            <select value={filters.caste} onChange={(e) => setFilters({...filters, caste: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50 appearance-none">
              {["Any","Sunni","Mujahid","Jamaat"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </motion.div>
      )}

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Showing <strong className="text-gray-800">{filtered.length}</strong> profiles
      </p>

      {/* Profile grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="sm:col-span-2 lg:col-span-3 py-16 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-3 text-brand-500" />
            <p className="font-medium">Loading profiles...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 py-16 text-center text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No profiles found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : filtered.map((p, i) => {
            const isMutual = interests.mutual.includes(p.id);
            const isSent = interests.sent.includes(p.id);
            const isReceived = interests.received.includes(p.id);

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

            const isInterested = isMutual || isSent || isReceived;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:shadow-brand-900/5 hover:border-brand-100 transition-all duration-300 group flex"
              >
                <div 
                  onClick={() => setSelectedProfile(p)}
                  className="w-28 shrink-0 overflow-hidden bg-gray-100 relative cursor-pointer flex items-center justify-center"
                >
                  {p.img ? (
                    <img 
                      src={p.img} 
                      alt={p.name} 
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isInterested ? "filter blur-[12px] select-none" : ""}`} 
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-50 flex items-center justify-center text-brand-700 font-extrabold text-3xl uppercase">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  {!isInterested && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center transition-all">
                      <Lock className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                  )}
                  {isMutual && (
                    <div className="absolute top-2 left-2 bg-pink-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      Match
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCompared(p.id)) {
                        removeFromCompare(p.id);
                      } else {
                        addToCompare(p.id);
                      }
                    }}
                    className={`absolute bottom-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-all shadow-sm z-10 ${
                      isCompared(p.id)
                        ? "bg-brand-600 text-white"
                        : "bg-white/80 text-gray-700 hover:bg-white"
                    }`}
                    title={isCompared(p.id) ? "Remove from Compare" : "Compare Profile"}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div onClick={() => setSelectedProfile(p)} className="cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate group-hover:text-brand-600 transition-colors">{p.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{p.age} yrs · {p.location}</p>
                        <p className="text-xs text-brand-600 mt-0.5 font-medium truncate">{p.caste}</p>
                      </div>
                      <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ml-1">
                        <TrendingUp className="w-2.5 h-2.5" />{p.match}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleToggleInterest(p.id)}
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
                      {isMutual ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      Chat
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          }
        )}
      </div>

      {/* AI Profile Details Modal */}
      {mounted && typeof document !== "undefined" ? createPortal(
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
                          {activePhoto || selectedProfile.img ? (
                            <img 
                              src={activePhoto || selectedProfile.img} 
                              alt="" 
                              className={`w-full h-full object-cover ${!isInterested ? "filter blur-[16px] select-none" : ""}`} 
                            />
                          ) : (
                            <div className="w-full h-full bg-brand-50 flex items-center justify-center text-brand-700 font-extrabold text-5xl uppercase">
                              {selectedProfile.name.charAt(0)}
                            </div>
                          )}
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

                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => {
                          if (isMutual) {
                            setSelectedProfile(null);
                            router.push("/dashboard/chat");
                          } else {
                            handleToggleInterest(selectedProfile.id);
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
                        }}
                        className="flex-1 py-3 bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl border border-gray-200 transition-colors"
                      >
                        Close Profile
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>,
        document.body
      ) : null}
    </div>
  );
}
