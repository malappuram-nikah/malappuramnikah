"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Edit3, User, Heart, BookOpen, Users, MapPin, Briefcase, Camera, Video, Mic } from "lucide-react";
import { showChildrenField } from "./BasicDetailsStep";
import { showPartnerChildrenField } from "./PartnerPreferencesStep";
import { API_URL } from "@/lib/config";


interface SectionHeaderProps {
  title: string;
  icon: React.ElementType;
  step: number;
  onEditSection?: (stepNumber: number) => void;
}

function SectionHeader({ title, icon: Icon, step, onEditSection }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
      <div className="flex items-center gap-2 text-brand-600">
        <Icon className="w-5 h-5" />
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      {onEditSection && (
        <button 
          onClick={() => onEditSection(step)}
          className="text-sm font-medium text-gray-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit
        </button>
      )}
    </div>
  );
}

interface DataRowProps {
  label: string;
  value: string | number | null | undefined;
}

function DataRow({ label, value }: DataRowProps) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 font-medium col-span-1">{label}</span>
      <span className="text-sm text-gray-900 col-span-1 md:col-span-2 font-medium">{value}</span>
    </div>
  );
}

interface ReviewStepProps {
  onComplete?: () => void;
  onBack?: () => void;
  onEditSection?: (stepNumber: number) => void;
}

export default function ReviewStep({ onComplete, onBack, onEditSection }: ReviewStepProps) {
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load all drafts from localStorage
    const keys = [
      "mn_basic_details_draft",
      "mn_religious_info_draft",
      "mn_professional_info_draft",
      "mn_family_details_draft",
      "mn_interests_draft",
      "mn_habits_draft",
      "mn_partner_preferences_draft",
      "mn_profile_photos_draft",
      "mn_video_intro_draft",
      "mn_voice_intro_draft"
    ];

    const loadedDrafts: Record<string, any> = {};
    
    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          loadedDrafts[key] = JSON.parse(item);
        }
      } catch (e) {
        console.error(`Failed to load ${key}`, e);
      }
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrafts(loadedDrafts);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(false);
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("mn_token");
      let userId = 1; // Default fallback for development/testing if token parsing fails
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.userId) {
            userId = payload.userId;
          }
        } catch (e) {
          console.error("Failed to parse token for user ID");
        }
      }

      const response = await fetch(`${API_URL}/user/${userId}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ profile_details: drafts }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit profile details");
      }

      // Optional: clear all drafts from localStorage after successful submission
      // Object.keys(drafts).forEach(key => localStorage.removeItem(key));
      
      if (onComplete) onComplete();
    } catch (error) {
      console.error("Error submitting profile:", error);
      alert("There was an error saving your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  // Helpers to safely render draft content
  const basic = drafts["mn_basic_details_draft"] || {};
  const religious = drafts["mn_religious_info_draft"] || {};
  const professional = drafts["mn_professional_info_draft"] || {};
  const family = drafts["mn_family_details_draft"] || {};
  const interests = drafts["mn_interests_draft"] || { interests: [] };
  const habits = drafts["mn_habits_draft"] || {};
  const partner = drafts["mn_partner_preferences_draft"] || {};
  const photos = drafts["mn_profile_photos_draft"] || { photos: [] };
  const video = drafts["mn_video_intro_draft"] || {};
  const voice = drafts["mn_voice_intro_draft"] || {};


  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-gray-900">Review Your Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Please review your information before final submission.</p>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-10">
        
        {/* Basic Details */}
        <section className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
          <SectionHeader title="Basic Details" icon={User} step={1} onEditSection={onEditSection} />
          <div className="space-y-1">
            <DataRow label="Name" value={basic.name || "Not provided"} />
            <DataRow label="Profile Created For" value={basic.profileFor} />
            <DataRow label="Age" value={basic.age} />
            <DataRow label="Gender" value={basic.gender} />
            <DataRow label="Marital Status" value={basic.maritalStatus} />
            {showChildrenField(basic.maritalStatus) && (
              <DataRow label="Have Children" value={basic.haveChildren} />
            )}
            <DataRow label="Height" value={basic.height} />
            <DataRow label="Present Location" value={basic.presentLocation} />
            <DataRow label="Marriage Goal Plan" value={basic.marriageGoalPlan} />
            <DataRow label="Willing to Relocate" value={basic.relocateForPartner} />
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Religious Info */}
          <section className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
            <SectionHeader title="Religious Info" icon={BookOpen} step={2} onEditSection={onEditSection} />
            <div className="space-y-1">
              <DataRow label="Religion" value={religious.religion} />
              <DataRow label="Community" value={religious.community} />
              <DataRow label="Religiousness" value={religious.religiousness} />
              <DataRow label="Namaz Habits" value={religious.namaz} />
              <DataRow label="Quran Reading" value={religious.quranReading} />
            </div>
          </section>

          {/* Professional Info */}
          <section className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
            <SectionHeader title="Career Info" icon={Briefcase} step={3} onEditSection={onEditSection} />
            <div className="space-y-1">
              <DataRow label="Education" value={professional.education === "Others" ? `Others (${professional.customEducation || ''})` : professional.education} />
              <DataRow label="Profession" value={professional.profession} />
              <DataRow label="Annual Income" value={professional.annualIncome} />
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Family Info */}
          <section className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
            <SectionHeader title="Family Details" icon={Users} step={4} onEditSection={onEditSection} />
            <div className="space-y-1">
              <DataRow label="Family Type" value={family.familyType} />
              <DataRow label="Financial Status" value={family.financialStatus} />
              <DataRow label="Father" value={family.fatherName} />
              <DataRow label="Mother" value={family.motherName} />
            </div>
          </section>

          {/* Lifestyle Info */}
          <section className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
            <SectionHeader title="Lifestyle" icon={MapPin} step={6} onEditSection={onEditSection} />
            <div className="space-y-1">
              <DataRow label="Eating Habits" value={habits.eatingHabits} />
              <DataRow label="Smoking" value={habits.smokingHabits} />
              <DataRow label="Drinking" value={habits.drinkingHabits} />
            </div>
          </section>
        </div>

        {/* Partner Preferences */}
        <section className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
          <SectionHeader title="Partner Preferences" icon={Heart} step={7} onEditSection={onEditSection} />
          <div className="space-y-1">
            <DataRow label="Age Range" value={`${partner.minAge || ''} to ${partner.maxAge || ''} Years`} />
            <DataRow label="Marital Status" value={partner.maritalStatus} />
            {showPartnerChildrenField(partner.maritalStatus) && (
              <DataRow label="Have Children Preference" value={partner.haveChildren} />
            )}
            <DataRow label="Religion" value={partner.religion} />
            <DataRow label="Education" value={partner.education} />
            <DataRow label="Locations" value={partner.preferredLocations} />
            <DataRow label="Preferred Namaz" value={partner.prefNamaz} />
            <DataRow label="Preferred Quran" value={partner.prefQuranReading} />
          </div>
        </section>

        {/* Media Summary */}
        <section className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div className="flex items-center gap-2 text-brand-600">
              <Camera className="w-5 h-5" />
              <h3 className="font-bold text-gray-900">Media Summary</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Photos</span>
              </div>
              <span className="text-sm font-bold text-brand-600">{photos.photos.length} Added</span>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Video Intro</span>
              </div>
              <span className={`text-sm font-bold ${video.video ? "text-green-600" : "text-gray-400"}`}>
                {video.video ? "Added" : "None"}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Voice Intro</span>
              </div>
              <span className={`text-sm font-bold ${voice.voice ? "text-green-600" : "text-gray-400"}`}>
                {voice.voice ? "Added" : "None"}
              </span>
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-8 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            By submitting, you agree to our Terms of Service & Privacy Policy.
          </div>

          <div className="flex w-full sm:w-auto gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting Profile...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Submit Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
