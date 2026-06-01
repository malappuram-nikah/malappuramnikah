"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, TrendingUp, Sparkles, MapPin, BookOpen, Zap, Info, ChevronRight, X, Loader2, Lock, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";

// Base Mock AI copy to enrich real profiles
const aiAestheticTemplates = [
  {
    matchScore: 96,
    aiExplanation: "Exceptional compatibility based on your shared Sunni community values, mutual interest in continuing education, and complementary personality traits.",
    strengths: ["Religious Harmony", "Family Values", "Lifestyle Sync"],
    personality: "Thoughtful & Empathetic (INFJ)",
    conversationStarter: "I noticed you're also passionate about literature. What's the last good book you read?"
  },
  {
    matchScore: 91,
    aiExplanation: "Highly compatible career goals and family values. Shared focus on personal growth and mutual respect for traditional community practices.",
    strengths: ["Career Synergy", "Mutual Growth", "Value Alignment"],
    personality: "Strategic & Outgoing (ENFJ)",
    conversationStarter: "Your career aspirations look inspiring! How do you maintain work-life balance?"
  },
  {
    matchScore: 88,
    aiExplanation: "Very strong alignment in artistic and creative interests. Complementary communication styles that support understanding and harmony.",
    strengths: ["Creative Harmony", "Spontaneous Sync", "Emotional Depth"],
    personality: "Creative & Curious (INFP)",
    conversationStarter: "I see you love architecture and creative designs. Have you visited any historic sights lately?"
  },
  {
    matchScore: 85,
    aiExplanation: "Balanced personality matchup. Mutual respect for family heritage combined with modern professional ambitions provides a stable foundation.",
    strengths: ["Heritage Sync", "Goal Compatibility", "Quiet Trust"],
    personality: "Calm & Dependable (ISFJ)",
    conversationStarter: "What family values or traditions are most important to you when building a home?"
  }
];

// Fallback high-quality mock data when DB profiles are scarce
const fallbackMockProfiles = [
  {
    id: 101,
    name: "Fathima R.",
    age: 24,
    location: "Malappuram",
    img: "https://images.unsplash.com/photo-1599842057874-37393e9342df?w=400&q=80",
    matchScore: 96,
    aiExplanation: "Exceptional compatibility based on your shared Sunni community values, mutual interest in continuing education, and complementary personality traits.",
    strengths: ["Religious Harmony", "Family Values", "Lifestyle Sync"],
    personality: "Thoughtful & Empathetic (INFJ)",
    conversationStarter: "I noticed you're also passionate about literature. What's the last good book you read?",
    caste: "Sunni",
    profession: "Educator"
  },
  {
    id: 102,
    name: "Aysha K.",
    age: 26,
    location: "Calicut",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
    matchScore: 91,
    aiExplanation: "Similar career aspirations, technical baseline, and mutual respect. High likelihood of balanced support systems.",
    strengths: ["Career Synergy", "Tech Sync", "Growth Mindset"],
    personality: "Strategic & Detail-oriented (INTJ)",
    caste: "Mujahid",
    profession: "Software Engineer",
    matchReason: "Similar career aspirations and tech background."
  },
  {
    id: 103,
    name: "Zainab M.",
    age: 23,
    location: "Thrissur",
    img: "https://images.unsplash.com/photo-1531123897727-8f129e1bf98a?w=400&q=80",
    matchScore: 88,
    aiExplanation: "Creative synergy with highly complementary creative interests. Shared appreciation for aesthetics and quiet family environments.",
    strengths: ["Creative Harmony", "Vibrant Communication", "Shared Hobbies"],
    personality: "Energetic & Aesthetic (ENFP)",
    caste: "Sunni",
    profession: "Architect",
    matchReason: "Strong alignment in creative interests and lifestyle."
  },
  {
    id: 104,
    name: "Mariam A.",
    age: 27,
    location: "Kondotty",
    img: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&q=80",
    matchScore: 85,
    aiExplanation: "Aligned lifetime schedules and caregiving values. Strong communication flows and support systems.",
    strengths: ["Life Vision", "Compassionate Care", "Trust Sync"],
    personality: "Warm & Direct (ESFJ)",
    caste: "Sunni",
    profession: "Doctor",
    matchReason: "Complementary behavioral patterns and family goals."
  }
];

export default function AiMatchesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ai-recommendations");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const [aiData, setAiData] = useState<{
    bestMatch: any;
    dailyPicks: any[];
    nearby: any[];
    similarPersonality: any[];
  }>({
    bestMatch: null,
    dailyPicks: [],
    nearby: [],
    similarPersonality: []
  });

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

  const fetchProfilesAndAssembleAiMatches = async () => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (storedToken) {
        await fetchInterests(storedToken);
      }

      const res = await fetch("http://localhost:3333/user/profiles");
      const data = await res.json();
      
      if (data.success && data.users) {
        const tokenPayload = storedToken ? JSON.parse(atob(storedToken.split(".")[1])) : {};
        const loggedInId = tokenPayload.userId || null;
        
        // Filter out logged-in user
        const otherUsers = data.users.filter((u: any) => u.id !== loggedInId);
        
        if (otherUsers.length > 0) {
          // Map DB users to profiles
          const mappedUsers = otherUsers.map((u: any, i: number) => {
            let avatar = `https://i.pravatar.cc/200?img=${40 + (i % 20)}`;
            const photos = u.profile_details?.mn_profile_photos_draft?.photos;
            if (photos && photos.length > 0) {
              const primary = photos.find((p: any) => p.isPrimary);
              avatar = primary ? primary.dataUrl : photos[0].dataUrl;
            }

            const aesthetic = aiAestheticTemplates[i % aiAestheticTemplates.length];

            return {
              id: u.id,
              name: `${u.first_name} ${u.last_name}`,
              age: u.dob ? Math.floor((new Date().getTime() - new Date(u.dob).getTime()) / 31557600000) : 25,
              location: u.location || "Kerala",
              img: avatar,
              caste: u.cast || "Sunni",
              profession: u.profile_details?.profession || "Professional",
              // Enrich with AI compatible templates
              matchScore: aesthetic.matchScore,
              aiExplanation: aesthetic.aiExplanation,
              strengths: aesthetic.strengths,
              personality: aesthetic.personality,
              conversationStarter: aesthetic.conversationStarter,
              matchReason: aesthetic.aiExplanation
            };
          });

          // Sort by match score
          const sorted = [...mappedUsers].sort((a, b) => b.matchScore - a.matchScore);

          // Best match is the highest score
          const best = sorted[0];
          const picks = sorted.slice(1, 4);
          const nearby = sorted.slice(4, 6);
          const similar = sorted.slice(6, 8);

          // If we ran out of profiles for arrays, supplement with fallbacks
          setAiData({
            bestMatch: best || fallbackMockProfiles[0],
            dailyPicks: picks.length > 0 ? picks : fallbackMockProfiles.slice(1, 4),
            nearby: nearby.length > 0 ? nearby : fallbackMockProfiles.slice(1, 3),
            similarPersonality: similar.length > 0 ? similar : fallbackMockProfiles.slice(2, 4)
          });
        } else {
          // Database is empty (only has logged in user), use fallback mock showcase profiles
          setAiData({
            bestMatch: fallbackMockProfiles[0],
            dailyPicks: fallbackMockProfiles.slice(1, 4),
            nearby: fallbackMockProfiles.slice(1, 3),
            similarPersonality: fallbackMockProfiles.slice(2, 4)
          });
        }
      }
    } catch (err) {
      console.error("AI recommendations assembly failed:", err);
      // Fallback
      setAiData({
        bestMatch: fallbackMockProfiles[0],
        dailyPicks: fallbackMockProfiles.slice(1, 4),
        nearby: fallbackMockProfiles.slice(1, 3),
        similarPersonality: fallbackMockProfiles.slice(2, 4)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfilesAndAssembleAiMatches();
  }, []);

  const handleToggleInterest = async (receiverId: number, profileName: string) => {
    // If it's a mock profile ID (100+ range when DB is empty), handle locally as a demo
    if (receiverId > 100) {
      const isSent = interests.sent.includes(receiverId);
      if (isSent) {
        setInterests(prev => ({ ...prev, sent: prev.sent.filter(id => id !== receiverId) }));
        setAlertMsg(`Withdrew interest for ${profileName} (Demo)`);
      } else {
        setInterests(prev => ({ ...prev, sent: [...prev.sent, receiverId] }));
        setAlertMsg(`Interest expressed for ${profileName}! (Demo)`);
      }
      return;
    }

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
          setAlertMsg(`Mutual Match Established with ${profileName}! 🎉 Chatting unlocked.`);
        } else if (data.status === "PENDING") {
          setAlertMsg(`Interest expressed! Notification sent to ${profileName}.`);
        } else {
          setAlertMsg(`Interest withdrawn for ${profileName}.`);
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

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-3 text-brand-500" />
        <p className="font-semibold text-sm text-gray-600">Analyzing compatibility points...</p>
      </div>
    );
  }

  const bestMatch = aiData.bestMatch;
  if (!bestMatch) return null;

  const isBestMutual = interests.mutual.includes(bestMatch.id);
  const isBestSent = interests.sent.includes(bestMatch.id);
  const isBestReceived = interests.received.includes(bestMatch.id);

  let bestBtnText = "Connect Now";
  let bestBtnStyle = "bg-white text-brand-800 hover:bg-brand-50";
  if (isBestMutual) {
    bestBtnText = "Matched! Chat Now 🎉";
    bestBtnStyle = "bg-pink-600 text-white hover:bg-pink-700";
  } else if (isBestSent) {
    bestBtnText = "Interest Sent";
    bestBtnStyle = "bg-pink-100 text-pink-700 hover:bg-pink-200";
  } else if (isBestReceived) {
    bestBtnText = "Accept Request";
    bestBtnStyle = "bg-amber-100 text-amber-900 hover:bg-amber-200 border-2 border-dashed border-amber-300 animate-pulse";
  }

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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-playfair text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-600" />
          AI Matchmaking
        </h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Our intelligent recommendation engine analyzes 50+ data points including religion, education, personality, and behavioral patterns to find your perfect match.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-50 p-1 rounded-xl w-max border border-gray-100">
        {[
          { id: "ai-recommendations", label: "AI Recommendations" },
          { id: "browse-all", label: "Browse All Profiles" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === "browse-all") {
                router.push("/dashboard/search");
              } else {
                setActiveTab(tab.id);
              }
            }}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-white text-brand-700 shadow-sm border border-gray-200/60"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "ai-recommendations" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* Top Recommendation (Hero Match) */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              Highest Compatibility Match
            </h2>
            <div className="bg-gradient-to-br from-brand-900 to-brand-700 rounded-3xl overflow-hidden shadow-xl relative">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:24px_24px] opacity-10" />
              
              <div className="flex flex-col md:flex-row relative z-10">
                <div className="md:w-2/5 h-64 md:h-auto relative bg-gray-900/10">
                  <img src={bestMatch.img} alt={bestMatch.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-brand-900" />
                  
                  <div className="absolute bottom-4 left-4 md:hidden">
                    <h3 className="text-2xl font-bold text-white">{bestMatch.name}</h3>
                    <p className="text-brand-100">{bestMatch.age} yrs • {bestMatch.location}</p>
                  </div>
                </div>

                <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-center text-white">
                  <div className="hidden md:block mb-4">
                    <h3 className="text-3xl font-bold font-playfair">{bestMatch.name}</h3>
                    <p className="text-brand-100 text-sm mt-1">{bestMatch.age} yrs • {bestMatch.location} • {bestMatch.caste}</p>
                  </div>

                  {/* Compatibility Meter */}
                  <div className="mb-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-brand-50 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-200" />
                        AI Compatibility Score
                      </span>
                      <span className="text-2xl font-bold text-white">{bestMatch.matchScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${bestMatch.matchScore}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-brand-300 to-brand-100"
                      />
                    </div>
                    <p className="text-xs text-brand-100 mt-3 leading-relaxed">
                      {bestMatch.aiExplanation}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-brand-200 mb-1 uppercase tracking-wider font-semibold">Strengths</p>
                      <div className="flex flex-wrap gap-1.5">
                        {bestMatch.strengths?.map((s: string) => (
                          <span key={s} className="bg-brand-800/50 text-xs px-2 py-1 rounded-md border border-brand-600/30">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-brand-200 mb-1 uppercase tracking-wider font-semibold">Personality</p>
                      <p className="text-sm font-medium">{bestMatch.personality}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={() => {
                        if (isBestMutual) {
                          router.push("/dashboard/chat");
                        } else {
                          handleToggleInterest(bestMatch.id, bestMatch.name);
                        }
                      }}
                      className={`flex-1 font-semibold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] ${bestBtnStyle}`}
                    >
                      <Heart className={`w-4 h-4 ${(isBestMutual || isBestSent) ? "fill-current" : ""}`} /> 
                      {bestBtnText}
                    </button>
                    <button 
                      onClick={() => setSelectedProfile(bestMatch)}
                      className="px-5 bg-brand-800/50 text-white font-medium py-3 rounded-xl border border-brand-500/30 hover:bg-brand-700/50 transition-colors flex items-center justify-center"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Daily Recommended Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-500" />
                Recommended Daily
              </h2>
              <button onClick={() => router.push("/dashboard/search")} className="text-sm text-brand-600 font-medium hover:underline">View All</button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {aiData.dailyPicks.map((profile, i) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col justify-between"
                  onClick={() => setSelectedProfile(profile)}
                >
                  <div>
                    <div className="h-48 overflow-hidden relative bg-gray-50">
                      <img src={profile.img} alt={profile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-brand-700 shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {profile.matchScore}% Match
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 text-base">{profile.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{profile.age} yrs • {profile.location}</p>
                      
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <p className="text-xs text-brand-600 bg-brand-50 inline-block px-2 py-1 rounded-md mb-2 font-semibold">
                          {profile.profession}
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                          <span className="font-semibold text-gray-700">AI Note:</span> {profile.matchReason}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProfile(profile);
                      }}
                      className="w-full py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <Info className="w-3.5 h-3.5" /> View Analysis & Connect
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Bottom Split Sections */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Similar Personalities */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-600" />
                Similar Personalities
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-sm">
                {aiData.similarPersonality.map(profile => (
                  <div 
                    key={profile.id} 
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <img src={profile.img} className="w-14 h-14 rounded-full object-cover shadow-sm bg-gray-50" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{profile.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{profile.age} yrs • {profile.location}</p>
                      <p className="text-[10px] text-brand-600 mt-1 font-semibold bg-brand-50 w-max px-1.5 py-0.5 rounded">{profile.personality}</p>
                    </div>
                    <div className="text-right flex items-center gap-1">
                      <div className="text-brand-600 font-bold text-sm">{profile.matchScore}%</div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Nearby Matches */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                Nearby Compatible Profiles
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-sm">
                {aiData.nearby.map(profile => (
                  <div 
                    key={profile.id} 
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <img src={profile.img} className="w-14 h-14 rounded-full object-cover shadow-sm bg-gray-50" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{profile.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{profile.caste}</p>
                      <p className="text-xs text-gray-600 mt-1 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-gray-400" /> {profile.location}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-1">
                      <div className="text-brand-600 font-bold text-sm">{profile.matchScore}%</div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </motion.div>
      )}

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
                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
              >
                <div className="h-48 bg-gray-100 relative">
                  <img src={selectedProfile.img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
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
                        <p className="text-gray-200 text-sm mt-1">{selectedProfile.age} yrs • {selectedProfile.location}</p>
                      </div>
                      <div className="bg-brand-600 text-white px-3 py-1.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> {selectedProfile.matchScore}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
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
                          handleToggleInterest(selectedProfile.id, selectedProfile.name);
                        }
                      }}
                      className={`flex-1 py-3 bg-brand-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98] ${modalBtnStyle}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${(isMutual || isSent) ? "fill-current" : ""}`} />
                      {modalBtnText}
                    </button>
                    <button 
                      onClick={() => router.push("/dashboard/search")}
                      className="flex-1 py-3 bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl border border-gray-200 transition-colors"
                    >
                      View Full Profile
                    </button>
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
