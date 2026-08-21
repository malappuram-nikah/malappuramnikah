"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, Lock, Unlock, Loader2 } from "lucide-react";
import { RangeSlider, MultiSelect, FilterToggle } from "./FilterControls";

import { LOCATIONS } from "@/lib/constants";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (f: any) => void;
  onApply: () => void;
  totalProfiles: number;
  loading: boolean;
  isUserPremium: boolean;
}

export default function FilterSidebar({
  isOpen, onClose, filters, setFilters, onApply, totalProfiles, loading, isUserPremium
}: FilterSidebarProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "premium">("basic");

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handleApply = () => {
    onApply();
    if (window.innerWidth < 1024) onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  const updateFilter = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const sidebarContent = (
    <div className="flex-1 flex flex-col min-h-0 bg-white text-gray-900">

      {/* Tabs */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab("basic")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "basic" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Basic Filters
          </button>
          <button 
            onClick={() => setActiveTab("premium")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === "premium" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {isUserPremium ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            Premium
          </button>
        </div>
      </div>

      {/* Scrollable Filters */}
      <div className="flex-1 overflow-y-auto px-4 py-3 hide-scrollbar">
        {activeTab === "basic" ? (
          <div className="flex flex-col gap-4">
            <FilterToggle title="Verified Profiles Only" checked={!!filters.verified} onChange={v => updateFilter("verified", v)} />
            <FilterToggle title="Has Profile Photo" checked={!!filters.photo} onChange={v => updateFilter("photo", v)} />
            <FilterToggle title="Recent Login (Last 7 Days)" checked={!!filters.recentLogin} onChange={v => updateFilter("recentLogin", v)} />
            <FilterToggle title="Recently Joined (Last 7 Days)" checked={!!filters.recentRegistration} onChange={v => updateFilter("recentRegistration", v)} />
            <FilterToggle title="Don't Show Viewed Profiles" checked={!!filters.hideViewed} onChange={v => updateFilter("hideViewed", v)} />
            <FilterToggle title="Don't Show Interested Profiles" checked={!!filters.hideInterested} onChange={v => updateFilter("hideInterested", v)} />
            
            <RangeSlider 
              title="Age Range" 
              min={18} max={80} 
              value={[filters.ageMin || 18, filters.ageMax || 40]} 
              onChange={v => { updateFilter("ageMin", v[0]); updateFilter("ageMax", v[1]); }} 
            />
            
            <RangeSlider 
              title="Height Range (cm)" 
              min={120} max={220} 
              value={[filters.heightMin || 140, filters.heightMax || 190]} 
              onChange={v => { updateFilter("heightMin", v[0]); updateFilter("heightMax", v[1]); }} 
            />

            <MultiSelect 
              title="Marital Status" placeholder="Any Marital Status"
              options={["Never Married", "Divorced", "Nikah Divorce", "Widowed", "Awaiting Divorce"]}
              selected={filters.maritalStatus || []} onChange={v => updateFilter("maritalStatus", v)}
            />

            <MultiSelect 
              title="Community" placeholder="Any Community"
              options={["Sunni", "Mujahid", "Jamaat-e-Islami", "Tablighi Jamaat", "Shia", "Other Muslim"]}
              selected={filters.community || []} onChange={v => updateFilter("community", v)}
            />



            <MultiSelect 
              title="Location" placeholder="Select Location"
              options={LOCATIONS}
              selected={filters.location || filters.district || []} 
              onChange={v => { 
                updateFilter("location", v); 
                updateFilter("district", v); 
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {!isUserPremium && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h3 className="font-bold text-amber-800 text-sm mb-1">Premium Feature</h3>
                <p className="text-amber-700 text-xs mb-3">Upgrade to premium to access advanced matchmaking filters and find your perfect match faster.</p>
                <button className="w-full bg-amber-500 text-white font-bold text-xs py-2 rounded-lg hover:bg-amber-600 transition-colors">
                  Upgrade Now
                </button>
              </div>
            )}
            
            <MultiSelect 
              isPremium isUserPremium={isUserPremium}
              title="Education" placeholder="Any Education"
              options={["High School", "Diploma", "Bachelor's", "Master's", "Doctorate"]}
              selected={filters.education || []} onChange={v => updateFilter("education", v)}
            />

            <MultiSelect 
              isPremium isUserPremium={isUserPremium}
              title="Profession" placeholder="Any Profession"
              options={["Software Engineer", "Doctor", "Teacher", "Business", "Government", "Other"]}
              selected={filters.profession || []} onChange={v => updateFilter("profession", v)}
            />

            <MultiSelect 
              isPremium isUserPremium={isUserPremium}
              title="Profession Type" placeholder="Any Type"
              options={["Private Company", "Government / Public Sector", "Defense / Civil Services", "Business / Self Employed", "Not Working"]}
              selected={filters.professionType || []} onChange={v => updateFilter("professionType", v)}
            />

            <MultiSelect 
              isPremium isUserPremium={isUserPremium}
              title="Financial Status" placeholder="Any Status"
              options={["Middle Class", "Upper Middle Class", "Rich", "Affluent"]}
              selected={filters.financialStatus || []} onChange={v => updateFilter("financialStatus", v)}
            />

            <MultiSelect 
              isPremium isUserPremium={isUserPremium}
              title="Body Type" placeholder="Any Body Type"
              options={["Slim", "Athletic", "Average", "Heavy"]}
              selected={filters.bodyType || []} onChange={v => updateFilter("bodyType", v)}
            />

            <MultiSelect 
              isPremium isUserPremium={isUserPremium}
              title="Ethnicity" placeholder="Any Ethnicity"
              options={["Indian", "Middle Eastern", "African", "Caucasian", "Asian", "Other"]}
              selected={filters.ethnicity || []} onChange={v => updateFilter("ethnicity", v)}
            />

            <MultiSelect 
              isPremium isUserPremium={isUserPremium}
              title="Eating Habits" placeholder="Any Eating Habit"
              options={["Vegetarian", "Non-Vegetarian", "Eggetarian"]}
              selected={filters.eatingHabits || []} onChange={v => updateFilter("eatingHabits", v)}
            />

            <MultiSelect 
              isPremium isUserPremium={isUserPremium}
              title="Drinking Habits" placeholder="Any Drinking Habit"
              options={["No", "Yes", "Occasionally"]}
              selected={filters.drinkingHabits || []} onChange={v => updateFilter("drinkingHabits", v)}
            />

            <MultiSelect 
              isPremium isUserPremium={isUserPremium}
              title="Religiousness" placeholder="Any Religiousness"
              options={["Very Religious", "Religious", "Not Religious"]}
              selected={filters.religiousness || []} onChange={v => updateFilter("religiousness", v)}
            />

            <div className={`flex flex-col gap-2 ${!isUserPremium && 'opacity-50 pointer-events-none'}`}>
              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                Prayer Preference
                <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Premium</span>
              </span>
              <select 
                value={filters.prayer || ""} 
                onChange={e => updateFilter("prayer", e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              >
                <option value="">Any</option>
                <option value="Five Times Daily">Five Times Daily</option>
                <option value="Occasionally">Occasionally</option>
                <option value="Never">Never</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
        <div className="flex gap-2">
          <button 
            onClick={handleClear}
            className="flex-1 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button 
            onClick={handleApply}
            className="flex-1 py-1.5 text-xs font-semibold text-white bg-brand-600 rounded-md hover:bg-brand-700 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply Filters"}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-500 font-medium">
          Showing {totalProfiles} matching profiles
        </p>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-40 transition-opacity"
          />

          {/* Desktop & Tablet Slide-Over Drawer */}
          <motion.div
            initial={{ x: "-100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col border-r border-gray-200"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-150 bg-gray-50/80">
              <h2 className="text-lg font-bold font-playfair flex items-center gap-2 text-gray-900">
                <Filter className="w-5 h-5 text-brand-600" />
                Filter Matrimonial Profiles
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-all active:scale-95 cursor-pointer"
                title="Close Filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sidebarContent}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
