"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Eye, MessageCircle, Star, ArrowRight, TrendingUp, Loader2, Sparkles, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileCompletionTracker from "@/components/dashboard/ProfileCompletionTracker";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  
  // Real Statistics state
  const [stats, setStats] = useState([
    { label: "Profile Views",    value: "124",  icon: Eye,           color: "bg-brand-100/70 text-brand-700" },
    { label: "Interests Sent",   value: "0",    icon: Heart,         color: "bg-brand-50 text-brand-600"     },
    { label: "Mutual Matches",   value: "0",    icon: Star,          color: "bg-pink-50 text-pink-600"      },
    { label: "Messages Received",value: "2",    icon: MessageCircle, color: "bg-brand-100 text-brand-800"    },
  ]);

  const [suggestedMatches, setSuggestedMatches] = useState<any[]>([]);
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
          let avatar = `https://i.pravatar.cc/200?img=${45 + (i % 20)}`;
          const photos = u.profile_details?.mn_profile_photos_draft?.photos;
          if (photos && photos.length > 0) {
            const primary = photos.find((p: any) => p.isPrimary);
            avatar = primary ? primary.dataUrl : photos[0].dataUrl;
          }

          return {
            id: u.id,
            name: `${u.first_name} ${u.last_name}`,
            age: u.dob ? Math.floor((new Date().getTime() - new Date(u.dob).getTime()) / 31557600000) : 25,
            location: u.location || "Kerala",
            img: avatar,
            caste: u.cast || "Sunni",
            match: 82 + (i % 15)
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
                  <div className="relative h-44 overflow-hidden bg-gray-50">
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
                    <div>
                      <p className="font-bold text-gray-900 text-sm truncate">{match.name}</p>
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
    </div>
  );
}
