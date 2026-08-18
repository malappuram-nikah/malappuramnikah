"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BasicDetailsStep from "@/components/profile-setup/BasicDetailsStep";
import ReligiousInfoStep from "@/components/profile-setup/ReligiousInfoStep";
import ProfessionalInfoStep from "@/components/profile-setup/ProfessionalInfoStep";
import FamilyDetailsStep from "@/components/profile-setup/FamilyDetailsStep";
import InterestsStep from "@/components/profile-setup/InterestsStep";
import HabitsStep from "@/components/profile-setup/HabitsStep";
import PartnerPreferencesStep from "@/components/profile-setup/PartnerPreferencesStep";
import ProfilePhotosStep from "@/components/profile-setup/ProfilePhotosStep";

import VoiceIntroStep from "@/components/profile-setup/VoiceIntroStep";
import ReviewStep from "@/components/profile-setup/ReviewStep";
import IdentityVerificationForm from "@/components/dashboard/IdentityVerificationForm";
import { CheckCircle2, PhoneCall } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { getProfileCompletionStatus } from "@/lib/profile-utils";
import { updateProfileSection } from "@/lib/profile-api";
import { useUser } from "@/context/UserContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

export default function ProfileBuilderPage() {
  const router = useRouter();
  const { refreshUser } = useUser();
  const { applyCompletion } = useProfileCompletion();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      const { completedSteps: calcCompleted } = getProfileCompletionStatus(user);
      setCompletedSteps(calcCompleted);
    }
  }, [currentStep, user]);

  const basicInitialData = useMemo(() => {
    if (!user) return undefined;
    let calculatedAge = "24";
    if (user.dob) {
      const birthYear = parseInt(user.dob.split("-")[0], 10);
      if (!isNaN(birthYear)) {
        calculatedAge = (new Date().getFullYear() - birthYear).toString();
      }
    }
    return {
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      profileFor: user.profile_for || "Myself",
      gender: user.gender || "Male",
      age: calculatedAge,
      presentLocation: user.location || "",
    };
  }, [user]);

  const religiousInitialData = useMemo(() => {
    if (!user) return undefined;
    const details = user.profile_details || {};
    const religiousDraft = details.mn_religious_info_draft || {};
    return {
      religion: "Islam",
      community: user.cast || religiousDraft.community || "Sunni",
      namaz: religiousDraft.namaz || "",
      quranReading: religiousDraft.quranReading || "",
      religiousness: religiousDraft.religiousness || "",
    };
  }, [user]);

  const stepNames = [
    "Basic Details",
    "Religious Details",
    "Professional Details",
    "Family Details",
    "Interests & Hobbies",
    "Personal Habits",
    "Partner Preferences",
    "Profile Photos",
    "Voice Introduction",
    "Identity Verification",
    "Final Review",
    "Completion"
  ];

  useEffect(() => {
    // Determine the initial step target from query params or localStorage redirect
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const stepParam = params.get("step");
      const editParam = params.get("edit");
      if (stepParam) {
        setIsEditing(true);
        const parsedStep = parseInt(stepParam, 10);
        if (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 12) {
          setCurrentStep(parsedStep);
        }
      } else if (editParam === "true") {
        setIsEditing(true);
      } else {
        const savedStep = localStorage.getItem("mn_profile_builder_step");
        if (savedStep) {
          setIsEditing(true);
          setCurrentStep(parseInt(savedStep, 10));
          localStorage.removeItem("mn_profile_builder_step");
        }
      }
    }

    const fetchAndSyncData = async () => {
      try {
        let userId: number | null = null;
        const token = localStorage.getItem("mn_token");
        
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.userId) {
              userId = payload.userId;
            }
          } catch (e) {
            console.error("Token decoding error", e);
          }
        }

        if (userId !== null) {
          const res = await fetch(`${API_URL}/user/${userId}?t=${Date.now()}`, {
            headers: token ? { "Authorization": `Bearer ${token}` } : {},
            cache: "no-store"
          });
          const data = await res.json();
          
          if (data.success && data.user) {
            const user = data.profileCompletion
              ? { ...data.user, profileCompletion: data.profileCompletion }
              : data.user;
            setUser(user);

            // Only clear all profile builder draft keys if the logged in user changed
            const draftKeys = [
              "mn_basic_details_draft",
              "mn_religious_info_draft",
              "mn_professional_info_draft",
              "mn_family_details_draft",
              "mn_interests_draft",
              "mn_habits_draft",
              "mn_partner_preferences_draft",
              "mn_profile_photos_draft",
              "mn_voice_intro_draft"
            ];
            
            const prevUserId = localStorage.getItem("mn_logged_in_user_id");
            if (prevUserId !== String(userId)) {
              draftKeys.forEach((key) => localStorage.removeItem(key));
            }
            
            localStorage.setItem("mn_logged_in_user_id", String(userId));

            // 1. Sync saved profile_details drafts from database back into localStorage
            if (user.profile_details) {
              Object.entries(user.profile_details).forEach(([key, value]) => {
                localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
              });
            }

            // 2. Pre-populate step 1 draft from core signup details if not already saved
            const basicKey = "mn_basic_details_draft";
            if (!localStorage.getItem(basicKey)) {
              let calculatedAge = "24";
              if (user.dob) {
                const birthYear = parseInt(user.dob.split("-")[0], 10);
                if (!isNaN(birthYear)) {
                  calculatedAge = (new Date().getFullYear() - birthYear).toString();
                }
              }
              const defaultBasic = {
                name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
                profileFor: user.profile_for || "Myself",
                gender: user.gender || "Male",
                location: user.location || "Malappuram, Kerala",
                presentLocation: user.location || "Malappuram",
                age: calculatedAge,
                aboutMe: "",
                height: "",
                maritalStatus: "Single",
                motherTongue: "Malayalam",
                physicalStatus: "Normal",
                appearance: "",
                weight: "",
                languagesSpoken: "Malayalam, English"
              };
              localStorage.setItem(basicKey, JSON.stringify(defaultBasic));
            }

            // 3. Pre-populate step 2 draft (Religious) from community column if not already saved
            const religiousKey = "mn_religious_info_draft";
            if (!localStorage.getItem(religiousKey)) {
              const defaultReligious = {
                religion: "Islam",
                community: user.cast || "Sunni",
                religiousness: "Pious"
              };
              localStorage.setItem(religiousKey, JSON.stringify(defaultReligious));
            }
          }
        }
      } catch (err) {
        console.warn("Backend dynamic fetch failed. Operating in offline/localStorage draft mode.", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAndSyncData();
  }, []);

  const persistSection = async (
    section: import("@/lib/profile-api").ProfileSectionSlug,
    data: Record<string, unknown>
  ) => {
    try {
      const result = await updateProfileSection(section, data);
      if (result.profileCompletion) {
        applyCompletion(result.profileCompletion);
        setUser((prev: any) =>
          prev
            ? {
                ...prev,
                profileCompletion: result.profileCompletion,
                profile_details: {
                  ...(prev.profile_details || {}),
                  [result.draftKey]: result.data,
                },
              }
            : prev
        );
      }
    } catch (err) {
      console.error(`Failed to save ${section} section:`, err);
    }
  };

  const handleBasicDetailsComplete = async (data: any) => {
    await persistSection("basic", data);
    setCurrentStep(2);
  };

  const handleReligiousInfoComplete = async (data: any) => {
    await persistSection("religious", data);
    setCurrentStep(3);
  };

  const handleProfessionalInfoComplete = async (data: any) => {
    await persistSection("professional", data);
    setCurrentStep(4);
  };

  const handleFamilyDetailsComplete = async (data: any) => {
    await persistSection("family", data);
    setCurrentStep(5);
  };

  const handleInterestsComplete = async (data: any) => {
    await persistSection("interests", data);
    setCurrentStep(6);
  };

  const handleHabitsComplete = async (data: any) => {
    await persistSection("habits", data);
    setCurrentStep(7);
  };

  const handlePartnerPreferencesComplete = async (data: any) => {
    await persistSection("partner-preferences", data);
    setCurrentStep(8);
  };

  const handleProfilePhotosComplete = async (data: any) => {
    await persistSection("photos", data);
    setCurrentStep(9);
  };

  const handleVoiceIntroComplete = async (data: any) => {
    await persistSection("voice", data);
    setCurrentStep(10);
  };

  const handleKycComplete = () => {
    setCurrentStep(11);
  };

  const handleReviewComplete = async () => {
    await refreshUser();
    setCurrentStep(12);
  };

  const handleFinish = () => {
    router.push("/dashboard");
  };

  const completionPercentage = user?.profileCompletion?.percentage ?? 0;
  const isProfileCompleted = completionPercentage >= 80;

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center max-w-sm w-full shadow-xl shadow-brand-900/5 flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-5 relative">
            <span className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Restoring Progress</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Syncing your dynamic profile details securely with the database...
          </p>
        </div>
      </div>
    );
  }

  // 1. If user is on Step 12 (Completion step) and not explicitly editing a step, show success screen
  if (currentStep === 12 && !isEditing) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="max-w-xl w-full bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 text-center shadow-xl shadow-gray-200/50 relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-50 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-50 rounded-full blur-2xl pointer-events-none" />

          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs border border-green-100 ring-8 ring-green-50/50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-green-50 text-green-700 border border-green-200/80 rounded-full text-xs font-bold shadow-2xs mb-4">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Profile {completionPercentage}% Complete
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-playfair mb-3">
            Your Profile is Fully Completed!
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto mb-8 leading-relaxed">
            All your profile details have been saved and verified. Your profile is active and fully discoverable by potential matches.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setIsEditing(true);
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Profile
            </button>
            <button
              onClick={() => router.push("/dashboard/my-profile")}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              View My Profile
            </button>
            <button
              onClick={() => router.push("/dashboard/matches")}
              className="w-full sm:w-auto px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              Browse Matches &rarr;
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Otherwise (profile not yet completed, or user clicked "Edit Profile"), render the full profile builder wizard!
  return (
    <div className="pb-10 relative">
      <div className="max-w-6xl mx-auto mb-8 px-2 sm:px-4">

        {/* Header row with back link + title */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isProfileCompleted) {
                  setIsEditing(false);
                } else {
                  router.push("/dashboard");
                }
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              {isProfileCompleted ? "Overview" : "Dashboard"}
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-800">Manage My Profile</span>
          </div>

          {isProfileCompleted && (
            <button
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              &larr; Done Editing
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-playfair text-left">
              Manage My Profile
            </h1>
            <p className="text-gray-500 text-left mt-1 text-sm">
              Click any step below to jump directly to it and update your details.
            </p>
          </div>
        </div>

        {/* Need Help Block */}
        <div className="mt-6 mb-2 mx-auto max-w-lg bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Need help filling this?</p>
              <p className="text-xs text-gray-600">Our executives are here to guide you.</p>
            </div>
          </div>
          <a href="tel:+919447868443" className="shrink-0 bg-white border border-brand-200 text-brand-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-brand-50 transition-colors shadow-xs flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-brand-600" />
            <span>Call +91 9447868443</span>
          </a>
        </div>

        {/* Mobile Step Tracker */}
        <div className="block sm:hidden mt-6 bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            <span>Step {currentStep} of 12</span>
            <span className="text-brand-600 font-bold">{stepNames[currentStep - 1] || "Review"}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-brand-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep - 1) / 12) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {/* Mobile: scrollable step chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {stepNames.slice(0, 12).map((name, idx) => {
              const step = idx + 1;
              const isDone = completedSteps.includes(step);
              const isCurrent = currentStep === step;
              return (
                <button
                  key={step}
                  onClick={() => setCurrentStep(step)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                    isCurrent
                      ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                      : isDone
                      ? "bg-brand-50 text-brand-700 border-brand-200"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  {step}. {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop: Clickable step dots with tooltips */}
        <div className="hidden sm:flex items-start justify-between mt-8 w-full max-w-full px-2">
          {stepNames.slice(0, 12).map((name, idx) => {
            const step = idx + 1;
            const isDone = completedSteps.includes(step);
            const isCurrent = currentStep === step;
            const isLast = step === 12;
            return (
              <div key={step} className={`flex items-start ${isLast ? 'shrink-0' : 'flex-1'}`}>
                {/* Step dot + label */}
                <div className="flex flex-col items-center group shrink-0 w-14 md:w-16">
                  <button
                    onClick={() => setCurrentStep(step)}
                    title={name}
                    className={`relative w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ring-2 ring-offset-1 ${
                      isCurrent
                        ? "bg-brand-600 text-white ring-brand-400 scale-110 shadow-md shadow-brand-200"
                        : isDone
                        ? "bg-brand-500 text-white ring-brand-300 hover:scale-105"
                        : "bg-gray-100 text-gray-400 ring-transparent hover:bg-brand-50 hover:text-brand-600 hover:ring-brand-200"
                    }`}
                  >
                    {isDone ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : step}
                  </button>
                  <span className={`mt-2 text-[9px] md:text-[10px] font-semibold text-center whitespace-normal leading-tight ${
                    isCurrent ? "text-brand-600" : isDone ? "text-brand-400" : "text-gray-400"
                  }`}>
                    {name}
                  </span>
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 bg-gray-200 mt-4 mx-1 min-w-[4px]">
                    <motion.div
                      className="h-full bg-brand-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: currentStep > step ? "100%" : "0%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <BasicDetailsStep initialData={basicInitialData} onComplete={handleBasicDetailsComplete} />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <ReligiousInfoStep initialData={religiousInitialData} onComplete={handleReligiousInfoComplete} onBack={() => setCurrentStep(1)} />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <ProfessionalInfoStep onComplete={handleProfessionalInfoComplete} onBack={() => setCurrentStep(2)} />
          </motion.div>
        )}

        {currentStep === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <FamilyDetailsStep onComplete={handleFamilyDetailsComplete} onBack={() => setCurrentStep(3)} />
          </motion.div>
        )}

        {currentStep === 5 && (
          <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <InterestsStep onComplete={handleInterestsComplete} onBack={() => setCurrentStep(4)} />
          </motion.div>
        )}

        {currentStep === 6 && (
          <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <HabitsStep onComplete={handleHabitsComplete} onBack={() => setCurrentStep(5)} />
          </motion.div>
        )}

        {currentStep === 7 && (
          <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <PartnerPreferencesStep onComplete={handlePartnerPreferencesComplete} onBack={() => setCurrentStep(6)} />
          </motion.div>
        )}
        
        {currentStep === 8 && (
          <motion.div key="step8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <ProfilePhotosStep onComplete={handleProfilePhotosComplete} onBack={() => setCurrentStep(7)} />
          </motion.div>
        )}

        {currentStep === 9 && (
          <motion.div key="step9" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <VoiceIntroStep onComplete={handleVoiceIntroComplete} onBack={() => setCurrentStep(8)} />
          </motion.div>
        )}

        {currentStep === 10 && (
          <motion.div key="step10" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <IdentityVerificationForm 
                isWizard={true}
                onBack={() => setCurrentStep(9)}
                onNext={handleKycComplete}
              />
            </div>
          </motion.div>
        )}

        {currentStep === 11 && (
          <motion.div key="step11" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <ReviewStep 
              onComplete={handleReviewComplete} 
              onBack={() => setCurrentStep(10)} 
              onEditSection={(step) => setCurrentStep(step)}
              onCompletionUpdate={applyCompletion}
            />
          </motion.div>
        )}

        {currentStep === 12 && (
          <motion.div
            key="step13"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center"
          >
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold shadow-xs mb-3">
              100% Completed Profile
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 font-playfair">
              Profile Completed Successfully!
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              Your profile is fully completed and active for matchmaking. Potential matches can now discover and connect with you.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto px-6 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Profile
              </button>
              <button
                onClick={() => router.push("/dashboard/my-profile")}
                className="w-full sm:w-auto px-6 py-3.5 bg-brand-50 border border-brand-200 text-brand-700 font-semibold rounded-xl hover:bg-brand-100 active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                View My Profile
              </button>
              <button
                onClick={handleFinish}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
