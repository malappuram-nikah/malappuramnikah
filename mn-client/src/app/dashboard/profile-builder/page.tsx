"use client";

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
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

export default function ProfileBuilderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [user, setUser] = useState<any>(null);

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
      if (stepParam) {
        const parsedStep = parseInt(stepParam, 10);
        if (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 12) {
          setCurrentStep(parsedStep);
        }
      } else {
        const savedStep = localStorage.getItem("mn_profile_builder_step");
        if (savedStep) {
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
            const user = data.user;
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
                aboutMe: "Looking for a pious, family-oriented partner with shared values.",
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

  const handleBasicDetailsComplete = (data: any) => {
    setCurrentStep(2);
  };

  const handleReligiousInfoComplete = (data: any) => {
    setCurrentStep(3);
  };

  const handleProfessionalInfoComplete = (data: any) => {
    setCurrentStep(4);
  };

  const handleFamilyDetailsComplete = (data: any) => {
    setCurrentStep(5);
  };

  const handleInterestsComplete = (data: any) => {
    setCurrentStep(6);
  };

  const handleHabitsComplete = (data: any) => {
    setCurrentStep(7);
  };

  const handlePartnerPreferencesComplete = (data: any) => {
    setCurrentStep(8);
  };

  const handleProfilePhotosComplete = (data: any) => {
    setCurrentStep(9);
  };

  const handleVoiceIntroComplete = (data: any) => {
    setCurrentStep(10);
  };

  const handleKycComplete = () => {
    setCurrentStep(11);
  };

  const handleReviewComplete = () => {
    setCurrentStep(12); // Go to success screen
  };

  const handleFinish = () => {
    router.push("/dashboard");
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-8">

        {/* Header row with back link + title */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Dashboard
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-800">Manage My Profile</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-playfair text-center">
          Manage My Profile
        </h1>
        <p className="text-gray-500 text-center mt-2 text-sm">
          Click any step below to jump directly to it and update your details.
        </p>

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
              const isDone = currentStep > step;
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
            const isDone = currentStep > step;
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
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
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
            />
          </motion.div>
        )}

        {currentStep === 12 && (
          <motion.div
            key="step13"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center"
          >
            <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Profile Updated Successfully!</h2>
            <p className="text-gray-500 mb-8">
              Your entire profile has been saved successfully. You're now fully set up to find your perfect match!
            </p>
            <button
              onClick={handleFinish}
              className="px-8 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm"
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
