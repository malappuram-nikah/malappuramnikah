"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Save } from "lucide-react";
import { LOCATIONS } from "@/lib/constants";

export interface PartnerPreferencesData {
  aboutPartner: string;
  minAge: string;
  maxAge: string;
  minHeight: string;
  maxHeight: string;
  maritalStatus: string;
  motherTongue: string;
  physicalStatus: string;
  appearance: string;
  haveChildren: string;
  religion: string;
  community: string;
  religiousness: string;
  education: string;
  occupation: string;
  employedIn: string;
  annualIncome: string;
  preferredLocations: string;
  eatingHabits: string;
  smokingHabits: string;
  drinkingHabits: string;
  prefNamaz?: string;
  prefQuranReading?: string;
}

interface PartnerPreferencesStepProps {
  initialData?: Partial<PartnerPreferencesData>;
  onComplete?: (data: PartnerPreferencesData) => void;
  onBack?: () => void;
}

const DRAFT_KEY = "mn_partner_preferences_draft";

export const showPartnerChildrenField = (status: string) => {
  if (!status) return true;
  const s = status.toLowerCase();
  if (["never married", "single", "unmarried"].includes(s)) {
    return false;
  }
  return true;
};

const KERALA_DISTRICTS = [
  "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod",
  "Kollam", "Kottayam", "Kozhikode", "Palakkad",
  "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
];

export default function PartnerPreferencesStep({ initialData, onComplete, onBack }: PartnerPreferencesStepProps) {
  const [formData, setFormData] = useState<PartnerPreferencesData>({
    aboutPartner: "",
    minAge: "18",
    maxAge: "35",
    minHeight: "5'0\"",
    maxHeight: "6'0\"",
    maritalStatus: "Any",
    motherTongue: "Any",
    physicalStatus: "Any",
    appearance: "Any",
    haveChildren: "No",
    religion: "Any",
    community: "Any",
    religiousness: "Any",
    education: "Any",
    occupation: "Any",
    employedIn: "Any",
    annualIncome: "Any",
    preferredLocations: "",
    eatingHabits: "Any",
    smokingHabits: "Any",
    drinkingHabits: "Any",
    prefNamaz: "Any",
    prefQuranReading: "Any",
    ...initialData,
  });

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PartnerPreferencesData, string>>>({});

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft && !initialData) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData(JSON.parse(draft));
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDraftLoaded(true);
  }, [initialData]);

  // Autosave
  const autosaveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isDraftLoaded) return;

    if (autosaveTimeout.current) {
      clearTimeout(autosaveTimeout.current);
    }

    autosaveTimeout.current = setTimeout(() => {
      setIsSaving(true);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000); // 1s debounce

    return () => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    };
  }, [formData, isDraftLoaded]);

  const updateForm = (key: keyof PartnerPreferencesData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof PartnerPreferencesData, string>> = {};
    if (!formData.aboutPartner.trim()) newErrors.aboutPartner = "Please write a few lines about your expectations";
    if (parseInt(formData.minAge) > parseInt(formData.maxAge)) {
      newErrors.minAge = "Min age cannot be greater than max age";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validate()) {
      if (onComplete) onComplete(formData);
      // Optional: Clear draft after successful completion
      // localStorage.removeItem(DRAFT_KEY);
    }
  };

  // Progress calculation
  const totalRequired = 5; // aboutPartner, minAge, maxAge, religion, maritalStatus
  const completedRequired = [
    formData.aboutPartner,
    formData.minAge,
    formData.maxAge,
    formData.religion,
    formData.maritalStatus,
  ].filter((v) => !!v).length;
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);

  if (!isDraftLoaded) return null; // Avoid hydration mismatch

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-gray-900">Partner Preferences</h2>
          <p className="text-sm text-gray-500 mt-1">Tell us what you are looking for in a life partner.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-brand-600 mb-1">{progressPercent}% Completed</span>
            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-brand-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-10">
        
        {/* About Partner */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">About Partner</h3>
          <div>
            <textarea
              rows={4}
              value={formData.aboutPartner}
              onChange={(e) => updateForm("aboutPartner", e.target.value)}
              placeholder="Write a few lines about the kind of partner you are looking for..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm resize-none"
            />
            {errors.aboutPartner && <p className="text-red-500 text-xs mt-1">{errors.aboutPartner}</p>}
          </div>
        </section>

        {/* Basic Details */}
        <section className="space-y-6 pt-6 border-t border-gray-50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Basic Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Age Range (Years)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.minAge}
                  onChange={(e) => updateForm("minAge", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                  min="18"
                />
                <span className="text-gray-500 text-sm">to</span>
                <input
                  type="number"
                  value={formData.maxAge}
                  onChange={(e) => updateForm("maxAge", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                  max="100"
                />
              </div>
              {errors.minAge && <p className="text-red-500 text-xs mt-1">{errors.minAge}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Height Range</label>
              <div className="flex items-center gap-2">
                <select
                  value={formData.minHeight}
                  onChange={(e) => updateForm("minHeight", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
                >
                  <option value="Any">Any</option>
                  <option value="4'10&quot;">4'10"</option>
                  <option value="5'0&quot;">5'0"</option>
                  <option value="5'5&quot;">5'5"</option>
                  <option value="6'0&quot;">6'0"</option>
                </select>
                <span className="text-gray-500 text-sm">to</span>
                <select
                  value={formData.maxHeight}
                  onChange={(e) => updateForm("maxHeight", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
                >
                  <option value="Any">Any</option>
                  <option value="5'0&quot;">5'0"</option>
                  <option value="5'5&quot;">5'5"</option>
                  <option value="6'0&quot;">6'0"</option>
                  <option value="6'5&quot;">6'5"</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Marital Status</label>
              <select
                value={formData.maritalStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  updateForm("maritalStatus", val);
                  if (!showPartnerChildrenField(val)) {
                    updateForm("haveChildren", "Any");
                  }
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                <option value="Never Married">Never Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Nikah Divorce">Nikah Divorce</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mother Tongue</label>
              <select
                value={formData.motherTongue}
                onChange={(e) => updateForm("motherTongue", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                <option value="Malayalam">Malayalam</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            {showPartnerChildrenField(formData.maritalStatus) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Have Children</label>
                <select
                  value={formData.haveChildren}
                  onChange={(e) => updateForm("haveChildren", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
                >
                  <option value="Any">Doesn't Matter</option>
                  <option value="No">No</option>
                  <option value="Yes, living together">Yes, living together</option>
                  <option value="Yes, not living together">Yes, not living together</option>
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Physical Status</label>
              <select
                value={formData.physicalStatus}
                onChange={(e) => updateForm("physicalStatus", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                <option value="Normal">Normal</option>
                <option value="Physically Challenged">Physically Challenged</option>
              </select>
            </div>
          </div>
        </section>

        {/* Religious Info */}
        <section className="space-y-6 pt-6 border-t border-gray-50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Religious Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Religion</label>
              <select
                value={formData.religion}
                onChange={(e) => updateForm("religion", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                <option value="Islam">Islam</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Community</label>
              <select
                value={formData.community}
                onChange={(e) => updateForm("community", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                <option value="Sunni">Sunni</option>
                <option value="Mujahid">Mujahid</option>
                <option value="Jamaat-e-Islami">Jamaat-e-Islami</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Religiousness</label>
              <select
                value={formData.religiousness}
                onChange={(e) => updateForm("religiousness", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                <option value="Very Religious">Very Religious</option>
                <option value="Religious">Religious</option>
                <option value="Moderately Religious">Moderately Religious</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Namaz Habits</label>
              <select
                value={formData.prefNamaz || "Any"}
                onChange={(e) => updateForm("prefNamaz", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                {["Five Times Daily", "Most Prayers", "Occasionally", "Rarely"].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Quran Reading</label>
              <select
                value={formData.prefQuranReading || "Any"}
                onChange={(e) => updateForm("prefQuranReading", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                {["Daily", "Weekly", "Occasionally", "Rarely"].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Professional Info */}
        <section className="space-y-6 pt-6 border-t border-gray-50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Professional Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Education</label>
              <select
                value={formData.education}
                onChange={(e) => updateForm("education", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                <option value="Higher Secondary">Higher Secondary</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelors">Bachelors and above</option>
                <option value="Masters">Masters and above</option>
                <option value="Doctorate">Doctorate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Occupation</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => updateForm("occupation", e.target.value)}
                placeholder="e.g. Any, IT, Medical, Government"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Employed In</label>
              <select
                value={formData.employedIn}
                onChange={(e) => updateForm("employedIn", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                <option value="Private Sector">Private Sector</option>
                <option value="Government Sector">Government Sector</option>
                <option value="Business">Business</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Income</label>
              <select
                value={formData.annualIncome}
                onChange={(e) => updateForm("annualIncome", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                <option value="5+ Lakhs">5+ Lakhs</option>
                <option value="10+ Lakhs">10+ Lakhs</option>
                <option value="20+ Lakhs">20+ Lakhs</option>
              </select>
            </div>
          </div>
        </section>

        {/* Location & Habits */}
        <section className="space-y-6 pt-6 border-t border-gray-50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Location & Lifestyle</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Preferred Locations (Kerala Districts & Towns)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateForm("preferredLocations", "All Kerala")}
                    className="text-xs text-brand-600 hover:text-brand-700 font-bold"
                  >
                    Select All Districts
                  </button>
                  <span className="text-gray-300 text-xs">|</span>
                  <button
                    type="button"
                    onClick={() => updateForm("preferredLocations", "")}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Districts</h4>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    {KERALA_DISTRICTS.map((district) => {
                      const currentList = formData.preferredLocations
                        ? formData.preferredLocations.split(",").map((s: string) => s.trim())
                        : [];
                      const isAll = formData.preferredLocations === "All Kerala";
                      const isSelected = isAll || currentList.includes(district);

                      return (
                        <button
                          key={district}
                          type="button"
                          onClick={() => {
                            if (isAll) {
                              const nextList = KERALA_DISTRICTS.filter(d => d !== district);
                              updateForm("preferredLocations", nextList.join(", "));
                            } else if (isSelected) {
                              const nextList = currentList.filter((d: string) => d !== district);
                              updateForm("preferredLocations", nextList.join(", "));
                            } else {
                              const nextList = [...currentList, district];
                              if (nextList.length === KERALA_DISTRICTS.length) {
                                updateForm("preferredLocations", "All Kerala");
                              } else {
                                updateForm("preferredLocations", nextList.join(", "));
                              }
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            isSelected
                              ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-brand-50 hover:border-brand-200"
                          }`}
                        >
                          {district}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Malappuram Towns / Areas</h4>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    {LOCATIONS.map((loc) => {
                      const currentList = formData.preferredLocations
                        ? formData.preferredLocations.split(",").map((s: string) => s.trim())
                        : [];
                      const isAll = formData.preferredLocations === "All Kerala";
                      const isSelected = isAll || currentList.includes(loc);

                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            if (isAll) {
                              const nextList = [...KERALA_DISTRICTS, ...LOCATIONS].filter(d => d !== loc);
                              updateForm("preferredLocations", nextList.join(", "));
                            } else if (isSelected) {
                              const nextList = currentList.filter((d: string) => d !== loc);
                              updateForm("preferredLocations", nextList.join(", "));
                            } else {
                              const nextList = [...currentList, loc];
                              updateForm("preferredLocations", nextList.join(", "));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            isSelected
                              ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-brand-50 hover:border-brand-200"
                          }`}
                        >
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Eating Habits</label>
              <select
                value={formData.eatingHabits}
                onChange={(e) => updateForm("eatingHabits", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                <option value="Vegetarian Only">Vegetarian Only</option>
                <option value="Non-Vegetarian Ok">Non-Vegetarian Ok</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Smoking Habits</label>
              <select
                value={formData.smokingHabits}
                onChange={(e) => updateForm("smokingHabits", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                <option value="Non-Smoker Only">Non-Smoker Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Drinking Habits</label>
              <select
                value={formData.drinkingHabits}
                onChange={(e) => updateForm("drinkingHabits", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="Any">Doesn't Matter</option>
                <option value="Non-Drinker Only">Non-Drinker Only</option>
              </select>
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-8 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin inline-block" />
                Saving draft...
              </>
            ) : lastSaved ? (
              <>
                <Save className="w-4 h-4" />
                Draft saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </>
            ) : null}
          </div>

          <div className="flex w-full sm:w-auto gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-6 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Save & Finish
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
