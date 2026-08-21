"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle, Sparkles, Volume2, Video, ShieldCheck, Lock, ChevronLeft, ChevronRight, ExternalLink, Star, MoreVertical, Ban, Flag, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { getEnrichedProfile } from "@/lib/profile-utils";
import BiodataDownload from "./BiodataDownload";
import { SlideOverSkeleton } from "./Skeleton";
import { useProfileActions } from "@/hooks/useProfileActions";
import { API_URL } from "@/lib/config";

import { useUser } from "@/context/UserContext";
import VerificationModal from "./VerificationModal";

interface ProfileSlideOverProps {
  profile: {
    id: number;
    uuid?: string;
    name: string;
    age?: number | string;
    location?: string;
    caste?: string;
    community?: string;
    matchScore?: number;
    match?: number;
    img?: string;
    gender?: string;
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
  const { currentUser } = useUser();
  const [fullUser, setFullUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toggleFavourite, toggleBlock, isFavourite, isBlocked } = useProfileActions();

  const [showKycModal, setShowKycModal] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let active = true;
    if (!profile) {
      setFullUser(null);
      setLoading(false);
      return;
    }

    const fetchFullDetails = async () => {
      setLoading(true);
      setPhotoIndex(0);
      try {
        const token = localStorage.getItem("mn_token");
        const res = await fetch(`${API_URL}/user/${profile.id}`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && active) {
          const enriched = getEnrichedProfile(data.user);
          const rawPhotos: string[] = data.user.profile_details?.mn_profile_photos_draft?.photos?.map((p: any) => p.dataUrl).filter(Boolean) || [];
          const allPhotos = enriched.photo
            ? [enriched.photo, ...rawPhotos.filter((p) => p !== enriched.photo)]
            : rawPhotos;

          const mapped = {
            ...enriched,
            id: data.user.id,
            name: `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim(),
            img: enriched.photo,
            caste: enriched.community,
            matchScore: profile.matchScore || profile.match || 82,
            photos: allPhotos,
            voice: data.user.profile_details?.mn_voice_intro_draft?.voice?.dataUrl || null,
            aboutMe: enriched.aboutMe || enriched.personalityDescription,
            aiExplanation: data.user.profile_details?.mn_partner_preferences_draft?.explanation || "Highly compatible profile based on your preferences.",
            conversationStarter: "I would love to learn more about your values and partner goals!",
            kyc_status: data.user.kyc_status,
            mobile_number: data.user.mobile_number,
            email: data.user.email
          };
          setFullUser(mapped);
          setPhotos(allPhotos.length > 0 ? allPhotos : [enriched.photo].filter(Boolean) as string[]);
        }
      } catch (err) {
        console.error("Failed to load details:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchFullDetails();
    return () => { active = false; };
  }, [profile?.id]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const prevPhoto = useCallback(() => {
    setPhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);

  const nextPhoto = useCallback(() => {
    setPhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }, [photos.length]);

  if (!profile) return null;

  const isVerified = (profile?.kyc_status || fullUser?.kyc_status) === "VERIFIED" || ((profile as any)?.is_verified || (fullUser as any)?.is_verified) === true;
  const isMutual = interests.mutual.includes(profile.id);
  const isSent = interests.sent.includes(profile.id);
  const isReceived = interests.received.includes(profile.id);
  const genderVal = profile.gender || fullUser?.gender || "";
  const isMaleProfile = genderVal.toLowerCase() === "male";
  const isViewerVerified = currentUser?.kyc_status === "VERIFIED";
  const canViewProfile = isMutual || isMaleProfile || isViewerVerified;

  let modalBtnText = "Send Interest";
  let modalBtnStyle = "bg-brand-600 text-white hover:bg-brand-700 shadow-sm";
  if (isMutual) {
    modalBtnText = "Matched! Chat Now 🎉";
    modalBtnStyle = "bg-pink-600 text-white hover:bg-pink-700 shadow-sm";
  } else if (isSent) {
    modalBtnText = "Withdraw Request";
    modalBtnStyle = "bg-pink-100 text-pink-700 hover:bg-pink-200 border border-pink-200";
  } else if (isReceived) {
    modalBtnText = "Accept Request";
    modalBtnStyle = "bg-amber-500 text-white hover:bg-amber-600 animate-pulse";
  }

  const currentPhoto = photos[photoIndex] || profile.img || null;

  return (
    <>
      <AnimatePresence>
        <div key="profile-slide-over" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col z-10 max-h-[94vh] sm:max-h-[90vh] overflow-hidden"
        >
          {/* ─── PHOTO CAROUSEL ─── */}
          <div className="relative h-64 sm:h-72 bg-gray-100 flex-shrink-0 overflow-hidden rounded-t-2xl">
            {/* Photo with animated slide */}
            <AnimatePresence mode="wait">
              <motion.div
                key={photoIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt=""
                    className={`w-full h-full object-cover object-[center_20%] ${!canViewProfile ? "filter blur-[16px] scale-110 select-none" : ""}`}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#026d77]/10 via-[#026d77]/20 to-[#026d77]/35 flex flex-col items-center justify-center p-6 text-center">
                    <img src="/logoMain-01.svg" alt="MN Logo" className="w-20 h-20 object-contain opacity-55 mb-2" />
                    <span className="text-[10px] font-bold text-[#026d77]/70 uppercase tracking-widest">Malappuram Nikah</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Blurred lock overlay */}
            {!canViewProfile && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-10">
                <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-white/30 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-brand-600" />
                  <span className="text-[11px] font-bold text-gray-700">Connect mutually to view photos</span>
                </div>
              </div>
            )}

            {/* Prev / Next arrows – only if multiple photos and connected */}
            {photos.length > 1 && canViewProfile && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/35 hover:bg-black/55 backdrop-blur-sm rounded-full text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/35 hover:bg-black/55 backdrop-blur-sm rounded-full text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {photos.length > 1 && (
              <div className="absolute bottom-[52px] left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    className={`rounded-full transition-all ${
                      i === photoIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10 pointer-events-none" />

            {/* Overlay actions: Close | Favourite | More */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
              {/* Favourite */}
              <button
                onClick={async () => {
                  if (!profile) return;
                  const result = await toggleFavourite(profile.id);
                  showToast(result === "FAVOURITED" ? "⭐ Added to favourites" : "Removed from favourites");
                }}
                className="p-1.5 bg-black/30 hover:bg-black/55 backdrop-blur-sm rounded-full text-white transition-colors"
                title="Favourite"
              >
                <Star className={`w-4 h-4 ${isFavourite(profile.id) ? "fill-amber-400 text-amber-400" : ""}`} />
              </button>

              {/* More menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 bg-black/30 hover:bg-black/55 backdrop-blur-sm rounded-full text-white transition-colors"
                  title="More actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      key="slide-over-menu"
                      initial={{ opacity: 0, scale: 0.85, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-9 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                      <button
                        onClick={async () => {
                          setMenuOpen(false);
                          const result = await toggleBlock(profile.id);
                          if (result === "BLOCKED") {
                            showToast("🚫 User blocked");
                            setTimeout(onClose, 800);
                          } else {
                            showToast("✓ User unblocked");
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        {isBlocked(profile.id) ? "Unblock user" : "Block user"}
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); showToast("Report submitted"); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold hover:bg-gray-50 text-gray-600 transition-colors border-t border-gray-50"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Report profile
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="p-1.5 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  key="slide-over-toast"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 bg-gray-900/90 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-full shadow-lg whitespace-nowrap"
                >
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name / info overlay */}
            <div className="absolute bottom-3 left-4 right-4 z-20">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white drop-shadow flex items-center gap-1.5">
                    {profile.name}
                    {(fullUser?.kyc_status || profile.kyc_status) === "VERIFIED" && (
                      <ShieldCheck className="w-4 h-4 text-blue-400 fill-blue-900/40 shrink-0" />
                    )}
                  </h2>
                  <p className="text-gray-200 text-xs mt-0.5 font-medium">
                    {profile.age} yrs • {isMutual || (currentUser && profile ? currentUser.id === profile.id : false) ? profile.location : (profile.location?.split(",")[0] || "N/A")} • {profile.caste || profile.community}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── SCROLLABLE BODY ─── */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="p-5">
                <SlideOverSkeleton />
              </div>
            ) : fullUser ? (
              canViewProfile ? (
              <div className="p-4 sm:p-5 space-y-4">

                {/* About */}
                {fullUser.aboutMe && (
                  <div>
                    <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">About</h3>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">{fullUser.aboutMe}</p>
                  </div>
                )}

                {/* Profile Info */}
                <div className="bg-gray-50/80 p-3 sm:p-3.5 rounded-xl border border-gray-150/80 space-y-2">
                  <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-250/60 pb-1 mb-0.5">Profile Info</h3>
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

                {/* Partner Preferences */}
                <div className="bg-brand-50/30 p-3 sm:p-3.5 rounded-xl border border-brand-100/40 space-y-2">
                  <h3 className="text-[9px] font-bold uppercase tracking-wider text-brand-700 border-b border-brand-100/30 pb-1 mb-0.5">Partner Preferences</h3>
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

                {/* Voice Introduction */}
                {fullUser.voice && (
                  <div className="bg-brand-50/40 border border-brand-100/30 p-3 rounded-xl flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5" /> Voice Introduction
                    </span>
                    <audio src={fullUser.voice} controls className="w-full h-8 mt-0.5 accent-brand-600" />
                  </div>
                )}

                {/* Contact Details Section */}
                <div className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-xs space-y-3">
                  <h3 className="text-[9px] font-bold uppercase tracking-wider text-brand-700 border-b border-brand-100/30 pb-1 mb-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> Contact Details & Address
                  </h3>
                  {isMutual || (currentUser && profile ? currentUser.id === profile.id : false) ? (
                    <div className="grid grid-cols-1 gap-2.5 text-[11px]">
                      <div>
                        <span className="text-gray-400 font-medium block">Phone Number</span>
                        <span className="text-gray-800 font-bold">{fullUser.mobile_number || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium block">Email Address</span>
                        <span className="text-gray-800 font-bold">{fullUser.email || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium block">Full Address</span>
                        <span className="text-gray-800 font-bold">{fullUser.location || "N/A"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2 text-[11px] opacity-75">
                        <div>
                          <span className="text-gray-400 font-medium block">Phone Number</span>
                          <span className="text-gray-800 font-bold tracking-widest">{fullUser.mobile_number ? `${fullUser.mobile_number.slice(0, 6)}XXXXX` : "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium block">Email Address</span>
                          <span className="text-gray-800 font-bold">{fullUser.email ? `${fullUser.email.split("@")[0].slice(0, 3)}***@${fullUser.email.split("@")[1]}` : "N/A"}</span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-brand-50/50 border border-brand-100/50 rounded-lg flex items-center gap-2">
                        <Lock className="w-3 h-3 text-brand-600" />
                        <span className="text-[10px] text-brand-800 font-semibold leading-normal">
                          Accept invite to unlock full contact details.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5 text-brand-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Profile details are private</p>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                    Send interest and wait for them to accept — once you both connect, the full profile will be visible.
                  </p>
                </div>
              )
            ) : (
              <div className="py-20 text-center text-xs text-gray-400">
                Failed to load profile details.
              </div>
            )}
          </div>

          {/* ─── SAFETY BANNER ─── */}
          <div className="mx-4 mb-1 mt-0.5 flex-shrink-0">
            <div className="flex items-start gap-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 rounded-xl px-3.5 py-2.5">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <p className="text-[10px] leading-relaxed text-amber-900/80 font-medium">
                <span className="font-bold text-amber-800 block mb-0.5">⚠️ Safety Reminder</span>
                Always verify profile details in person before proceeding. Never share financial information or transfer money to anyone you meet online.
              </p>
            </div>
          </div>

          {/* ─── STICKY BOTTOM ACTIONS ─── */}
          <div className="p-4 border-t border-gray-100 bg-white flex flex-col gap-2.5 flex-shrink-0">
            <div className="flex gap-2.5">
              <button
                onClick={async () => {
                  if (currentUser?.kyc_status !== "VERIFIED") {
                    setShowKycModal(true);
                    return;
                  }
                  if (isMutual) {
                    onClose();
                    router.push("/dashboard/chat");
                  } else {
                    await onToggleInterest(profile.id, profile.name);
                  }
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98] ${modalBtnStyle}`}
              >
                <Heart className={`w-3.5 h-3.5 ${(isMutual || isSent) ? "fill-current" : ""}`} />
                {modalBtnText}
              </button>

              <button
                onClick={() => {
                  onClose();
                  const targetUuid = fullUser?.uuid || profile.uuid;
                  router.push(`/dashboard/profile/${targetUuid || profile.id}`);
                }}
                className="flex-1 py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl border border-gray-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Full Profile
              </button>
            </div>

            {fullUser && (
              <div className="w-full flex justify-center">
                <BiodataDownload 
                  profile={fullUser} 
                  enriched={fullUser} 
                  isAccepted={isMutual || (currentUser && profile ? currentUser.id === profile.id : false)}
                  isPending={isSent || isReceived}
                  onExpressInterest={() => {
                    if (currentUser?.kyc_status !== "VERIFIED") {
                      setShowKycModal(true);
                      return;
                    }
                    onToggleInterest(profile.id, profile.name);
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
        </div>
      </AnimatePresence>

      <VerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        kycStatus={currentUser?.kyc_status}
      />
    </>
  );
}
