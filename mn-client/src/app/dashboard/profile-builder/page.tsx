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
import VideoIntroStep from "@/components/profile-setup/VideoIntroStep";
import VoiceIntroStep from "@/components/profile-setup/VoiceIntroStep";
import ReviewStep from "@/components/profile-setup/ReviewStep";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
    "Video Onboarding",
    "Voice Introduction",
    "Final Review",
    "Completion"
  ];

  useEffect(() => {
    // Determine the initial step target from settings redirect, if any
    if (typeof window !== "undefined") {
      const savedStep = localStorage.getItem("mn_profile_builder_step");
      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10));
        localStorage.removeItem("mn_profile_builder_step");
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
          const res = await fetch(`http://localhost:3333/user/${userId}?t=${Date.now()}`, {
            headers: token ? { "Authorization": `Bearer ${token}` } : {},
            cache: "no-store"
          });
          const data = await res.json();
          
          if (data.success && data.user) {
            const user = data.user;
            setUser(user);

            // Always clear all profile builder draft keys to prevent stale cached/outdated values
            const draftKeys = [
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
            draftKeys.forEach((key) => localStorage.removeItem(key));
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

  const handleVideoIntroComplete = (data: any) => {
    setCurrentStep(10);
  };

  const handleVoiceIntroComplete = (data: any) => {
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
        <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center max-w-sm w-full shadow-xl shadow-brand-900/5 flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-5 relative">
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
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-playfair text-center">
          Complete Your Profile
        </h1>
        <p className="text-gray-500 text-center mt-2">
          Help us find the perfect match for you by providing these details.
        </p>

        {/* Wizard Steps Indicator */}
        {/* Sleek Mobile Step Tracker */}
        <div className="block sm:hidden mt-6 bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            <span>Step {currentStep} of 12</span>
            <span className="text-brand-600 font-bold">{stepNames[currentStep - 1] || "Review"}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-brand-600 rounded-full" 
              initial={{ width: 0 }} 
              animate={{ width: `${(currentStep / 12) * 100}%` }} 
              transition={{ duration: 0.3 }} 
            />
          </div>
        </div>

        {/* Desktop Dots Tracker */}
        <div className="hidden sm:flex items-center justify-center mt-8 gap-1.5 overflow-x-auto pb-4 px-2 w-full max-w-full hide-scrollbar">
          <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-brand-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 1 ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>1</div>
          </div>
          <div className="w-1.5 sm:w-2 h-0.5 bg-gray-200 shrink-0">
            <motion.div className="h-full bg-brand-600" initial={{ width: 0 }} animate={{ width: currentStep >= 2 ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
          </div>

          <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-brand-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 2 ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>2</div>
          </div>
          <div className="w-1.5 sm:w-2 h-0.5 bg-gray-200 shrink-0">
            <motion.div className="h-full bg-brand-600" initial={{ width: 0 }} animate={{ width: currentStep >= 3 ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
          </div>

          <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-brand-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 3 ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>3</div>
          </div>
          <div className="w-1.5 sm:w-2 h-0.5 bg-gray-200 shrink-0">
            <motion.div className="h-full bg-brand-600" initial={{ width: 0 }} animate={{ width: currentStep >= 4 ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
          </div>

          <div className={`flex items-center gap-1.5 ${currentStep >= 4 ? 'text-brand-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 4 ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>4</div>
          </div>
          <div className="w-1.5 sm:w-2 h-0.5 bg-gray-200 shrink-0">
            <motion.div className="h-full bg-brand-600" initial={{ width: 0 }} animate={{ width: currentStep >= 5 ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
          </div>

          <div className={`flex items-center gap-1.5 ${currentStep >= 5 ? 'text-brand-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 5 ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>5</div>
          </div>
          <div className="w-1.5 sm:w-2 h-0.5 bg-gray-200 shrink-0">
            <motion.div className="h-full bg-brand-600" initial={{ width: 0 }} animate={{ width: currentStep >= 6 ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
          </div>

          <div className={`flex items-center gap-1.5 ${currentStep >= 6 ? 'text-brand-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 6 ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>6</div>
          </div>
          <div className="w-1.5 sm:w-2 h-0.5 bg-gray-200 shrink-0">
            <motion.div className="h-full bg-brand-600" initial={{ width: 0 }} animate={{ width: currentStep >= 7 ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
          </div>

          <div className={`flex items-center gap-1.5 ${currentStep >= 7 ? 'text-brand-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 7 ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>7</div>
          </div>
          <div className="w-1.5 sm:w-2 h-0.5 bg-gray-200 shrink-0">
            <motion.div className="h-full bg-brand-600" initial={{ width: 0 }} animate={{ width: currentStep >= 8 ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
          </div>

          <div className={`flex items-center gap-1.5 ${currentStep >= 8 ? 'text-brand-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 8 ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>8</div>
          </div>
          <div className="w-1.5 sm:w-2 h-0.5 bg-gray-200 shrink-0">
            <motion.div className="h-full bg-brand-600" initial={{ width: 0 }} animate={{ width: currentStep >= 9 ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
          </div>

          <div className={`flex items-center gap-1.5 ${currentStep >= 9 ? 'text-brand-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 9 ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>9</div>
          </div>
          <div className="w-1.5 sm:w-2 h-0.5 bg-gray-200 shrink-0">
            <motion.div className="h-full bg-brand-600" initial={{ width: 0 }} animate={{ width: currentStep >= 10 ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
          </div>
          
          <div className={`flex items-center gap-1.5 ${currentStep >= 10 ? 'text-brand-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 10 ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>10</div>
          </div>
          <div className="w-1.5 sm:w-2 h-0.5 bg-gray-200 shrink-0">
            <motion.div className="h-full bg-brand-600" initial={{ width: 0 }} animate={{ width: currentStep >= 11 ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
          </div>

          <div className={`flex items-center gap-1.5 ${currentStep >= 11 ? 'text-brand-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 11 ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>11</div>
            <span className="hidden lg:block text-xs font-medium whitespace-nowrap">Review</span>
          </div>
          <div className="w-1.5 sm:w-2 h-0.5 bg-gray-200 shrink-0">
            <motion.div className="h-full bg-brand-600" initial={{ width: 0 }} animate={{ width: currentStep >= 12 ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
          </div>

          <div className={`flex items-center gap-1.5 ${currentStep >= 12 ? 'text-brand-600' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 12 ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>12</div>
          </div>
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
            <VideoIntroStep onComplete={handleVideoIntroComplete} onBack={() => setCurrentStep(8)} />
          </motion.div>
        )}
        
        {currentStep === 10 && (
          <motion.div key="step10" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <VoiceIntroStep onComplete={handleVoiceIntroComplete} onBack={() => setCurrentStep(9)} />
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
            key="step12"
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
