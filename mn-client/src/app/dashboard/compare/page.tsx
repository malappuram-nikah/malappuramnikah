"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useCompare } from "@/context/CompareContext";
import { useUser } from "@/context/UserContext";
import { getEnrichedProfile, analyzeMatch } from "@/lib/profile-utils";
import { 
  X, Layers, Heart, MessageCircle, Star, User, BookOpen, 
  Briefcase, Users, HeartHandshake, MapPin, Sparkles, Check, 
  Trash2, Share2, Printer, Plus, ChevronRight, Lock, Unlock,
  TrendingUp, Award, Smile, ShieldCheck, ArrowRight, Info
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CompareTableSkeleton } from "@/components/dashboard/Skeleton";

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="py-32 flex flex-col items-center justify-center text-gray-400">
        <LoaderSpinner />
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { compareIds, addToCompare, removeFromCompare, clearCompare } = useCompare();
  const { currentUser } = useUser();

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [comparedProfiles, setComparedProfiles] = useState<any[]>([]);
  const [myPreferences, setMyPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [favIds, setFavIds] = useState<number[]>([]);
  const [interests, setInterests] = useState<number[]>([]);

  // Load URL parameter comparison IDs if present
  useEffect(() => {
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const parsed = idsParam.split(",").map(Number).filter(n => !isNaN(n));
      parsed.forEach(id => addToCompare(id));
    }
  }, [searchParams]);

  // Load user data & matching values
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("mn_token");
        
        // Fetch favorites
        const storedFavs = localStorage.getItem("mn_fav_ids");
        if (storedFavs) setFavIds(JSON.parse(storedFavs));

        // Fetch Interests
        if (token) {
          try {
            const res = await fetch("http://localhost:3333/user/interest", {
              headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
              setInterests(data.sent.map((u: any) => u.id));
            }
          } catch (e) {
            console.error("Interest fetch failed", e);
          }
        }

        // Fetch user profiles
        const res = await fetch("http://localhost:3333/user/profiles", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && data.users) {
          setAllUsers(data.users);
          
          // Identify current user preferences
          if (currentUser) {
            if (currentUser.profile_details?.mn_partner_preferences_draft) {
              setMyPreferences(currentUser.profile_details.mn_partner_preferences_draft);
            } else {
              const localPref = localStorage.getItem("mn_partner_preferences_draft");
              if (localPref) setMyPreferences(JSON.parse(localPref));
            }
          } else {
            const localPref = localStorage.getItem("mn_partner_preferences_draft");
            if (localPref) setMyPreferences(JSON.parse(localPref));
          }
        }
      } catch (e) {
        console.error("Failed to load profiles", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  // Assemble compared profiles lists
  useEffect(() => {
    if (allUsers.length > 0) {
      const enriched = allUsers
        .filter(u => compareIds.includes(u.id))
        .map(u => {
          const profile = getEnrichedProfile(u);
          const matchResult = analyzeMatch(profile, myPreferences);
          return {
            ...profile,
            matchResult
          };
        });
      
      // Sort enriched profiles by search selection order
      const sorted = compareIds.map(id => enriched.find(p => p?.id === id)).filter(Boolean);
      setComparedProfiles(sorted);
    }
  }, [allUsers, compareIds, myPreferences]);

  const handleToggleFavorite = (id: number) => {
    let updated = [];
    if (favIds.includes(id)) {
      updated = favIds.filter(x => x !== id);
      setAlertMsg("Removed from Favorites.");
    } else {
      updated = [...favIds, id];
      setAlertMsg("Added to Favorites.");
    }
    setFavIds(updated);
    localStorage.setItem("mn_fav_ids", JSON.stringify(updated));
  };

  const handleToggleInterest = async (id: number, name: string) => {
    try {
      const token = localStorage.getItem("mn_token");
      if (!token) {
        setAlertMsg("Please log in to express interest.");
        return;
      }
      const res = await fetch("http://localhost:3333/user/interest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ receiver_id: id })
      });
      const data = await res.json();
      if (data.success) {
        if (data.status === "PENDING") {
          setInterests(prev => [...prev, id]);
          setAlertMsg(`Interest expressed for ${name}!`);
        } else {
          setInterests(prev => prev.filter(x => x !== id));
          setAlertMsg(`Withdrew interest for ${name}.`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    if (compareIds.length === 0) return;
    const shareUrl = `${window.location.origin}/dashboard/compare?ids=${compareIds.join(",")}`;
    navigator.clipboard.writeText(shareUrl);
    setAlertMsg("Comparison link copied to clipboard!");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <CompareTableSkeleton />;
  }

  // Find the index of the profile with the highest compatibility score
  const highestScoreIdx = comparedProfiles.length > 0
    ? comparedProfiles.reduce(
        (maxIdx, p, idx, arr) => {
          const currentScore = p?.matchResult?.score ?? 0;
          const maxScore = arr[maxIdx]?.matchResult?.score ?? 0;
          return currentScore > maxScore ? idx : maxIdx;
        },
        0
      )
    : 0;

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Print override styling to ensure all pages are printable */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide sidebar, header, navigation, toast notifications and floating bars */
          aside,
          header,
          nav,
          footer,
          .print\\:hidden,
          [class*="DashboardSidebar"],
          [class*="DashboardHeader"],
          [class*="CompareFloatingBar"] {
            display: none !important;
          }
          
          /* Reset wrapper layout elements for natural print page flow */
          div.flex.h-screen.bg-gray-50.overflow-hidden,
          div.flex-1.flex.flex-col.overflow-hidden,
          main.flex-1.overflow-y-auto {
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            position: static !important;
          }
          
          html, body {
            height: auto !important;
            overflow: visible !important;
            background-color: white !important;
          }
          
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Expand comparison container to print on physical pages */
          .container {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Prevent breaks inside comparative rows */
          .grid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />
      {/* Toast Alert Banner */}
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

      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-playfair text-gray-900 flex items-center gap-2">
            <Layers className="w-7 h-7 text-brand-600" />
            Profile Comparison
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Compare important profile parameters, compatibility analyses, and preference matching details side-by-side.
          </p>
        </div>

        {compareIds.length > 0 && (
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-250 hover:bg-gray-50 bg-white rounded-xl text-xs font-semibold text-gray-700 transition-all shadow-sm"
              title="Share comparison link"
            >
              <Share2 className="w-4 h-4 text-gray-500" /> Share
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-250 hover:bg-gray-50 bg-white rounded-xl text-xs font-semibold text-gray-700 transition-all shadow-sm"
              title="Print / Save PDF"
            >
              <Printer className="w-4 h-4 text-gray-500" /> Print PDF
            </button>
            <button
              onClick={clearCompare}
              className="flex items-center gap-1.5 px-4 py-2 border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600 transition-all bg-white rounded-xl shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>
        )}
      </div>

      {compareIds.length === 0 ? (
        <EmptyState allUsers={allUsers} addToCompare={addToCompare} />
      ) : (
        <div className="bg-white border border-gray-150 rounded-xl overflow-visible shadow-md">
          {/* Main Side-by-Side Scrolling Grid */}
          <div className="overflow-x-auto md:overflow-visible print:overflow-visible">
            <div className="min-w-[800px] md:w-full table-fixed">
              {/* Sticky Comparison Header */}
              <div className="grid grid-cols-4 bg-gray-50/90 border-b border-gray-150 py-6 px-4 items-stretch sticky top-0 z-20 shadow-sm backdrop-blur-md rounded-t-xl">
                <div className="col-span-1 flex flex-col justify-center pr-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Comparing</span>
                  <span className="text-2xl font-black font-playfair text-gray-900 mt-1">{comparedProfiles.length} Profiles</span>
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">Green cards show parameters matching your preferred partner draft settings.</p>
                </div>

                {comparedProfiles.map((p, idx) => {
                  const isHighest = idx === highestScoreIdx && comparedProfiles.length > 1;
                  return (
                    <div
                      key={p.id}
                      className={`col-span-1 px-4 relative flex flex-col justify-between transition-all duration-300 ${
                        isHighest ? "bg-brand-50/20 border-x border-brand-100/60 rounded-2xl shadow-inner" : ""
                      }`}
                    >
                      {isHighest && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" /> Best Match
                        </div>
                      )}

                      <button
                        onClick={() => removeFromCompare(p.id)}
                        className="absolute top-0 right-2 p-1.5 bg-white border border-gray-100 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 transition-colors shadow-sm print:hidden z-10"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex gap-3 items-center">
                        {p.photo ? (
                          <img
                            src={p.photo}
                            alt={p.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md bg-gray-100 hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-brand-50 border-2 border-white shadow-md flex items-center justify-center text-brand-700 font-extrabold text-sm uppercase">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold text-brand-600 block tracking-wider">{p.profileId}</span>
                          <span className="font-extrabold text-sm text-gray-950 truncate block mt-0.5">{p.name}</span>
                          <span className="text-xs text-gray-500 block font-medium">{p.age} yrs · {p.location}</span>
                        </div>
                      </div>

                      {/* Matching Percentage Circular SVG Indicator */}
                      <div className="mt-4 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Compatibility</span>
                          <span className={`text-[10px] font-black uppercase block mt-0.5 truncate ${
                            p.matchResult.score >= 85 ? "text-emerald-600" :
                            p.matchResult.score >= 70 ? "text-brand-600" :
                            p.matchResult.score >= 55 ? "text-amber-600" : "text-rose-500"
                          }`}>
                            {p.matchResult.indicator}
                          </span>
                        </div>
                        
                        <div className="relative flex items-center justify-center w-11 h-11 shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-gray-100"
                              strokeWidth="3.5"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className={`${
                                p.matchResult.score >= 85 ? "text-emerald-500" :
                                p.matchResult.score >= 70 ? "text-brand-500" :
                                p.matchResult.score >= 55 ? "text-amber-400" : "text-rose-400"
                              } transition-all duration-1000`}
                              strokeWidth="3.5"
                              strokeDasharray={`${p.matchResult.score}, 100`}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute text-[10px] font-black text-gray-800">
                            {p.matchResult.score}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty column placeholder if less than 3 profiles compared */}
                {Array.from({ length: 3 - comparedProfiles.length }).map((_, i) => (
                  <div key={i} className="col-span-1 px-4 flex flex-col items-center justify-center border-l border-dashed border-gray-200">
                    <CompareSearchSelector allUsers={allUsers} compareIds={compareIds} addToCompare={addToCompare} />
                  </div>
                ))}
              </div>

              {/* SECTION 1: BASIC DETAILS */}
              <div className="border-b border-gray-150">
                <SectionHeader icon={<User className="w-3.5 h-3.5" />} title="Basic Details" />
                
                <GridRow
                  label="Age"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => `${p.age} Yrs`}
                  getStatus={p => p.matchResult.fields.age}
                />
                
                <GridRow
                  label="Height"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.height}
                />

                <GridRow
                  label="Marital Status"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.maritalStatus}
                  getStatus={p => p.matchResult.fields.maritalStatus}
                />

                <GridRow
                  label="Mother Tongue"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.motherTongue}
                />

                <GridRow
                  label="Physical Status"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.physicalStatus}
                />

                <GridRow
                  label="Appearance"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.appearance}
                />

                <GridRow
                  label="Weight"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.weight}
                />

                <GridRow
                  label="Languages Spoken"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.languagesSpoken}
                />

                <GridRow
                  label="Present Location"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.presentLocation || p.location}
                />

                <GridRow
                  label="Marriage Goal Plan"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.marriageGoalPlan}
                />

                <GridRow
                  label="Willing to Relocate"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.relocateForPartner}
                />
              </div>

              {/* SECTION 2: RELIGIOUS DETAILS */}
              <div className="border-b border-gray-150">
                <SectionHeader icon={<Award className="w-3.5 h-3.5" />} title="Religious Info" />
                
                <GridRow
                  label="Religion"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.religion}
                  getStatus={p => p.matchResult.fields.religion}
                />

                <GridRow
                  label="Community / Caste"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.community}
                  getStatus={p => p.matchResult.fields.community}
                />

                <GridRow
                  label="Religiousness"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.religiousness}
                />

                <GridRow
                  label="Namaz Habits"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.namaz}
                  getStatus={p => p.matchResult.fields.namaz}
                />

                <GridRow
                  label="Quran Reading"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.quranReading}
                  getStatus={p => p.matchResult.fields.quranReading}
                />
              </div>

              {/* SECTION 3: PROFESSIONAL INFO */}
              <div className="border-b border-gray-150">
                <SectionHeader icon={<Briefcase className="w-3.5 h-3.5" />} title="Professional Info" />
                
                <GridRow
                  label="Education"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.education}
                  getStatus={p => p.matchResult.fields.education}
                />

                <GridRow
                  label="Institution"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.educationalInstitution}
                />

                <GridRow
                  label="Profession"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.profession}
                />

                <GridRow
                  label="Company Name"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.companyName}
                />

                <GridRow
                  label="Profession Type"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.professionType}
                />

                <GridRow
                  label="Annual Income"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.annualIncome}
                />
              </div>

              {/* SECTION 4: FAMILY & LIVING DETAILS */}
              <div className="border-b border-gray-150">
                <SectionHeader icon={<Users className="w-3.5 h-3.5" />} title="Family & Living Details" />

                <GridRow
                  label="Family Type"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.familyType}
                />

                <GridRow
                  label="Financial Status"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.financialStatus}
                />

                <GridRow
                  label="Family Values"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.familyValues}
                />

                <GridRow
                  label="Father Occupation"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.fatherOccupation}
                />

                <GridRow
                  label="Mother Occupation"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.motherOccupation}
                />

                <GridRow
                  label="Siblings count"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.siblingsCount}
                />
              </div>

              {/* SECTION 5: INTERESTS & PERSONALITY */}
              <div className="border-b border-gray-150">
                <SectionHeader icon={<Smile className="w-3.5 h-3.5" />} title="Interests & Personality" />

                <GridRow
                  label="Interests"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => (
                    <div className="flex flex-wrap gap-1">
                      {p.interestsList.map((interest: string) => (
                        <span key={interest} className="bg-gray-100/80 px-2 py-0.5 rounded text-[10px] text-gray-700 font-medium">
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                />

                <GridRow
                  label="About Personality"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => <span className="italic leading-relaxed text-gray-600 font-medium text-xs">"{p.personalityDescription}"</span>}
                />
              </div>

              {/* SECTION 6: HOBBIES & HABITS */}
              <div className="border-b border-gray-150">
                <SectionHeader icon={<ShieldCheck className="w-3.5 h-3.5" />} title="Hobbies & Habits" />

                <GridRow
                  label="Favourite Sports"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => Array.isArray(p.favouriteSports) ? p.favouriteSports.join(", ") : (p.favouriteSports || "")}
                />

                <GridRow
                  label="Favourite Places"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => Array.isArray(p.favouritePlaces) ? p.favouritePlaces.join(", ") : (p.favouritePlaces || "")}
                />

                <GridRow
                  label="Eating Habits"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.eatingHabits}
                />

                <GridRow
                  label="Smoking Habits"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.smokingHabits}
                />

                <GridRow
                  label="Drinking Habits"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.drinkingHabits}
                />
              </div>

              {/* SECTION 7: PARTNER PREFERENCES */}
              <div className="border-b border-gray-150">
                <SectionHeader icon={<HeartHandshake className="w-3.5 h-3.5" />} title="Partner Preferences" />

                <GridRow
                  label="Age Range"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.prefAge}
                />

                <GridRow
                  label="Height Range"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.prefHeight}
                />

                <GridRow
                  label="Marital Status"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.prefMaritalStatus}
                />

                <GridRow
                  label="Religion"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.prefReligion}
                />

                <GridRow
                  label="Community / Caste"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.prefCommunity}
                />

                <GridRow
                  label="Preferred Education"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.prefEducation}
                />

                <GridRow
                  label="Preferred Occ."
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.prefOccupation}
                />

                <GridRow
                  label="Preferred Loc."
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => p.prefLocations}
                />

                <GridRow
                  label="About Partner"
                  profiles={comparedProfiles}
                  highestScoreIdx={highestScoreIdx}
                  getValue={p => <span className="italic leading-relaxed text-gray-600 font-medium text-xs">"{p.aboutPartner}"</span>}
                />
              </div>

              {/* ACTION FOOTER ROW */}
              <div className="grid grid-cols-4 py-8 px-4 items-center bg-gray-50/50 print:hidden rounded-b-3xl">
                <div className="col-span-1 pr-4">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Quick Actions</span>
                  <span className="text-xs text-gray-500 block mt-1 leading-relaxed">Express interest or save profiles to connect later.</span>
                </div>

                {comparedProfiles.map(p => {
                  const isSent = interests.includes(p.id);
                  const isFav = favIds.includes(p.id);

                  return (
                    <div key={p.id} className="col-span-1 px-4 space-y-3">
                      <button
                        onClick={() => handleToggleInterest(p.id, p.name)}
                        className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                          isSent
                            ? "bg-pink-100 text-pink-700 hover:bg-pink-200"
                            : "bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98]"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSent ? "fill-current" : ""}`} />
                        {isSent ? "Interest Sent" : "Connect"}
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleFavorite(p.id)}
                          className={`flex-1 py-2 border rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                            isFav
                              ? "bg-amber-50 border-amber-300 text-amber-600"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                          {isFav ? "Saved" : "Save"}
                        </button>

                        <button
                          onClick={() => router.push("/dashboard/search")}
                          className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-xl transition-colors flex items-center justify-center gap-1"
                        >
                          <Info className="w-3.5 h-3.5" /> Profile
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Empty column placeholder */}
                {Array.from({ length: 3 - comparedProfiles.length }).map((_, i) => (
                  <div key={i} className="col-span-1 px-4" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Section Divider Header Component
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-white py-3 px-4 font-bold text-xs text-gray-800 uppercase tracking-widest flex items-center gap-2 border-b border-gray-150">
      <span className="p-1 bg-brand-50 text-brand-650 rounded-md shadow-sm border border-brand-100">{icon}</span> 
      {title}
    </div>
  );
}

// Grid Row component to preserve desktop/mobile structures
function GridRow({ 
  label, 
  profiles, 
  getValue, 
  getStatus, 
  highestScoreIdx 
}: { 
  label: string; 
  profiles: any[]; 
  getValue: (p: any) => React.ReactNode; 
  getStatus?: (p: any) => string; 
  highestScoreIdx: number; 
}) {
  return (
    <div className="grid grid-cols-4 border-b border-gray-100 hover:bg-gray-50/30 transition-colors items-stretch">
      <div className="col-span-1 py-3 px-4 text-xs font-bold text-gray-500 bg-gray-50/10 flex items-center border-r border-gray-100 select-none">
        {label}
      </div>
      
      {profiles.map((p, idx) => {
        const status = getStatus ? getStatus(p) : undefined;
        const isHighest = idx === highestScoreIdx && profiles.length > 1;
        
        let indicatorStyle = "text-gray-850 bg-transparent";
        let badgeIcon = null;

        if (status === "strong") {
          indicatorStyle = "text-emerald-950 bg-emerald-50/50 border border-emerald-100/60";
          badgeIcon = <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
        } else if (status === "mismatch") {
          indicatorStyle = "text-rose-950 bg-rose-50/50 border border-rose-100/60";
          badgeIcon = <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
        } else if (status === "acceptable") {
          indicatorStyle = "text-amber-950 bg-amber-50/30 border border-amber-100/60";
          badgeIcon = <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />;
        }

        return (
          <div
            key={p.id}
            className={`col-span-1 p-2 flex items-center border-r border-gray-100 transition-all ${
              isHighest ? "bg-brand-50/5" : ""
            }`}
          >
            <div className={`w-full flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:bg-gray-50/50 ${indicatorStyle}`}>
              {badgeIcon}
              <span className="truncate">{getValue(p)}</span>
            </div>
          </div>
        );
      })}

      {/* Render empty cells to ensure grid has exactly 4 columns */}
      {Array.from({ length: 3 - profiles.length }).map((_, i) => (
        <div key={i} className="col-span-1 bg-gray-50/5 border-r border-gray-100 flex items-center justify-center p-2 text-xs text-gray-300 italic select-none">
          -
        </div>
      ))}
    </div>
  );
}

// Spinner component
function LoaderSpinner() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="font-semibold text-sm text-gray-600">Structuring side-by-side attributes...</p>
    </div>
  );
}

// Compare Search Selector inside slots
function CompareSearchSelector({ 
  allUsers, 
  compareIds, 
  addToCompare 
}: { 
  allUsers: any[]; 
  compareIds: number[]; 
  addToCompare: (id: number) => void; 
}) {
  const [open, setOpen] = useState(false);
  const filterList = allUsers.filter(u => !compareIds.includes(u.id));

  return (
    <div className="relative w-full print:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-8 border border-dashed border-gray-250 hover:border-brand-350 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group bg-gradient-to-br from-gray-50/50 to-white hover:shadow-md hover:scale-[1.02] duration-300"
      >
        <div className="p-3 bg-white group-hover:bg-brand-50 rounded-full transition-colors border border-gray-100 shadow-sm group-hover:border-brand-200">
          <Plus className="w-5 h-5 text-gray-400 group-hover:text-brand-600" />
        </div>
        <span className="text-xs font-bold text-gray-400 group-hover:text-brand-700 tracking-wider uppercase">Add Match Profile</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto p-2">
          <div className="text-[10px] font-bold text-gray-400 uppercase px-3 py-1.5 tracking-wider">Select Profile</div>
          {filterList.length === 0 ? (
            <div className="text-xs text-gray-400 px-3 py-4 text-center">No other profiles available.</div>
          ) : (
            filterList.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  addToCompare(u.id);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-brand-50 rounded-xl flex items-center gap-2.5 transition-colors"
              >
                <img
                  src={u.profile_details?.mn_profile_photos_draft?.photos?.[0]?.dataUrl || `https://i.pravatar.cc/100?img=${45 + (u.id % 20)}`}
                  alt=""
                  className="w-8 h-8 rounded-lg object-cover bg-gray-100"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-gray-800 block truncate">{u.first_name} {u.last_name}</span>
                  <span className="text-[10px] text-gray-500 block">{u.dob ? Math.floor((new Date().getTime() - new Date(u.dob).getTime()) / 31557600000) : 25} yrs · {u.location || "Kerala"}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Empty state view
function EmptyState({ allUsers, addToCompare }: { allUsers: any[]; addToCompare: (id: number) => void }) {
  return (
    <div className="bg-white border border-gray-150 rounded-xl p-8 text-center max-w-xl mx-auto shadow-md space-y-6">
      <div className="w-16 h-16 bg-brand-50 text-brand-650 rounded-xl flex items-center justify-center mx-auto shadow-inner border border-brand-100">
        <Layers className="w-8 h-8" />
      </div>
      
      <div>
        <h2 className="text-xl font-bold text-gray-900 font-playfair">Compare Matches Side-by-Side</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          You haven't selected any profiles to compare yet. Click the compare icon (<Layers className="w-3.5 h-3.5 inline text-brand-600 mx-0.5" />) on search results, daily matches, or select profiles below to begin.
        </p>
      </div>

      {allUsers.length > 0 && (
        <div className="pt-4 border-t border-gray-100 text-left">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Available Profiles to Compare</h3>
          <div className="space-y-2.5">
            {allUsers.slice(0, 3).map(u => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 border border-gray-100 hover:border-brand-200 rounded-2xl hover:bg-brand-50/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.profile_details?.mn_profile_photos_draft?.photos?.[0]?.dataUrl || `https://i.pravatar.cc/100?img=${45 + (u.id % 20)}`}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover bg-gray-100"
                  />
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900">{u.first_name} {u.last_name}</h4>
                    <p className="text-[11px] text-gray-500">{u.dob ? Math.floor((new Date().getTime() - new Date(u.dob).getTime()) / 31557600000) : 25} yrs · {u.location || "Kerala"} · {u.cast || "Sunni"}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => addToCompare(u.id)}
                  className="px-3.5 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Compare
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center gap-3 pt-2">
        <button
          onClick={() => window.location.href = "/dashboard/search"}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
        >
          Search Profiles
        </button>
        <button
          onClick={() => window.location.href = "/dashboard/matches"}
          className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs rounded-xl transition-all"
        >
          View AI Matches
        </button>
      </div>
    </div>
  );
}
