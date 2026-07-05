"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, MessageCircle, Star, ArrowLeft, Loader2, Sparkles, 
  Lock, Unlock, ShieldCheck, Volume2, Video, MapPin, 
  BookOpen, Briefcase, Award, Users, HeartHandshake, Smile, Layers
} from "lucide-react";
import { getEnrichedProfile } from "@/lib/profile-utils";
import BiodataDownload from "@/components/dashboard/BiodataDownload";
import { useCompare } from "@/context/CompareContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProfileDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const profileId = parseInt(resolvedParams.id, 10);
  
  const { addToCompare, removeFromCompare, isCompared, setAlertMsg: setCompareAlert } = useCompare();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  
  const [interests, setInterests] = useState<{ sent: number[]; received: number[]; mutual: number[] }>({
    sent: [],
    received: [],
    mutual: []
  });

  const fetchInterests = async (token: string) => {
    try {
      const res = await fetch("http://localhost:3333/user/interest?idsOnly=true", {
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

  const fetchProfileData = async () => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (storedToken) {
        await fetchInterests(storedToken);
      }

      const res = await fetch(`http://localhost:3333/user/${profileId}`, {
        headers: storedToken ? { "Authorization": `Bearer ${storedToken}` } : {}
      });
      const data = await res.json();
      
      if (data.success && data.user) {
        const enriched = getEnrichedProfile(data.user);
        // Map any extra fields we need
        const mapped = {
          ...enriched,
          img: enriched.photo,
          caste: enriched.community,
          matchScore: 82 + (enriched.id % 15), // Stable mock AI match score
          photos: data.user.profile_details?.mn_profile_photos_draft?.photos || [],
          video: data.user.profile_details?.mn_video_intro_draft?.video?.dataUrl || null,
          voice: data.user.profile_details?.mn_voice_intro_draft?.voice?.dataUrl || null,
          aboutMe: enriched.aboutMe || enriched.personalityDescription,
          aiExplanation: data.user.profile_details?.mn_partner_preferences_draft?.explanation || "Highly compatible profile based on your preferences.",
          conversationStarter: "I would love to learn more about your values and partner goals!",
          kyc_status: data.user.kyc_status
        };
        setProfile(mapped);
        setActivePhoto(mapped.img || null);
      } else {
        setAlertMsg(data.message || "Failed to load profile details.");
      }
    } catch (err) {
      console.error("Failed to load profile details:", err);
      setAlertMsg("An error occurred while loading profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNaN(profileId)) {
      fetchProfileData();
    } else {
      setAlertMsg("Invalid Profile ID.");
      setLoading(false);
    }
  }, [profileId]);

  const handleToggleInterest = async () => {
    if (!profile) return;
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
        body: JSON.stringify({ receiver_id: profile.id })
      });

      const data = await res.json();
      if (data.success) {
        await fetchInterests(storedToken);
        if (data.status === "ACCEPTED") {
          setAlertMsg(`Mutual match established with ${profile.name}! 🎉 Chat unlocked.`);
        } else if (data.status === "PENDING") {
          setAlertMsg(`Interest request sent to ${profile.name}!`);
        } else {
          setAlertMsg(`Withdrew interest for ${profile.name}.`);
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-3 text-brand-500" />
        <p className="font-semibold text-sm text-gray-600">Retrieving full profile details...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl border border-gray-150 shadow-sm max-w-xl mx-auto my-12">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 font-bold text-3xl">!</div>
        <h2 className="text-xl font-bold text-gray-900">Profile Not Available</h2>
        <p className="text-sm text-gray-500 mt-2">{alertMsg || "We were unable to locate this member profile. It may have been deactivated or gender restrictions might apply."}</p>
        <button onClick={() => router.back()} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const isMutual = interests.mutual.includes(profile.id);
  const isSent = interests.sent.includes(profile.id);
  const isReceived = interests.received.includes(profile.id);
  const isInterested = isMutual || isSent || isReceived;

  let interestBtnText = "Express Interest";
  let interestBtnStyle = "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/10";
  if (isMutual) {
    interestBtnText = "Matched! Chat Now 🎉";
    interestBtnStyle = "bg-pink-600 hover:bg-pink-700 text-white shadow-pink-600/10";
  } else if (isSent) {
    interestBtnText = "Request Pending (Withdraw)";
    interestBtnStyle = "bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200";
  } else if (isReceived) {
    interestBtnText = "Accept Interest Request";
    interestBtnStyle = "bg-amber-500 hover:bg-amber-600 text-white animate-pulse";
  }

  return (
    <div className="space-y-6 pb-12 relative max-w-5xl mx-auto">
      {/* Alert Banner */}
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

      {/* Navigation bar / Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-brand-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-gray-150/80 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to matches
        </button>
        <div className="text-xs text-gray-400 font-semibold">
          Profile ID: <span className="text-gray-800 font-bold">{profile.profileId}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Left Side: Avatar Card and Gallery */}
        <div className="md:col-span-1 space-y-5">
          {/* Main profile card */}
          <div className="bg-white rounded-xl border border-gray-150/85 overflow-hidden shadow-sm sticky top-6">
            <div className="h-72 bg-gray-100 relative overflow-hidden flex items-center justify-center">
              {activePhoto || profile.img ? (
                <img 
                  src={activePhoto || profile.img} 
                  alt={profile.name} 
                  className={`w-full h-full object-cover transition-transform duration-700 ${!isInterested ? "filter blur-[18px] select-none" : ""}`} 
                />
              ) : (
                <div className="w-full h-full bg-brand-50 flex items-center justify-center text-brand-700 font-extrabold text-7xl uppercase">
                  {profile.name.charAt(0)}
                </div>
              )}

              {!isInterested && (
                <div className="absolute inset-0 bg-black/15 flex items-center justify-center z-10">
                  <div className="bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-full shadow-md border border-white/20 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-brand-600" />
                    <span className="text-[10px] font-bold text-gray-700">Connect to view photo</span>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />

              {/* Match Score Indicator */}
              <div className="absolute top-4 right-4 bg-brand-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {profile.matchScore}% Match
              </div>

              {/* Name Overlay */}
              <div className="absolute bottom-4 left-5 right-5 z-15">
                <h1 className="text-xl font-bold text-white drop-shadow-sm flex items-center gap-1.5">
                  {profile.name}
                  {profile.kyc_status === "VERIFIED" && (
                    <span title="ID Verified" className="shrink-0"><ShieldCheck className="w-5 h-5 text-blue-400 fill-blue-900/40" /></span>
                  )}
                </h1>
                <p className="text-gray-200 text-xs mt-0.5 font-medium">{profile.age} yrs · {profile.location}</p>
              </div>
            </div>

            {/* Photo Gallery Thumbnails */}
            {profile.photos && profile.photos.length > 1 && (
              <div className="p-4 border-b border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Photo Gallery</p>
                <div className="flex flex-wrap gap-2">
                  {profile.photos.map((p: any, idx: number) => (
                    <button
                      key={p.id || idx}
                      onClick={() => setActivePhoto(p.dataUrl)}
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        activePhoto === p.dataUrl ? "border-brand-600 scale-95" : "border-gray-200 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img 
                        src={p.dataUrl} 
                        className={`w-full h-full object-cover ${!isInterested ? "filter blur-[8px] select-none" : ""}`} 
                        alt="" 
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="p-5 space-y-3">
              <button 
                onClick={handleToggleInterest}
                className={`w-full py-3 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] ${interestBtnStyle}`}
              >
                <Heart className={`w-4 h-4 ${(isMutual || isSent) ? "fill-current" : ""}`} />
                {interestBtnText}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isMutual) {
                      router.push("/dashboard/chat");
                    } else {
                      setAlertMsg("Chat is locked! Establish a mutual match first.");
                    }
                  }}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                    isMutual 
                      ? "bg-brand-50 text-brand-700 hover:bg-brand-100" 
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" /> Chat
                </button>

                <button
                  onClick={() => {
                    if (isCompared(profile.id)) {
                      removeFromCompare(profile.id);
                    } else {
                      addToCompare(profile.id);
                    }
                  }}
                  className={`px-4 py-3 rounded-xl border transition-colors flex items-center justify-center ${
                    isCompared(profile.id)
                      ? "bg-brand-600 text-white border-brand-500 hover:bg-brand-700"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                  title="Compare Profile"
                >
                  <Layers className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="pt-2 border-t border-gray-50 flex justify-center">
                <BiodataDownload profile={profile} enriched={getEnrichedProfile(profile)} />
              </div>
            </div>
          </div>

          {/* QR Code Sharing Card */}
          <div className="bg-white p-4 rounded-xl border border-gray-150/80 shadow-xs text-center space-y-3">
            <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-600" /> Share Profile (QR Code)
            </h3>
            <div className="flex justify-center p-2 bg-gray-50 rounded-lg border border-gray-100 w-max mx-auto">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.href : `http://localhost:3000/dashboard/profile/${profile.id}`
                )}`}
                alt="Profile QR Code"
                className="w-28 h-28"
                onError={(e: any) => { e.target.style.display = 'none'; }}
              />
            </div>
            <p className="text-[10px] text-gray-450 leading-relaxed max-w-[180px] mx-auto">
              Scan this QR code to access this profile details and download the matrimonial biodata PDF.
            </p>
          </div>
        </div>

        {/* Right Side: Detailed Profile Information */}
        <div className="md:col-span-2 space-y-6">
          {/* About section */}
          {profile.aboutMe && (
            <div className="bg-white p-6 rounded-xl border border-gray-150/80 shadow-xs">
              <h2 className="text-base font-bold text-gray-900 font-playfair mb-3 flex items-center gap-2">
                <Smile className="w-5 h-5 text-brand-600" /> About Me
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {profile.aboutMe}
              </p>
            </div>
          )}

          {/* AI compatibility card */}
          <div className="bg-gradient-to-br from-brand-900 to-brand-850 p-6 rounded-xl text-white shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:20px_20px] opacity-5" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold font-playfair text-white text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-300" /> AI Compatibility Report
                </h3>
                <span className="bg-white/10 px-3 py-1 rounded-xl text-xs font-bold tracking-wider">{profile.matchScore}% Score</span>
              </div>
              <p className="text-sm text-brand-100 leading-relaxed">
                {profile.aiExplanation}
              </p>
              {profile.conversationStarter && (
                <div className="bg-black/15 p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-brand-200 uppercase tracking-wider block">Recommended Icebreaker</span>
                  <p className="text-xs text-white font-medium italic">"{profile.conversationStarter}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Info Details Section Cards */}
          <div className="space-y-4">
            {/* 1. Basic Details */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600" /> Basic Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">Age</span>
                  <span className="text-gray-800 font-bold">{profile.age || "N/A"} Years</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Gender</span>
                  <span className="text-gray-800 font-bold">{profile.gender || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Marital Status</span>
                  <span className="text-gray-800 font-bold">{profile.maritalStatus || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Height</span>
                  <span className="text-gray-800 font-bold">{profile.height || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Weight</span>
                  <span className="text-gray-800 font-bold">{profile.weight || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Mother Tongue</span>
                  <span className="text-gray-800 font-bold">{profile.motherTongue || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Languages Spoken</span>
                  <span className="text-gray-800 font-bold">{profile.languagesSpoken || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Present Location</span>
                  <span className="text-gray-800 font-bold">{profile.location || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Physical Status</span>
                  <span className="text-gray-800 font-bold">{profile.physicalStatus || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* 2. Religious Background */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600" /> Religious Info
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">Religion</span>
                  <span className="text-gray-800 font-bold">{profile.religion || "Islam"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Sect / Community</span>
                  <span className="text-gray-800 font-bold">{profile.caste || profile.community || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Religious Belief</span>
                  <span className="text-gray-800 font-bold">{profile.religiousness || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Namaz Habits</span>
                  <span className="text-gray-800 font-bold">{profile.namaz || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Quran Reading</span>
                  <span className="text-gray-800 font-bold">{profile.quranReading || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* 3. Professional Info */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-600" /> Education & Career
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-gray-400 font-medium block">Education</span>
                  <span className="text-gray-800 font-bold">{profile.education || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 font-medium block">Institution</span>
                  <span className="text-gray-800 font-bold">{profile.educationalInstitution || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Profession Type</span>
                  <span className="text-gray-800 font-bold">{profile.professionType || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Profession</span>
                  <span className="text-gray-800 font-bold">{profile.profession || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Company</span>
                  <span className="text-gray-800 font-bold">{profile.companyName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Annual Income</span>
                  <span className="text-gray-800 font-bold">{profile.annualIncome || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* 4. Family Details */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-600" /> Family Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">Family Type</span>
                  <span className="text-gray-800 font-bold">{profile.familyType || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Financial Status</span>
                  <span className="text-gray-800 font-bold">{profile.financialStatus || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Family Values</span>
                  <span className="text-gray-800 font-bold">{profile.familyValues || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Father's Occupation</span>
                  <span className="text-gray-800 font-bold">{profile.fatherOccupation || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Mother's Occupation</span>
                  <span className="text-gray-800 font-bold">{profile.motherOccupation || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Siblings count</span>
                  <span className="text-gray-800 font-bold">{profile.siblingsCount || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* 5. Partner Preferences */}
            <div className="bg-brand-50/15 p-5 rounded-2xl border border-brand-100/30 shadow-xs">
              <h3 className="text-sm font-bold text-brand-700 border-b border-brand-100/20 pb-2 mb-3 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4" /> Partner Preferences
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-brand-600/70 font-medium block">Age Preference</span>
                  <span className="text-brand-950 font-bold">{profile.prefAge || "N/A"}</span>
                </div>
                <div>
                  <span className="text-brand-600/70 font-medium block">Preferred Marital Status</span>
                  <span className="text-brand-950 font-bold">{profile.prefMaritalStatus || "N/A"}</span>
                </div>
                <div>
                  <span className="text-brand-600/70 font-medium block">Preferred Religion</span>
                  <span className="text-brand-950 font-bold">{profile.prefReligion || "N/A"}</span>
                </div>
                <div>
                  <span className="text-brand-600/70 font-medium block">Preferred Sect</span>
                  <span className="text-brand-950 font-bold">{profile.prefCommunity || "N/A"}</span>
                </div>
                <div>
                  <span className="text-brand-600/70 font-medium block">Preferred Namaz</span>
                  <span className="text-brand-950 font-bold">{profile.prefNamaz || "N/A"}</span>
                </div>
                <div>
                  <span className="text-brand-600/70 font-medium block">Preferred Quran</span>
                  <span className="text-brand-950 font-bold">{profile.prefQuranReading || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-brand-600/70 font-medium block">Preferred Education</span>
                  <span className="text-brand-950 font-bold">{profile.prefEducation || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-brand-600/70 font-medium block">Preferred Locations</span>
                  <span className="text-brand-950 font-bold">{profile.prefLocations || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Media intros (Voice/Video) */}
            {(profile.voice || profile.video) && (
              <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-brand-600" /> Media Introductions
                </h3>
                
                {profile.voice && (
                  <div className="bg-brand-50/40 p-4 rounded-xl border border-brand-100/20 flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-brand-700 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4" /> Audio Voice Bio
                    </span>
                    <audio src={profile.voice} controls className="w-full h-8 mt-1 accent-brand-600" />
                  </div>
                )}

                {profile.video && (
                  <div className="bg-brand-50/40 p-4 rounded-xl border border-brand-100/20 flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-brand-700 flex items-center gap-1.5">
                      <Video className="w-4 h-4" /> Video Onboarding / Introduction
                    </span>
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-black mt-1.5 max-w-lg mx-auto w-full">
                      <video src={profile.video} controls className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
