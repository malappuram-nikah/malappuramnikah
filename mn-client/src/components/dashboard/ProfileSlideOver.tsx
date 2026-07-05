"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Heart, MessageCircle, Sparkles, Volume2, Video, ShieldCheck, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getEnrichedProfile } from "@/lib/profile-utils";
import BiodataDownload from "./BiodataDownload";

interface ProfileSlideOverProps {
  profile: {
    id: number;
    name: string;
    age?: number | string;
    location?: string;
    caste?: string;
    community?: string;
    matchScore?: number;
    match?: number;
    img?: string;
    kyc_status?: string;
  } | null;
  onClose: () => void;
  interests: {
    sent: number[];
    received: number[];
    mutual: number[];
  };
  onToggleInterest: (receiverId: number, profileName: string) => Promise<void> | void;
}

export default function ProfileSlideOver({
  profile,
  onClose,
  interests,
  onToggleInterest,
}: ProfileSlideOverProps) {
  const router = useRouter();
  const [fullUser, setFullUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!profile) {
      setFullUser(null);
      setLoading(false);
      return;
    }

    const fetchFullDetails = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("mn_token");
        const res = await fetch(`http://localhost:3333/user/${profile.id}`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && active) {
          const enriched = getEnrichedProfile(data.user);
          const mapped = {
            ...enriched,
            id: data.user.id,
            name: `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim(),
            img: enriched.photo,
            caste: enriched.community,
            matchScore: profile.matchScore || profile.match || 82,
            photos: data.user.profile_details?.mn_profile_photos_draft?.photos || [],
            video: data.user.profile_details?.mn_video_intro_draft?.video?.dataUrl || null,
            voice: data.user.profile_details?.mn_voice_intro_draft?.voice?.dataUrl || null,
            aboutMe: enriched.aboutMe || enriched.personalityDescription,
            aiExplanation: data.user.profile_details?.mn_partner_preferences_draft?.explanation || "Highly compatible profile based on your preferences.",
            conversationStarter: "I would love to learn more about your values and partner goals!",
            kyc_status: data.user.kyc_status
          };
          setFullUser(mapped);
          setActivePhoto(mapped.img || null);
        }
      } catch (err) {
        console.error("Failed to load details:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchFullDetails();
    return () => {
      active = false;
    };
  }, [profile?.id]);

  if (!profile) return null;

  const isMutual = interests.mutual.includes(profile.id);
  const isSent = interests.sent.includes(profile.id);
  const isReceived = interests.received.includes(profile.id);
  const isInterested = isMutual || isSent || isReceived;

  let modalBtnText = "Send Interest";
  let modalBtnStyle = "bg-brand-600 text-white hover:bg-brand-700 shadow-sm";
  if (isMutual) {
    modalBtnText = "Matched! Chat Now 🎉";
    modalBtnStyle = "bg-pink-600 text-white hover:bg-pink-700 shadow-sm";
  } else if (isSent) {
    modalBtnText = "Withdraw Sent Request";
    modalBtnStyle = "bg-pink-100 text-pink-700 hover:bg-pink-200 border border-pink-200";
  } else if (isReceived) {
    modalBtnText = "Accept Request";
    modalBtnStyle = "bg-amber-500 text-white hover:bg-amber-600 animate-pulse";
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs"
        onClick={onClose}
      />
      
      {/* Slide-over panel - Standardized border radius */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 230 }}
        className="relative w-full max-w-md sm:max-w-lg bg-white shadow-2xl h-full flex flex-col z-10 rounded-l-xl overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Header Image section */}
          <div className="h-48 bg-gray-100 relative overflow-hidden">
            {activePhoto || profile.img ? (
              <img
                src={activePhoto || profile.img}
                alt=""
                className={`w-full h-full object-cover ${!isInterested ? "filter blur-[14px] select-none" : ""}`}
              />
            ) : (
              <div className="w-full h-full bg-brand-50 flex items-center justify-center text-brand-700 font-extrabold text-5xl uppercase">
                {profile.name.charAt(0)}
              </div>
            )}
            
            {!isInterested && (
              <div className="absolute inset-0 bg-black/15 flex items-center justify-center z-10">
                <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-sm border border-white/25 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-600" />
                  <span className="text-[10px] font-bold text-gray-700">Connect to view photo</span>
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent z-10" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 p-1.5 bg-black/25 hover:bg-black/45 backdrop-blur-xs rounded-full text-white transition-colors z-20"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            
            {/* Bottom details of header */}
            <div className="absolute bottom-3 left-4 right-4 z-15">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white drop-shadow-sm flex items-center gap-1.5">
                    {profile.name}
                    {profile.kyc_status === "VERIFIED" && (
                      <span title="ID Verified" className="shrink-0">
                        <ShieldCheck className="w-4.5 h-4.5 text-blue-400 fill-blue-900/40" />
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-200 text-xs mt-0.5 font-medium">
                    {profile.age} yrs • {profile.location} • {profile.caste || profile.community}
                  </p>
                </div>
                <div className="bg-brand-600 text-white px-2.5 py-1 rounded-lg font-bold text-xs shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {profile.matchScore || profile.match}%
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-450 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <span className="text-xs font-semibold">Syncing profile details...</span>
            </div>
          ) : fullUser ? (
            /* Body content with reduced padding and gaps */
            <div className="p-4 sm:p-5 space-y-4">
              {/* Photo Gallery */}
              {fullUser.photos && fullUser.photos.length > 1 && (
                <div>
                  <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Photo Gallery</h3>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {fullUser.photos.map((p: any, idx: number) => (
                      <button
                        key={p.id || idx}
                        onClick={() => setActivePhoto(p.dataUrl)}
                        className={`w-11 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          activePhoto === p.dataUrl
                            ? "border-brand-600 scale-95"
                            : "border-gray-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={p.dataUrl}
                          className={`w-full h-full object-cover ${!isInterested ? "filter blur-[6px] select-none" : ""}`}
                          alt=""
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* About Me bio */}
              {fullUser.aboutMe && (
                <div>
                  <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">About</h3>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    {fullUser.aboutMe}
                  </p>
                </div>
              )}

              {/* Profile Info Details Grid */}
              <div className="bg-gray-50/80 p-3 sm:p-3.5 rounded-xl border border-gray-150/80 space-y-2">
                <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-250/60 pb-1 mb-0.5">
                  Profile Info
                </h3>
                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                  <div>
                    <span className="text-gray-400 font-medium block">Gender</span>
                    <span className="text-gray-800 font-bold">{fullUser.gender || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Marital Status</span>
                    <span className="text-gray-800 font-bold">{fullUser.maritalStatus || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Mother Tongue</span>
                    <span className="text-gray-800 font-bold">{fullUser.motherTongue || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Religion & Sect</span>
                    <span className="text-gray-800 font-bold">
                      {(fullUser.religion || "Islam") + " - " + (fullUser.caste || fullUser.community || "Sunni")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Namaz Habits</span>
                    <span className="text-gray-800 font-bold">{fullUser.namaz || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Quran Reading</span>
                    <span className="text-gray-800 font-bold">{fullUser.quranReading || "N/A"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 font-medium block">Education</span>
                    <span className="text-gray-800 font-bold">{fullUser.education || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Partner Preferences Grid */}
              <div className="bg-brand-50/30 p-3 sm:p-3.5 rounded-xl border border-brand-100/40 space-y-2">
                <h3 className="text-[9px] font-bold uppercase tracking-wider text-brand-700 border-b border-brand-100/30 pb-1 mb-0.5">
                  Partner Preferences
                </h3>
                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                  <div>
                    <span className="text-brand-600/70 font-medium block">Age Preference</span>
                    <span className="text-brand-950 font-bold">{fullUser.prefAge || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-brand-600/70 font-medium block">Marital Status</span>
                    <span className="text-brand-950 font-bold">{fullUser.prefMaritalStatus || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-brand-600/70 font-medium block">Preferred Religion</span>
                    <span className="text-brand-950 font-bold">{fullUser.prefReligion || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-brand-600/70 font-medium block">Preferred Sect</span>
                    <span className="text-brand-950 font-bold">{fullUser.prefCommunity || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-brand-600/70 font-medium block">Preferred Namaz</span>
                    <span className="text-brand-950 font-bold">{fullUser.prefNamaz || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-brand-600/70 font-medium block">Preferred Quran</span>
                    <span className="text-brand-950 font-bold">{fullUser.prefQuranReading || "N/A"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-brand-600/70 font-medium block">Preferred Education</span>
                    <span className="text-brand-950 font-bold">{fullUser.prefEducation || "N/A"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-brand-600/70 font-medium block">Preferred Locations</span>
                    <span className="text-brand-950 font-bold">{fullUser.prefLocations || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Voice Introduction Player */}
              {fullUser.voice && (
                <div className="bg-brand-50/40 border border-brand-100/30 p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" /> Voice Introduction
                  </span>
                  <audio src={fullUser.voice} controls className="w-full h-8 mt-0.5 accent-brand-600" />
                </div>
              )}

              {/* Video Introduction Player */}
              {fullUser.video && (
                <div className="bg-brand-50/40 border border-brand-100/30 p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" /> Video Onboarding
                  </span>
                  <div className="relative rounded-lg overflow-hidden aspect-video bg-black mt-0.5">
                    <video src={fullUser.video} controls className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              {/* AI Compatibility Analysis */}
              <div>
                <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">AI Compatibility Analysis</h3>
                <p className="text-xs text-gray-700 leading-relaxed bg-brand-50 p-3.5 rounded-xl border border-brand-100/40">
                  {fullUser.aiExplanation || fullUser.matchReason || "Highly compatible profile based on your preferences."}
                </p>
              </div>

              {/* Smart Icebreaker */}
              {fullUser.conversationStarter && (
                <div>
                  <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-brand-500" /> Smart Icebreaker
                  </h3>
                  <p className="text-xs text-gray-700 italic bg-gray-50 p-3.5 rounded-xl border border-gray-150">
                    "{fullUser.conversationStarter}"
                  </p>
                </div>
              )}

              {/* Action buttons at bottom */}
              <div className="flex flex-col gap-2.5 pt-1.5">
                <div className="flex gap-2.5">
                  <button
                    onClick={async () => {
                      if (isMutual) {
                        onClose();
                        router.push("/dashboard/chat");
                      } else {
                        await onToggleInterest(profile.id, profile.name);
                      }
                    }}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] ${modalBtnStyle}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${(isMutual || isSent) ? "fill-current" : ""}`} />
                    {modalBtnText}
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/dashboard/profile/${profile.id}`);
                    }}
                    className="flex-1 py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl border border-gray-200 transition-colors"
                  >
                    View Full Profile
                  </button>
                </div>
                
                <div className="w-full flex justify-center">
                  <BiodataDownload profile={fullUser} enriched={fullUser} />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-gray-400">
              Failed to load profile details.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
