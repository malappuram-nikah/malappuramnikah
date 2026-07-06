"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, Lock, Unlock, Loader2 } from "lucide-react";
import { RangeSlider, MultiSelect, FilterToggle } from "./FilterControls";

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
    <div className="flex flex-col h-full bg-white text-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-base font-bold font-playfair flex items-center gap-2">
          <Filter className="w-5 h-5 text-brand-600" />
          Filter Profiles
        </h2>
        <button onClick={onClose} className="p-2 lg:hidden rounded-full hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab("basic")}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "basic" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Basic Filters
          </button>
          <button 
            onClick={() => setActiveTab("premium")}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === "premium" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
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
            
            <RangeSlider 
              title="Age Range" 
              min={18} max={80} 
              value={[filters.ageMin || 18, filters.ageMax || 40]} 
              onChange={v => { updateFilter("ageMin", v[0]); updateFilter("ageMax", v[1]); }} 
            />
            
            <RangeSlider 
              title="Height (cm)" 
              min={120} max={220} 
              value={[filters.heightMin || 140, filters.heightMax || 190]} 
              onChange={v => { updateFilter("heightMin", v[0]); updateFilter("heightMax", v[1]); }} 
            />

            <MultiSelect 
              title="Marital Status" placeholder="Any Marital Status"
              options={["Single", "Divorced", "Widowed", "Awaiting Divorce"]}
              selected={filters.maritalStatus || []} onChange={v => updateFilter("maritalStatus", v)}
            />

            <MultiSelect 
              title="Community" placeholder="Any Community"
              options={["Sunni", "Mujahid", "Jamaat-e-Islami", "Tablighi Jamaat", "Other"]}
              selected={filters.community || []} onChange={v => updateFilter("community", v)}
            />

            <MultiSelect 
              title="Education" placeholder="Any Education"
              options={["High School", "Diploma", "Bachelor's", "Master's", "Doctorate"]}
              selected={filters.education || []} onChange={v => updateFilter("education", v)}
            />

            <MultiSelect 
              title="Profession" placeholder="Any Profession"
              options={["Software Engineer", "Doctor", "Teacher", "Business", "Government", "Other"]}
              selected={filters.profession || []} onChange={v => updateFilter("profession", v)}
            />

            <MultiSelect 
              title="District" placeholder="Any District"
              options={["Malappuram", "Kozhikode", "Kannur", "Wayanad", "Palakkad", "Ernakulam"]}
              selected={filters.district || []} onChange={v => updateFilter("district", v)}
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
              title="Family Status" placeholder="Any Status"
              options={["Middle Class", "Upper Middle Class", "Rich", "Affluent"]}
              selected={filters.familyStatus || []} onChange={v => updateFilter("familyStatus", v)}
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
            className="flex-1 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button 
            onClick={handleApply}
            className="flex-1 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-sm flex items-center justify-center gap-1.5"
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
    <>
      {/* Mobile Overlay & Bottom Sheet */}
      <div className="lg:hidden">
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-x-0 bottom-0 z-50 h-[85vh] bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="w-full flex justify-center pt-3 pb-1">
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                </div>
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block w-72 shrink-0 sticky top-24 h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-200/50 bg-white">
        {sidebarContent}
      </div>
    </>
  );
}
