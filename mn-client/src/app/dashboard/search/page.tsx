"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Heart, MessageCircle, TrendingUp, Loader2, Lock, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
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
    const fetchProfiles = async () => {
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

          // Filter out the logged-in user from the list
          const otherUsers = data.users.filter((u: any) => u.id !== loggedInId);

          const mapped = otherUsers.map((u: any, i: number) => {
            // Resolve avatar photo from profile details JSON
            let avatar = `https://i.pravatar.cc/200?img=${40 + (i % 20)}`;
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
              caste: u.cast || "Unknown",
              match: 80 + Math.floor(Math.random() * 15)
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
            <input type="text" placeholder="City or Country" value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50" />
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

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:shadow-brand-900/5 hover:border-brand-100 transition-all duration-300 group flex"
              >
                <div className="w-28 shrink-0 overflow-hidden bg-gray-100 relative">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {isMutual && (
                    <div className="absolute top-2 left-2 bg-pink-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      Match
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{p.name}</p>
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
    </div>
  );
}
