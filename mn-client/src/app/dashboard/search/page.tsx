"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Loader2, X, Check, Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCompare } from "@/context/CompareContext";
import { useUser } from "@/context/UserContext";
import { getEnrichedProfile, calculateAge } from "@/lib/profile-utils";

import ProfileSlideOver from "@/components/dashboard/ProfileSlideOver";
import VerificationModal from "@/components/dashboard/VerificationModal";
import { CardGridSkeleton } from "@/components/dashboard/Skeleton";
import FilterSidebar from "@/components/search/FilterSidebar";
import { API_URL } from "@/lib/config";

export default function SearchPage() {
  const router = useRouter();
  const { alertMsg: globalAlert, setAlertMsg: setGlobalAlert, isCompared, addToCompare, removeFromCompare } = useCompare();
  const { currentUser } = useUser();
  const [mounted, setMounted] = useState(false);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState<any>({});
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [interests, setInterests] = useState<{ sent: number[]; received: number[]; mutual: number[] }>({ sent: [], received: [], mutual: [] });

  const isUserPremium = currentUser?.is_premium || false;

  useEffect(() => {
    setMounted(true);
    if (globalAlert) {
      setAlertMsg(globalAlert);
      setGlobalAlert(null);
    }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [globalAlert, setGlobalAlert]);

  useEffect(() => {
    if (alertMsg) {
      const t = setTimeout(() => setAlertMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alertMsg]);

  // Load Saved Preferences on Mount
  useEffect(() => {
    if (currentUser?.search_preferences) {
      try {
        setFilters(currentUser.search_preferences);
        setAppliedFilters(currentUser.search_preferences);
      } catch(e) {}
    }
  }, [currentUser]);

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
      console.error(e);
    }
  };

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const loadProfilesPage = useCallback(async (pageToFetch: number, isLoadMore = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) return;

      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);

      if (!isLoadMore && interests.sent.length === 0) {
        await fetchInterests(storedToken);
      }

      // Build Query String
      const params = new URLSearchParams();
      params.append("page", String(pageToFetch));
      params.append("limit", "12");
      if (appliedKeyword) params.append("keyword", appliedKeyword);

      // Append all filters
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            if (value.length > 0) params.append(key, value.join(","));
          } else {
            params.append(key, String(value));
          }
        }
      });

      const res = await fetch(`${API_URL}/search/profiles?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const data = await res.json();

      if (data.success) {
        const mapped = data.data.map((u: any) => {
          const enriched = getEnrichedProfile(u);
          return {
            ...enriched,
            id: u.id,
            name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
            img: enriched.photo,
            caste: enriched.community,
            match: 80 + Math.floor(Math.random() * 15),
            photos: u.profile_details?.mn_profile_photos_draft?.photos || [],
            video: u.profile_details?.mn_video_intro_draft?.video?.dataUrl || null,
            voice: u.profile_details?.mn_voice_intro_draft?.voice?.dataUrl || null,
            kyc_status: u.kyc_status,
            is_online: u.is_online,
            is_new_user: u.is_new_user,
            created_at: u.created_at,
            isBlurred: u.profile_details?.mn_profile_photos_draft?.isBlurred || false,
          };
        });

        if (isLoadMore) {
          setProfiles(prev => [...prev, ...mapped]);
        } else {
          setProfiles(mapped);
        }

        pageRef.current = pageToFetch;
        setTotalProfiles(data.pagination.total);
        setHasNext(data.pagination.hasNext);
      }
    } catch (e) {
      console.error("Profiles fetch error:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [appliedFilters, appliedKeyword, interests.sent.length]);

  const loadNextPage = useCallback(() => {
    if (hasNext && !isFetchingRef.current && !loadingMore && !loading) {
      loadProfilesPage(pageRef.current + 1, true);
    }
  }, [hasNext, loadingMore, loading, loadProfilesPage]);

  // Save Preferences to API
  const savePreferences = async (newFilters: any) => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) return;
      await fetch(`${API_URL}/search/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${storedToken}` },
        body: JSON.stringify({ preferences: newFilters })
      });
    } catch (e) {
      console.error("Failed to save preferences", e);
    }
  };

  useEffect(() => {
    pageRef.current = 1;
    loadProfilesPage(1, false);
  }, [appliedFilters, appliedKeyword, loadProfilesPage]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !isFetchingRef.current) {
          loadNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNext, loadNextPage]); // Fetch automatically runs only when appliedFilters or appliedKeyword changes

  const handleApplyFilters = () => {
    savePreferences(filters);
    setAppliedFilters(filters);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setAppliedKeyword(keyword);
    }
  };

  const [showKycModal, setShowKycModal] = useState(false);

  const handleToggleInterest = async (receiverId: number) => {
    if (currentUser?.kyc_status !== "VERIFIED") {
      setShowKycModal(true);
      return;
    }
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) return;
      const res = await fetch(`${API_URL}/user/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${storedToken}` },
        body: JSON.stringify({ receiver_id: receiverId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchInterests(storedToken);
        setAlertMsg(data.status === "ACCEPTED" ? "Match Established! 🎉" : "Interest expressed!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeFiltersCount = Object.keys(appliedFilters).filter(k => {
    const v = appliedFilters[k];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== "" && v !== false;
  }).length;

  if (!mounted) return null;

  return (
    <>
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 border border-gray-800"
          >
            <span>{alertMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="w-full flex items-start gap-6">
        
        {/* Desktop Sidebar OR Mobile Bottom Sheet */}
        <FilterSidebar 
          isOpen={showFilters} 
          onClose={() => setShowFilters(false)}
          filters={filters}
          setFilters={setFilters}
          onApply={handleApplyFilters}
          totalProfiles={totalProfiles}
          loading={loading}
          isUserPremium={isUserPremium}
        />

        {/* Results Area */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          
          {/* Header & Global Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center z-20">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                placeholder="Search by name, profession, or location..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#026d77] hover:bg-[#03828e] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter Profiles
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-gray-900 font-extrabold text-[10px] flex items-center justify-center ml-1 shadow-sm">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 items-center px-1">
              <span className="text-xs font-semibold text-gray-500">Active Filters:</span>
              {Object.entries(appliedFilters).map(([k, v]) => {
                if (v === undefined || v === null || v === "" || v === false) return null;
                if (Array.isArray(v) && v.length === 0) return null;
                const label = Array.isArray(v) ? v.join(", ") : String(v);
                return (
                  <div key={k} className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-100 text-brand-700 rounded-full text-xs font-medium">
                    <span className="capitalize">{k}:</span>
                    <span className="text-gray-900 truncate max-w-[150px]">{label}</span>
                    <button onClick={() => {
                      const newF = { ...appliedFilters }; delete newF[k];
                      setFilters(newF);
                      setAppliedFilters(newF);
                      savePreferences(newF);
                    }} className="ml-1 hover:text-brand-900"><X className="w-3 h-3" /></button>
                  </div>
                );
              })}
              <button onClick={() => { setFilters({}); setAppliedFilters({}); savePreferences({}); }} className="text-xs font-semibold text-red-500 hover:text-red-600 ml-2">
                Clear All
              </button>
            </div>
          )}

          {/* Results Grid */}
          {loading ? (
            <CardGridSkeleton count={6} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" />
          ) : profiles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 font-playfair mb-1.5">No Profiles Found</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mb-5">
                We couldn't find any profiles matching your filters. Try broadening your search.
              </p>
              <button onClick={() => { setFilters({}); setAppliedFilters({}); setKeyword(""); setAppliedKeyword(""); }} className="px-5 py-2 text-sm bg-brand-50 text-brand-700 font-bold rounded-xl hover:bg-brand-100 transition-colors">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {profiles.map((p) => {
                const isSent = interests.sent.includes(p.id);
                const isMutual = interests.mutual.includes(p.id);
                const isReceived = interests.received.includes(p.id);
                const isVerified = p.kyc_status === "VERIFIED" || (p as any).is_verified === true;
                const isMale = (p.gender || "").toLowerCase() === "male";
                const canViewPhoto = isVerified && (isMutual || isMale);
                const shouldBlurPhoto = !isVerified || !canViewPhoto || (p.isBlurred && !isMale);
                
                // Format full name without asterisks
                const displayName = `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.name || "Member";
                
                // Calculate age and height display strings
                const computedAgeVal = (p.age && p.age > 0) ? p.age : calculateAge(p.dob || p.dateOfBirth);
                const ageLabel = computedAgeVal > 0 ? `${computedAgeVal} Yrs` : "Age N/A";
                const heightLabel = p.height ? ` • ${String(p.height).includes("cm") ? p.height : `${p.height} cm`}` : "";

                return (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedProfile(p)}
                    className="group relative h-[420px] rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col justify-end"
                  >
                    {/* Image Background */}
                    {p.img ? (
                      <img 
                        src={p.img} 
                        alt={displayName} 
                        className={`absolute inset-0 w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-700 z-0 ${shouldBlurPhoto ? "blur-md scale-110 opacity-80 select-none" : ""}`} 
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#026d77]/10 via-[#026d77]/20 to-[#026d77]/35 flex flex-col items-center justify-center p-6 text-center z-0">
                        <img src="/logoMain-01.svg" alt="MN Logo" className="w-20 h-20 object-contain opacity-55 mb-2" />
                        <span className="text-[10px] font-bold text-[#026d77]/70 uppercase tracking-widest">Malappuram Nikah</span>
                      </div>
                    )}

                    {/* Premium Label */}
                    {p.is_premium && (
                      <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm z-20">
                        Premium
                      </div>
                    )}

                    {/* Lock Blur Overlay */}
                    {shouldBlurPhoto && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/10 backdrop-blur-[2px] z-10">
                        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-800 shadow-lg flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Connect mutually to view photo</span>
                        </div>
                      </div>
                    )}

                    {/* Verified Label */}
                    {p.kyc_status === "VERIFIED" && (
                      <div className={`absolute ${p.is_premium ? 'top-[42px]' : 'top-3'} left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1 z-20`}>
                        <Check className="w-3 h-3" /> Verified
                      </div>
                    )}

                    {/* Compare Checkbox */}
                    <label 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-3 right-3 flex items-center justify-center cursor-pointer z-20"
                      title="Select for comparison"
                    >
                      <input 
                        type="checkbox" 
                        checked={isCompared(p.id)} 
                        onChange={(e) => {
                          if (e.target.checked) addToCompare(p.id);
                          else removeFromCompare(p.id);
                        }}
                        className="peer sr-only"
                      />
                      <div className="w-6 h-6 bg-black/30 backdrop-blur-sm border-2 border-white/80 rounded flex items-center justify-center peer-checked:bg-brand-600 peer-checked:border-brand-600 transition-all shadow-md">
                        <Check className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </label>

                    {/* Bottom Gradient Shadow Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent z-10 pointer-events-none" />

                    {/* Content & Action Button */}
                    <div className="relative z-20 p-4 w-full text-white flex flex-col gap-2.5">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          {displayName}
                          {p.is_online && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Online now" />}
                        </h3>
                        <p className="text-xs text-gray-200 mt-0.5">{ageLabel}{heightLabel}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[11px] text-gray-300 flex-1">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-medium text-[10px]">Education</span>
                          <span className="font-semibold text-white truncate">{p.education || "Not specified"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-medium text-[10px]">Profession</span>
                          <span className="font-semibold text-white truncate">{p.profession || "Not specified"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-medium text-[10px]">Community</span>
                          <span className="font-semibold text-white truncate">{p.caste || "Not specified"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-medium text-[10px]">Location</span>
                          <span className="font-semibold text-white truncate">{p.location || "Not specified"}</span>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleToggleInterest(p.id); 
                        }}
                        disabled={isSent || isMutual}
                        className={`w-full py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md ${
                          isMutual ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500' :
                          isSent ? 'bg-white/10 text-white/50 border border-white/5 cursor-not-allowed' :
                          'bg-[#026d77] hover:bg-[#03828e] text-white border border-transparent'
                        }`}
                      >
                        {isMutual ? <><Check className="w-4 h-4" /> Mutual Match</> : 
                         isSent ? <><Check className="w-4 h-4" /> Interest Sent</> : 
                         'Send Interest'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Skeleton Loaders while loading next page */}
          {loadingMore && (
            <div className="mt-6">
              <CardGridSkeleton count={4} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" />
            </div>
          )}

          {/* Infinite Scroll Intersection Observer Sentinel */}
          <div ref={sentinelRef} className="h-6 w-full my-2 flex items-center justify-center pointer-events-none" />

          {/* Manual Load More Button Fallback */}
          {hasNext && !loadingMore && (
            <div className="flex justify-center mt-4 mb-4">
              <button 
                onClick={loadNextPage}
                disabled={loadingMore}
                className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              >
                Load More Profiles
              </button>
            </div>
          )}

        </div>
      </div>

      <VerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        kycStatus={currentUser?.kyc_status}
      />

      <AnimatePresence>
        {selectedProfile && (
          <ProfileSlideOver
            key={selectedProfile.id}
            profile={selectedProfile}
            onClose={() => setSelectedProfile(null)}
            interests={interests}
            onToggleInterest={handleToggleInterest}
          />
        )}
      </AnimatePresence>
    </>
  );
}
