"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, TrendingUp, Sparkles, MapPin, BookOpen, Zap, Info, ChevronRight, X, Loader2, Lock, Unlock, Layers, Play, Pause, Volume2, Video, ShieldCheck, Radar, BadgeCheck, HeartHandshake } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCompare } from "@/context/CompareContext";
import { useUser } from "@/context/UserContext";
import { getEnrichedProfile } from "@/lib/profile-utils";

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
    profession: "Educator",
    aboutMe: "A passionate educator who enjoys reading Islamic history and exploring nature. Looking for someone who values family and constant learning.",
    voice: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    video: "https://assets.mixkit.co/videos/preview/mixkit-woman-waving-happily-in-front-of-wall-43031-large.mp4",
    photos: [
      { id: "1", dataUrl: "https://images.unsplash.com/photo-1599842057874-37393e9342df?w=400&q=80" },
      { id: "2", dataUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80" }
    ]
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
    matchReason: "Similar career aspirations and tech background.",
    aboutMe: "Software developer focused on building meaningful technology. Love coding, volunteering, and travelling.",
    voice: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    video: "https://assets.mixkit.co/videos/preview/mixkit-woman-waving-happily-in-front-of-wall-43031-large.mp4",
    photos: [
      { id: "1", dataUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80" }
    ]
  },
  {
    id: 103,
    name: "Zainab M.",
    age: 23,
    location: "Thrissur",
    img: "https://images.unsplash.com/photo-1531123897727-8f129e1bf98a?w=400&q=80",
    matchScore: 88,
    aiExplanation: "Creative synergy with highly complementary creative interests. Shared appreciation for aesthetics and quiet family environments.",
    strengths: ["Creative Harmony", "Spontaneous Sync", "Emotional Depth"],
    personality: "Energetic & Aesthetic (ENFP)",
    caste: "Sunni",
    profession: "Architect",
    matchReason: "Strong alignment in creative interests and lifestyle.",
    aboutMe: "Architect who loves drawing, exploring historic sites, and building interior designs.",
    voice: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    video: "https://assets.mixkit.co/videos/preview/mixkit-woman-waving-happily-in-front-of-wall-43031-large.mp4",
    photos: [
      { id: "1", dataUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1bf98a?w=400&q=80" }
    ]
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
    matchReason: "Complementary behavioral patterns and family goals.",
    aboutMe: "Medical doctor passionate about community healthcare. Enjoys reading and cooking for family.",
    voice: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    video: "https://assets.mixkit.co/videos/preview/mixkit-woman-waving-happily-in-front-of-wall-43031-large.mp4",
    photos: [
      { id: "1", dataUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&q=80" }
    ]
  }
];

// Fallback high-quality male mock data when DB profiles are scarce and requester is female
const fallbackMockMaleProfiles = [
  {
    id: 201,
    name: "Mohammed Bilal",
    age: 26,
    location: "Malappuram",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    matchScore: 95,
    aiExplanation: "Strong compatibility based on professional aspirations, shared community background in Malappuram, and balanced family expectations.",
    strengths: ["Caste Alignment", "Locational Proximity", "Career Stability"],
    personality: "Calm & Resilient (ISTJ)",
    conversationStarter: "Hello! I noticed you are interested in software development. What project are you working on right now?",
    caste: "Sunni",
    profession: "Software Professional",
    aboutMe: "A software engineer working in Ernakulam, originally from Malappuram. Value family traditions and personal growth.",
    voice: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    video: "https://assets.mixkit.co/videos/preview/mixkit-man-holding-cup-smiling-41804-large.mp4",
    photos: [
      { id: "1", dataUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" }
    ]
  },
  {
    id: 202,
    name: "Dr. Anas P.",
    age: 28,
    location: "Kozhikode",
    img: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80",
    matchScore: 90,
    aiExplanation: "High compatibility score based on shared health interests, community values, and parallel long term goals.",
    strengths: ["Education Sync", "Family Values", "Lifestyle Harmony"],
    personality: "Warm & Helpful (ENFJ)",
    caste: "Sunni",
    profession: "Doctor",
    aboutMe: "A medical doctor who loves traveling, reading, and spending quality time with family. Looking for a partner who is also passionate about their profession.",
    voice: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    video: "https://assets.mixkit.co/videos/preview/mixkit-man-holding-cup-smiling-41804-large.mp4",
    photos: [
      { id: "1", dataUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80" }
    ]
  },
  {
    id: 203,
    name: "Rayan Khalid",
    age: 25,
    location: "Ernakulam",
    img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
    matchScore: 87,
    aiExplanation: "Great match for shared lifestyle goals, digital marketing career alignment, and creative passions.",
    strengths: ["Creative Harmony", "Modern Values", "Shared Hobbies"],
    personality: "Outgoing & Creative (ENFP)",
    caste: "Mujahid",
    profession: "Digital Marketing Specialist",
    aboutMe: "Digital marketer who loves photography, playing football, and exploring new cafes. Looking for an open-minded and kind-hearted partner.",
    voice: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    video: "https://assets.mixkit.co/videos/preview/mixkit-man-holding-cup-smiling-41804-large.mp4",
    photos: [
      { id: "1", dataUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80" }
    ]
  },
  {
    id: 204,
    name: "Faheem Shah",
    age: 27,
    location: "Kasaragod",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    matchScore: 84,
    aiExplanation: "Aligned lifetime schedules and caregiving values. Strong communication flows and support systems.",
    strengths: ["Life Vision", "Trust Sync", "Financial Alignment"],
    personality: "Analytical & Organized (INTJ)",
    caste: "Sunni",
    profession: "Chartered Accountant",
    aboutMe: "Chartered accountant who enjoys reading, playing chess, and outdoor trekking. Looking for a career-minded partner.",
    voice: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    video: "https://assets.mixkit.co/videos/preview/mixkit-man-holding-cup-smiling-41804-large.mp4",
    photos: [
      { id: "1", dataUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" }
    ]
  }
];

import ProfileSlideOver from "@/components/dashboard/ProfileSlideOver";
import VerificationModal from "@/components/dashboard/VerificationModal";
import { MatchesPageSkeleton } from "@/components/dashboard/Skeleton";
import { API_URL } from "@/lib/config";

export default function AIMatchesLegacy() {
  const router = useRouter();
  const { addToCompare, removeFromCompare, isCompared, alertMsg: globalAlert, setAlertMsg: setGlobalAlert } = useCompare();
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("ai-recommendations");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [showKycModal, setShowKycModal] = useState(false);

  useEffect(() => {
    if (globalAlert) {
      setAlertMsg(globalAlert);
      setGlobalAlert(null);
    }
  }, [globalAlert, setGlobalAlert]);

  useEffect(() => {
    if (selectedProfile) {
      setActivePhoto(selectedProfile.img);
    } else {
      setActivePhoto(null);
    }
  }, [selectedProfile]);

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
      const res = await fetch(`${API_URL}/user/interest?idsOnly=true`, {
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

      const res = await fetch(`${API_URL}/user/profiles`, {
        headers: storedToken ? { "Authorization": `Bearer ${storedToken}` } : {}
      });
      const data = await res.json();
      
      const currentUserGender = (currentUser?.gender || "male").toLowerCase();
      if (data.success && data.users) {
        const tokenPayload = storedToken ? JSON.parse(atob(storedToken.split(".")[1])) : {};
        const loggedInId = tokenPayload.userId || null;

        const mocks = currentUserGender === "female" ? fallbackMockMaleProfiles : fallbackMockProfiles;
        
        const otherUsers = data.users.filter((u: any) => u.id !== loggedInId);
        
        if (otherUsers.length > 0) {
          const mappedUsers = otherUsers.map((u: any, i: number) => {
            const enriched = getEnrichedProfile(u);
            const aesthetic = aiAestheticTemplates[i % aiAestheticTemplates.length];

            return {
              ...enriched,
              id: u.id,
              name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
              img: enriched.photo,
              caste: enriched.community,
              profession: enriched.profession,
              photos: u.profile_details?.mn_profile_photos_draft?.photos || [],
              video: u.profile_details?.mn_video_intro_draft?.video?.dataUrl || null,
              voice: u.profile_details?.mn_voice_intro_draft?.voice?.dataUrl || null,
              aboutMe: enriched.aboutMe || enriched.personalityDescription,
              matchScore: aesthetic.matchScore,
              aiExplanation: aesthetic.aiExplanation,
              strengths: aesthetic.strengths,
              personality: aesthetic.personality,
              conversationStarter: aesthetic.conversationStarter,
              matchReason: aesthetic.aiExplanation,
              kyc_status: u.kyc_status,
              is_online: u.is_online,
              is_new_user: u.is_new_user,
              created_at: u.created_at,
              last_login: u.last_login
            };
          });

          const sorted = [...mappedUsers].sort((a, b) => b.matchScore - a.matchScore);
          const best = sorted[0];
          const picks = sorted.slice(1, 4);
          const nearby = sorted.slice(4, 6);
          const similar = sorted.slice(6, 8);

          setAiData({
            bestMatch: best || mocks[0],
            dailyPicks: picks.length > 0 ? picks : mocks.slice(1, 4),
            nearby: nearby.length > 0 ? nearby : mocks.slice(1, 3),
            similarPersonality: similar.length > 0 ? similar : mocks.slice(2, 4)
          });
        } else {
          setAiData({
            bestMatch: mocks[0],
            dailyPicks: mocks.slice(1, 4),
            nearby: mocks.slice(1, 3),
            similarPersonality: mocks.slice(2, 4)
          });
        }
      }
    } catch (err) {
      console.error("AI recommendations assembly failed:", err);
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
    setMounted(true);
    fetchProfilesAndAssembleAiMatches();
  }, []);

  const handleToggleInterest = async (receiverId: number, profileName: string) => {
    if (currentUser?.kyc_status !== "VERIFIED") {
      setShowKycModal(true);
      return;
    }

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

  useEffect(() => {
    if (alertMsg) {
      const t = setTimeout(() => setAlertMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alertMsg]);

  if (loading) {
    return <MatchesPageSkeleton />;
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
          <HeartHandshake className="w-6 h-6 text-brand-600" />
          AI Matchmaking
        </h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Our intelligent recommendation engine analyzes 50+ data points including religion, education, personality, and behavioral patterns to find your perfect match.
        </p>
      </div>

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
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-brand-600" />
              Highest Compatibility Match
            </h2>
            <div className="bg-gradient-to-br from-brand-900 to-brand-700 rounded-xl overflow-hidden shadow-xl relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:24px_24px] opacity-10" />
              
              <div className="flex flex-col md:flex-row relative z-10">
                <div className="md:w-2/5 h-64 md:h-auto relative bg-gray-900/10 overflow-hidden">
                  {(() => {
                    const canViewBestProfile = isBestMutual;
                    return (
                      <>
                        {bestMatch.img ? (
                          <img 
                            src={bestMatch.img} 
                            alt={bestMatch.name} 
                            className={`w-full h-full object-cover ${!canViewBestProfile ? "filter blur-[16px] select-none" : ""}`} 
                          />
                        ) : (
                          <div className="w-full h-full bg-brand-800 flex items-center justify-center text-white font-extrabold text-6xl uppercase">
                            {bestMatch.name.charAt(0)}
                          </div>
                        )}
                        {!canViewBestProfile && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-all z-10">
                            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-white/20 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-brand-600" />
                              <span className="text-[10px] font-bold text-gray-700">Connect mutually to view photo</span>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-brand-900 z-10" />
                  
                  <div className="absolute bottom-4 left-4 md:hidden">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-1.5">
                      {bestMatch.name}
                      {bestMatch.kyc_status === "VERIFIED" && (
                        <span title="ID Verified" className="shrink-0"><ShieldCheck className="w-4 h-4 text-blue-400 fill-blue-900/40" /></span>
                      )}
                    </h3>
                    <p className="text-brand-100">{bestMatch.age} yrs • {bestMatch.location}</p>
                  </div>
                </div>

                <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-center text-white">
                  <div className="hidden md:block mb-4">
                    <h3 className="text-3xl font-bold font-playfair flex items-center gap-2">
                      {bestMatch.name}
                      {bestMatch.kyc_status === "VERIFIED" && (
                        <span title="ID Verified" className="shrink-0"><ShieldCheck className="w-6 h-6 text-blue-400 fill-blue-900/40" /></span>
                      )}
                    </h3>
                    <p className="text-brand-100 text-sm mt-1">{bestMatch.age} yrs • {bestMatch.location} • {bestMatch.caste}</p>
                  </div>

                  <div className="mb-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-brand-50 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-brand-200" />
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
                      title="View Details"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        if (isCompared(bestMatch.id)) {
                          removeFromCompare(bestMatch.id);
                        } else {
                          addToCompare(bestMatch.id);
                        }
                      }}
                      className={`px-5 font-medium py-3 rounded-xl border transition-colors flex items-center justify-center ${
                        isCompared(bestMatch.id)
                          ? "bg-brand-600 text-white border-brand-500 hover:bg-brand-700"
                          : "bg-brand-800/50 text-white border-brand-500/30 hover:bg-brand-700/50"
                      }`}
                      title={isCompared(bestMatch.id) ? "Remove from Compare" : "Compare Profile"}
                    >
                      <Layers className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-brand-600" />
                Recommended Daily
              </h2>
              <button onClick={() => router.push("/dashboard/search")} className="text-sm text-brand-600 font-medium hover:underline">View All</button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {aiData.dailyPicks.map((profile, i) => {
                const isMutual = interests.mutual.includes(profile.id);
                const isSent = interests.sent.includes(profile.id);
                const isReceived = interests.received.includes(profile.id);
                const canViewProfile = isMutual;

                return (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedProfile(profile)}
                    className="relative h-[440px] rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-brand-200 transition-all duration-300 group cursor-pointer flex flex-col justify-end"
                  >
                    {profile.img ? (
                      <img 
                        src={profile.img} 
                        alt={profile.name} 
                        className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 z-0 ${!canViewProfile ? "filter blur-[12px] select-none" : ""}`} 
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center text-brand-700 font-extrabold text-7xl uppercase z-0">
                        {profile.name.charAt(0)}
                      </div>
                    )}

                    {!canViewProfile && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[6px] flex items-center justify-center transition-all z-10">
                        <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-sm border border-white/20 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-brand-600" />
                          <span className="text-[10px] font-bold text-gray-700">Connect mutually to view photo</span>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10 pointer-events-none" />

                    <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-20">
                      {profile.is_online && (
                        <span className="flex items-center gap-1 bg-green-500/20 backdrop-blur-md text-green-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          Online
                        </span>
                      )}
                      {(profile.is_new_user || (profile.created_at && Math.abs(new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 7)) ? (
                        <span className="bg-brand-500/20 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-white/10">
                          New
                        </span>
                      ) : (profile.last_login && Math.abs(new Date().getTime() - new Date(profile.last_login).getTime()) / (1000 * 60 * 60) <= 24) ? (
                        <span className="bg-blue-500/20 backdrop-blur-md text-blue-300 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-blue-500/30">
                          Active
                        </span>
                      ) : null}
                    </div>

                    <div className="absolute top-3 right-12 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-brand-700 shadow-sm flex items-center gap-1 z-20 pointer-events-none">
                      <TrendingUp className="w-3 h-3" /> {profile.matchScore}% Match
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCompared(profile.id)) {
                          removeFromCompare(profile.id);
                        } else {
                          addToCompare(profile.id);
                        }
                      }}
                      className={`absolute top-3 right-3 p-1.5 rounded-lg backdrop-blur-md transition-all shadow-sm z-20 ${
                        isCompared(profile.id)
                          ? "bg-brand-600 text-white"
                          : "bg-white/80 text-gray-700 hover:bg-white"
                      }`}
                      title={isCompared(profile.id) ? "Remove from Compare" : "Compare Profile"}
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>

                    <div className="relative z-20 p-5 w-full text-white flex flex-col gap-2.5">
                      <h3 className="font-bold text-white text-base flex items-center gap-1">
                        {profile.name}
                        {profile.kyc_status === "VERIFIED" && (
                          <span title="ID Verified" className="shrink-0"><ShieldCheck className="w-4 h-4 text-blue-400 fill-blue-900/50" /></span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-200">{profile.age} yrs • {profile.location}</p>
                      <p className="text-xs text-gray-300">{profile.education || "No Higher Education"}</p>
                      
                      <div className="mt-1 pt-2 border-t border-white/10 flex flex-col gap-1.5">
                        <p className="text-[10px] text-brand-300 bg-brand-950/60 border border-brand-500/30 inline-block w-max px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider">
                          {profile.profession}
                        </p>
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                          <span className="font-semibold text-gray-200">AI Note:</span> {profile.matchReason}
                        </p>
                      </div>
                    </div>

                    <div className="relative z-20 px-5 pb-5 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProfile(profile);
                        }}
                        className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 shadow-md"
                      >
                        <Info className="w-3.5 h-3.5" /> View Analysis & Connect
                      </button>
                    </div>
                  </motion.div>
              )})}
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-8">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-600" />
                Similar Personalities
              </h2>
              <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-sm">
                {aiData.similarPersonality.map(profile => {
                  const isMutual = interests.mutual.includes(profile.id);
                  const isSent = interests.sent.includes(profile.id);
                  const isReceived = interests.received.includes(profile.id);
                  const canViewProfile = isMutual;

                  return (
                    <div 
                      key={profile.id} 
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"
                      onClick={() => setSelectedProfile(profile)}
                    >
                      <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden shadow-sm bg-gray-50">
                        {profile.img ? (
                          <img 
                            src={profile.img} 
                            className={`w-full h-full object-cover ${!canViewProfile ? "filter blur-[8px] select-none" : ""}`} 
                          />
                        ) : (
                          <div className="w-full h-full bg-brand-50 flex items-center justify-center text-brand-700 font-extrabold text-sm uppercase">
                            {profile.name.charAt(0)}
                          </div>
                        )}
                        {!canViewProfile && (
                          <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate flex items-center gap-1">
                          {profile.name}
                          {profile.kyc_status === "VERIFIED" && (
                            <span title="ID Verified" className="shrink-0"><ShieldCheck className="w-3.5 h-3.5 text-blue-600 fill-blue-100" /></span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{profile.age} yrs • {profile.location}</p>
                        <p className="text-[10px] text-brand-600 mt-1 font-semibold bg-brand-50 w-max px-1.5 py-0.5 rounded">{profile.personality}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div className="text-brand-600 font-bold text-sm">{profile.matchScore}%</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCompared(profile.id)) {
                              removeFromCompare(profile.id);
                            } else {
                              addToCompare(profile.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isCompared(profile.id)
                              ? "bg-brand-600 text-white border-brand-500"
                              : "bg-gray-50 text-gray-400 border-gray-150 hover:text-brand-600"
                          }`}
                          title="Compare Profile"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                Nearby Compatible Profiles
              </h2>
              <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-sm">
                {aiData.nearby.map(profile => {
                  const isMutual = interests.mutual.includes(profile.id);
                  const isSent = interests.sent.includes(profile.id);
                  const isReceived = interests.received.includes(profile.id);
                  const canViewProfile = isMutual;

                  return (
                    <div 
                      key={profile.id} 
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"
                      onClick={() => setSelectedProfile(profile)}
                    >
                      <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden shadow-sm bg-gray-50 flex items-center justify-center">
                        {profile.img ? (
                          <img 
                            src={profile.img} 
                            className={`w-full h-full object-cover ${!canViewProfile ? "filter blur-[8px] select-none" : ""}`} 
                          />
                        ) : (
                          <div className="w-full h-full bg-brand-50 flex items-center justify-center text-brand-700 font-extrabold text-lg uppercase">
                            {profile.name.charAt(0)}
                          </div>
                        )}
                        {!canViewProfile && (
                          <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate flex items-center gap-1">
                          {profile.name}
                          {profile.kyc_status === "VERIFIED" && (
                            <span title="ID Verified" className="shrink-0"><ShieldCheck className="w-3.5 h-3.5 text-blue-600 fill-blue-100" /></span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{profile.caste}</p>
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-gray-400" /> {profile.location}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div className="text-brand-600 font-bold text-sm">{profile.matchScore}%</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCompared(profile.id)) {
                              removeFromCompare(profile.id);
                            } else {
                              addToCompare(profile.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isCompared(profile.id)
                              ? "bg-brand-600 text-white border-brand-500"
                              : "bg-gray-50 text-gray-400 border-gray-150 hover:text-brand-600"
                          }`}
                          title="Compare Profile"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </motion.div>
      )}

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
      <VerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        kycStatus={currentUser?.kyc_status}
      />
    </div>
  );
}
