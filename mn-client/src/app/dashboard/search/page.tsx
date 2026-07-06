"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Loader2, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCompare } from "@/context/CompareContext";
import { useUser } from "@/context/UserContext";
import { getEnrichedProfile } from "@/lib/profile-utils";

import ProfileSlideOver from "@/components/dashboard/ProfileSlideOver";
import { CardListSkeleton } from "@/components/dashboard/Skeleton";
import FilterSidebar from "@/components/search/FilterSidebar";

export default function SearchPage() {
  const router = useRouter();
  const { alertMsg: globalAlert, setAlertMsg: setGlobalAlert } = useCompare();
  const { currentUser } = useUser();
  const [mounted, setMounted] = useState(false);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState<any>({});
  const [keyword, setKeyword] = useState("");
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
      } catch(e) {}
    }
  }, [currentUser]);

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
      console.error(e);
    }
  };

  const fetchProfiles = useCallback(async (isLoadMore = false) => {
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
      params.append("page", String(isLoadMore ? page + 1 : 1));
      params.append("limit", "12");
      if (keyword) params.append("keyword", keyword);

      // Append all filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            if (value.length > 0) params.append(key, value.join(","));
          } else {
            params.append(key, String(value));
          }
        }
      });

      const res = await fetch(`http://localhost:3333/search/profiles?${params.toString()}`, {
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
          };
        });

        if (isLoadMore) {
          setProfiles(prev => [...prev, ...mapped]);
          setPage(prev => prev + 1);
        } else {
          setProfiles(mapped);
          setPage(1);
        }
        
        setTotalProfiles(data.pagination.total);
        setHasNext(data.pagination.hasNext);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, keyword, page, interests.sent.length]);

  // Save Preferences to API
  const savePreferences = async (newFilters: any) => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) return;
      await fetch("http://localhost:3333/search/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${storedToken}` },
        body: JSON.stringify({ preferences: newFilters })
      });
    } catch (e) {
      console.error("Failed to save preferences", e);
    }
  };

  useEffect(() => {
    // Debounce initial load slightly to allow filters to be set from currentUser
    const t = setTimeout(() => {
      fetchProfiles();
    }, 100);
    return () => clearTimeout(t);
  }, [fetchProfiles]); // Fetch automatically runs on filter change due to dependency

  const handleApplyFilters = () => {
    savePreferences(filters);
    fetchProfiles();
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchProfiles();
    }
  };

  const handleToggleInterest = async (receiverId: number) => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) return;
      const res = await fetch("http://localhost:3333/user/interest", {
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

  const activeFiltersCount = Object.keys(filters).filter(k => {
    const v = filters[k];
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                placeholder="Search by name, profession, or location..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center ml-1">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 items-center px-1">
              <span className="text-xs font-semibold text-gray-500">Active Filters:</span>
              {Object.entries(filters).map(([k, v]) => {
                if (v === undefined || v === null || v === "" || v === false) return null;
                if (Array.isArray(v) && v.length === 0) return null;
                const label = Array.isArray(v) ? v.join(", ") : String(v);
                return (
                  <div key={k} className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-100 text-brand-700 rounded-full text-xs font-medium">
                    <span className="capitalize">{k}:</span>
                    <span className="text-gray-900 truncate max-w-[150px]">{label}</span>
                    <button onClick={() => {
                      const newF = { ...filters }; delete newF[k];
                      setFilters(newF);
                      savePreferences(newF);
                      setTimeout(() => fetchProfiles(), 50);
                    }} className="ml-1 hover:text-brand-900"><X className="w-3 h-3" /></button>
                  </div>
                );
              })}
              <button onClick={() => { setFilters({}); savePreferences({}); setTimeout(() => fetchProfiles(), 50); }} className="text-xs font-semibold text-red-500 hover:text-red-600 ml-2">
                Clear All
              </button>
            </div>
          )}

          {/* Results Grid */}
          {loading ? (
            <CardListSkeleton />
          ) : profiles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 font-playfair mb-1.5">No Profiles Found</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mb-5">
                We couldn't find any profiles matching your filters. Try broadening your search.
              </p>
              <button onClick={() => { setFilters({}); setKeyword(""); setTimeout(() => fetchProfiles(), 50); }} className="px-5 py-2 text-sm bg-brand-50 text-brand-700 font-bold rounded-xl hover:bg-brand-100 transition-colors">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {profiles.map((p) => {
                const isSent = interests.sent.includes(p.id);
                const isMutual = interests.mutual.includes(p.id);
                return (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedProfile(p)}
                    className="group bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-56 bg-gray-100 overflow-hidden">
                      <img src={p.img || "/placeholder.jpg"} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      {p.is_premium && (
                        <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                          Premium
                        </div>
                      )}
                      {p.kyc_status === "VERIFIED" && (
                        <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                          <Check className="w-3 h-3" /> Verified
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          {p.name}
                          {p.is_online && <span className="w-2.5 h-2.5 bg-green-500 rounded-full" title="Online now" />}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">{p.age} Yrs • {p.height} cm</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-gray-600 mb-6 flex-1">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-medium">Education</span>
                          <span className="font-semibold text-gray-800 truncate">{p.education || "Not specified"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-medium">Profession</span>
                          <span className="font-semibold text-gray-800 truncate">{p.profession || "Not specified"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-medium">Community</span>
                          <span className="font-semibold text-gray-800 truncate">{p.caste || "Not specified"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-medium">Location</span>
                          <span className="font-semibold text-gray-800 truncate">{p.location || "Not specified"}</span>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleInterest(p.id); }}
                        disabled={isSent || isMutual}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          isMutual ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          isSent ? 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed' :
                          'bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white border border-brand-100 hover:border-brand-600'
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

          {/* Load More */}
          {hasNext && (
            <div className="flex justify-center mt-8 mb-4">
              <button 
                onClick={() => fetchProfiles(true)}
                disabled={loadingMore}
                className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm"
              >
                {loadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : 'Load More Profiles'}
              </button>
            </div>
          )}

        </div>
      </div>

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
    </>
  );
}
