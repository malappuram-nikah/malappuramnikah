"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Bell, Shield, ChevronRight, Sparkles, AlertCircle, ArrowRight, Save, CheckCircle2, Phone, Loader2, MessageSquarePlus, Star, Check, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { LOCATIONS } from "@/lib/constants";
import { useUser } from "@/context/UserContext";
import { API_URL } from "@/lib/config";
import { setToken } from "@/lib/auth-session";
import IdentityVerificationForm from "@/components/dashboard/IdentityVerificationForm";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "feedback", label: "Feedback", icon: MessageSquarePlus },
];

export default function SettingsPage() {
  const router = useRouter();
  const { currentUser, refreshUser, completionPercent, strength, strengthColor, missingSections } = useUser();
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showKycUpload, setShowKycUpload] = useState(false);

  // Feedback Form State
  const [feedbackCategory, setFeedbackCategory] = useState("SUGGESTION");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackRatingHover, setFeedbackRatingHover] = useState<number | null>(null);
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  // User Profile States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");
  const [age, setAge] = useState("");
  const [community, setCommunity] = useState("");
  const [gender, setGender] = useState("");
  const [profileFor, setProfileFor] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [namaz, setNamaz] = useState("");
  const [quranReading, setQuranReading] = useState("");

  // Verification Status States
  const [userStatus, setUserStatus] = useState("in_active");
  const [verificationMethod, setVerificationMethod] = useState("");
  const [verifyMode, setVerifyMode] = useState<"choose" | "aadhaar" | "number">("choose");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  // Aadhaar Verification states
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [showAadhaarOtpBanner, setShowAadhaarOtpBanner] = useState(false);

  // Mobile Verification states
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [showMobileOtpBanner, setShowMobileOtpBanner] = useState(false);



  const loadProfileData = async () => {
    try {
      let currentUserId: number | null = null;
      const token = localStorage.getItem("mn_token");
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.userId) {
            currentUserId = payload.userId;
            setUserId(payload.userId);
          }
        } catch (e) {
          console.error("Token decoding error", e);
        }
      }

      let userFetched = false;
      try {
        if (currentUser) {
            // Clear old draft keys first to prevent stale cache
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
            draftKeys.forEach((key) => localStorage.removeItem(key));

            // 1. Sync saved profile_details drafts from database back into localStorage
            if (currentUser.profile_details) {
              Object.entries(currentUser.profile_details).forEach(([key, value]) => {
                localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
              });
            }

            // 2. Pre-populate step 1 draft from core signup details if not already saved
            const basicKey = "mn_basic_details_draft";
            if (!localStorage.getItem(basicKey)) {
              let calculatedAge = "";
              if (currentUser.dob) {
                const birthYear = parseInt(currentUser.dob.split("-")[0], 10);
                if (!isNaN(birthYear)) {
                  calculatedAge = (new Date().getFullYear() - birthYear).toString();
                }
              }
              const defaultBasic = {
                name: `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim(),
                profileFor: currentUser.profile_for || "",
                gender: currentUser.gender || "",
                location: currentUser.location || "",
                presentLocation: currentUser.location || "",
                age: calculatedAge,
                aboutMe: "",
                height: "",
                maritalStatus: "",
                motherTongue: "",
                physicalStatus: "",
                appearance: "",
                weight: "",
                languagesSpoken: ""
              };
              localStorage.setItem(basicKey, JSON.stringify(defaultBasic));
            }

            // 3. Pre-populate step 2 draft (Religious) from community column if not already saved
            const religiousKey = "mn_religious_info_draft";
            if (!localStorage.getItem(religiousKey)) {
              const defaultReligious = {
                religion: "",
                community: currentUser.cast || "",
                religiousness: ""
              };
              localStorage.setItem(religiousKey, JSON.stringify(defaultReligious));
            }

            setFirstName(currentUser.first_name || "");
            setLastName(currentUser.last_name || "");
            setMobile(currentUser.mobile_number || "");
            setLocation(currentUser.location || "");
            
            setUserStatus(currentUser.status || "in_active");
            setVerificationMethod(currentUser.profile_details?.verification_method || "");

            // Calculate age from DOB timezone-safely
            if (currentUser.dob) {
              const birthYear = parseInt(currentUser.dob.split("-")[0], 10);
              if (!isNaN(birthYear)) {
                setAge((new Date().getFullYear() - birthYear).toString());
              }
            } else {
              setAge("");
            }

            setCommunity(currentUser.cast || "");
            setGender(currentUser.gender || "");
            setProfileFor(currentUser.profile_for || "");
            setAboutMe(currentUser.profile_details?.mn_basic_details_draft?.aboutMe || "");

            const religiousDraft = currentUser.profile_details?.mn_religious_info_draft || {};
            setNamaz(religiousDraft.namaz || "");
            setQuranReading(religiousDraft.quranReading || "");

            userFetched = true;
        }
      } catch (apiErr) {
        console.warn("Backend profile sync failed in settings. Using fallback details.", apiErr);
      }

      if (!userFetched) {
        const basicDraft = localStorage.getItem("mn_basic_details_draft");
        if (basicDraft) {
          try {
            const parsed = JSON.parse(basicDraft);
            const nameParts = (parsed.name || "").trim().split(" ");
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");
            setGender(parsed.gender || "");
            setProfileFor(parsed.profileFor || "");
            setLocation(parsed.location || "");
            setAge(parsed.age || "");
            setAboutMe(parsed.aboutMe || "");
          } catch (err) {
            console.error(err);
          }
        } else {
          setFirstName("");
          setLastName("");
          setMobile("");
          setLocation("");
          setAge("");
          setCommunity("");
          setGender("");
          setProfileFor("");
          setAboutMe("");
        }
      }

      if (!userFetched) {
        const religiousDraft = localStorage.getItem("mn_religious_info_draft");
        if (religiousDraft) {
          try {
            const parsed = JSON.parse(religiousDraft);
            setNamaz(parsed.namaz || "");
            setQuranReading(parsed.quranReading || "");
          } catch (err) {}
        }
      }
    } catch (e) {
      console.error("Error loading profile data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["profile", "security", "notifications", "privacy", "feedback"].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, [currentUser]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackSubject.trim().length < 3) {
      setFeedbackError("Subject must be at least 3 characters long.");
      return;
    }
    if (feedbackMessage.trim().length < 10) {
      setFeedbackError("Message must be at least 10 characters long.");
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackError("");
    setFeedbackSuccess(false);

    try {
      const storedToken = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${storedToken}`
        },
        body: JSON.stringify({
          category: feedbackCategory,
          rating: feedbackRating,
          subject: feedbackSubject,
          message: feedbackMessage
        })
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackSuccess(true);
        setFeedbackSubject("");
        setFeedbackMessage("");
        setFeedbackRating(5);
        setTimeout(() => setFeedbackSuccess(false), 4000);
      } else {
        setFeedbackError(data.message || "Failed to submit feedback.");
      }
    } catch (err) {
      setFeedbackError("Connection error. Please check your internet connection.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleSave = async () => {
    setSaved(false);
    setSaveError(null);
    
    // Read current drafts from localStorage
    const profileDetails: Record<string, any> = {};
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

    draftKeys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          profileDetails[key] = JSON.parse(stored);
        }
      } catch (e) {
        console.error(`Error reading draft for ${key}:`, e);
      }
    });

    // Make sure aboutMe is synced inside basic details draft
    if (!profileDetails["mn_basic_details_draft"]) {
      profileDetails["mn_basic_details_draft"] = {};
    }
    profileDetails["mn_basic_details_draft"].aboutMe = aboutMe;
    profileDetails["mn_basic_details_draft"].age = age;
    profileDetails["mn_basic_details_draft"].name = `${firstName} ${lastName}`.trim();
    profileDetails["mn_basic_details_draft"].presentLocation = location;
    localStorage.setItem("mn_basic_details_draft", JSON.stringify(profileDetails["mn_basic_details_draft"]));

    // Make sure namaz and quranReading are synced inside religious info draft
    if (!profileDetails["mn_religious_info_draft"]) {
      profileDetails["mn_religious_info_draft"] = {};
    }
    profileDetails["mn_religious_info_draft"].namaz = namaz;
    profileDetails["mn_religious_info_draft"].quranReading = quranReading;
    profileDetails["mn_religious_info_draft"].community = community;
    localStorage.setItem("mn_religious_info_draft", JSON.stringify(profileDetails["mn_religious_info_draft"]));

    // Save approximate DOB derived from Age
    const birthYear = new Date().getFullYear() - parseInt(age || "24", 10);
    const dobValue = `${birthYear}-01-01`;

    const coreFields = {
      first_name: firstName,
      last_name: lastName,
      mobile_number: mobile,
      location: location,
      dob: dobValue,
      cast: community,
      gender: gender,
      profile_for: profileFor
    };

    try {
      const token = localStorage.getItem("mn_token");
      if (!token || !userId) {
        setSaveError("You must be logged in to save changes.");
        return;
      }

      const res = await fetch(`${API_URL}/user/${userId}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          profile_details: profileDetails,
          core_fields: coreFields
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setSaveError(null);
        setTimeout(() => setSaved(false), 2500);
        await refreshUser();
      } else {
        setSaveError(data.message || "Failed to save profile changes.");
      }
    } catch (err) {
      console.error("Failed to save profile changes:", err);
      setSaveError("Failed to save profile changes. Please try again.");
    }
  };

  // Aadhaar Flow handlers
  const handleAadhaarVerifySend = () => {
    const clean = aadhaarNumber.replace(/\s/g, "");
    if (clean.length !== 12 || isNaN(Number(clean))) {
      setVerificationError("Please enter a valid 12-digit Aadhaar number");
      return;
    }
    setVerificationError("");
    setIsVerifying(true);
    setTimeout(() => {
      setAadhaarOtpSent(true);
      setShowAadhaarOtpBanner(true);
      setIsVerifying(false);
      setTimeout(() => setShowAadhaarOtpBanner(false), 6000);
    }, 1200);
  };

  const handleAadhaarVerifyConfirm = async () => {
    if (!aadhaarOtp || aadhaarOtp.length < 6) {
      setVerificationError("Please enter the complete verification code.");
      return;
    }
    setVerificationError("");
    setIsVerifying(true);
    try {
      const response = await fetch(`${API_URL}/otp/verify-aadhaar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          aadhaarNumber: aadhaarNumber,
          otpCode: aadhaarOtp,
        })
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Aadhaar verification is not available yet.");
      }

      if (data.accessToken) {
        setToken(data.accessToken);
      }
      setUserStatus("active");
      setVerificationMethod("aadhaar");
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Aadhaar verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Mobile Flow handlers
  const handleMobileVerifySend = async () => {
    setVerificationError("");
    setIsVerifying(true);
    try {
      const response = await fetch(`${API_URL}/otp/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobile })
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to send OTP");
      }
      setMobileOtpSent(true);
      setShowMobileOtpBanner(true);
      setTimeout(() => setShowMobileOtpBanner(false), 6000);
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMobileVerifyConfirm = async () => {
    setVerificationError("");
    setIsVerifying(true);
    try {
      const response = await fetch(`${API_URL}/otp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: mobile,
          otpCode: mobileOtp.split(""),
          userId: userId,
        })
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Invalid OTP. Please try again.");
      }

      if (data.accessToken) {
        setToken(data.accessToken);
      }
      setUserStatus("active");
      setVerificationMethod("mobile");
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "OTP verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const formatAadhaar = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 12);
    const match = clean.match(/(\d{0,4})(\d{0,4})(\d{0,4})/);
    if (!match) return clean;
    return [match[1], match[2], match[3]].filter(Boolean).join(" ");
  };

  const handleCompleteNextStep = (stepNum: number) => {
    localStorage.setItem("mn_profile_builder_step", stepNum.toString());
    router.push("/dashboard/profile-builder");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("mn_token");
      if (!token || !userId) {
        throw new Error("No authentication details found.");
      }

      const res = await fetch(`${API_URL}/user/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        localStorage.clear();
        router.push("/login");
        window.location.reload();
      } else {
        alert(data.message || "Failed to delete account.");
      }
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      alert(err.message || "An error occurred while deleting your account.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-400">
        <span className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin inline-block mr-2" />
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-playfair text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, privacy, and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab navigation */}
        <aside className="lg:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-4 text-sm font-medium transition-all border-b border-gray-50 last:border-0 ${
                  activeTab === tab.id
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </span>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </button>
            ))}
          </div>
        </aside>

        {/* Content panel */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-gray-100 p-6 space-y-6"
          >
            {activeTab === "profile" && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Profile Details</h2>
                    <p className="text-xs text-gray-500 mt-1">These details were collected during registration. You can edit them below.</p>
                  </div>

                  {/* Sleek Completion Ribbon */}
                  <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-xs font-bold ${strengthColor} shrink-0 w-max`}>
                    <CheckCircle2 className="w-4 h-4 text-brand-600" />
                    <span>Profile Complete: {completionPercent}% ({strength})</span>
                  </div>
                </div>

                {/* Advanced Profile Builder redirect card */}
                <div className="bg-brand-50 rounded-xl p-5 border border-brand-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <UserCog className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-brand-900">Advanced Profile Settings</h4>
                      <p className="text-xs text-brand-600 mt-0.5 max-w-md leading-relaxed">
                        Update your Religious Info, Career & Education, Family Details, Hobbies, Partner Preferences, and upload Photos.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard/profile-builder")}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all shrink-0 flex items-center justify-center gap-1.5 active:scale-95 text-center font-medium"
                  >
                    Open Profile Builder
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Micro Completion Interactive Card */}
                {completionPercent < 100 && missingSections.length > 0 && (
                  <div className="bg-gradient-to-br from-brand-900 to-brand-700 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:16px_16px] opacity-5 pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-brand-200" />
                          <h4 className="font-bold text-sm sm:text-base">Complete Your Profile Setup</h4>
                        </div>
                        <p className="text-xs text-brand-100 mt-1 max-w-md leading-relaxed">
                          Your profile is at {completionPercent}%. Complete the next step <span className="font-bold text-white underline">{missingSections[0].name}</span> to double your partner matches!
                        </p>
                      </div>
                      <button
                        onClick={() => handleCompleteNextStep(missingSections[0].step)}
                        className="px-5 py-2.5 bg-white text-brand-900 hover:bg-brand-50 text-xs font-bold rounded-xl shadow transition-all shrink-0 flex items-center gap-1.5 active:scale-95"
                      >
                        Complete Step {missingSections[0].step}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Form fields */}
                <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    { label: "First Name",    value: firstName,   onChange: setFirstName,   placeholder: "Your first name", type: "text" },
                    { label: "Last Name",     value: lastName,    onChange: setLastName,    placeholder: "Your last name", type: "text" },
                    { label: "Mobile Number", value: mobile,      onChange: setMobile,      placeholder: "+91 98765 43210", type: "text" },
                    { label: "Location",      value: location,    onChange: setLocation,    placeholder: "Select Location", type: "select", options: LOCATIONS },
                    { label: "Age",           value: age,         onChange: setAge,         placeholder: "e.g. 24", type: "number" },
                    { label: "Community",     value: community,   onChange: setCommunity,   placeholder: "e.g. Sunni", type: "text" },
                    { label: "Gender",        value: gender,      onChange: setGender,      placeholder: "e.g. Male", type: "text" },
                    { label: "Profile For",   value: profileFor,  onChange: setProfileFor,  placeholder: "e.g. Myself", type: "text" },
                    { label: "Namaz Habits",  value: namaz,       onChange: setNamaz,       placeholder: "Select Namaz Habits", type: "select", options: ["Five Times Daily", "Most Prayers", "Occasionally", "Rarely"] },
                    { label: "Quran Reading Habits", value: quranReading, onChange: setQuranReading, placeholder: "Select Quran Reading Habits", type: "select", options: ["Daily", "Weekly", "Occasionally", "Rarely"] },
                  ].map((f, i) => (
                    <div key={i}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                      {f.type === "select" ? (
                        <select
                          value={f.value}
                          onChange={(e) => f.onChange(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-gray-800 appearance-none bg-white"
                        >
                          <option value="">{f.placeholder}</option>
                          {f.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type}
                          value={f.value}
                          onChange={(e) => f.onChange(e.target.value)}
                          placeholder={f.placeholder}
                          min={f.type === "number" ? "18" : undefined}
                          max={f.type === "number" ? "100" : undefined}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-gray-800"
                        />
                      )}
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">About Me</label>
                    <textarea
                      rows={4}
                      value={aboutMe}
                      onChange={(e) => setAboutMe(e.target.value)}
                      placeholder="Write a brief about yourself..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none font-medium text-gray-800"
                    />
                  </div>
                </div>

                {/* Profile Verification Section */}
                <div className="border-t border-gray-100 pt-6 mt-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-brand-600" />
                      Profile Verification
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Verify your identity to build trust with matches and receive the verified profile badge.
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Government-Issued ID Verification</p>
                      {currentUser?.kyc_status === "VERIFIED" ? (
                        <p className="text-xs text-green-700 mt-1 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Your identity has been verified successfully. You have the 'ID Verified' badge.
                        </p>
                      ) : (currentUser?.kyc_status === "PENDING" || currentUser?.kyc_status === "UNDER_REVIEW") ? (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-amber-700 font-medium">
                            Your profile identity document is currently under verification.
                          </p>
                          <p className="text-xs text-gray-500">
                            If you have any queries, please contact admin: <span className="font-semibold text-gray-700">+91 9961 896886</span>
                          </p>
                        </div>
                      ) : currentUser?.kyc_status === "REJECTED" ? (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-red-650 font-medium">
                            Your previous verification request was rejected. Please upload a clear ID document.
                          </p>
                          <p className="text-xs text-gray-500">
                            Reason: {currentUser?.kyc_rejected_reason || "Invalid document image."}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mt-0.5 max-w-md">
                          Upload your Aadhaar Card, Driving License, Passport, or Voter ID. Our administrators will verify your document.
                        </p>
                      )}
                    </div>
                    {(!currentUser?.kyc_status || currentUser?.kyc_status === "NOT_SUBMITTED" || currentUser?.kyc_status === "REJECTED") && !showKycUpload && (
                      <button
                        type="button"
                        onClick={() => setShowKycUpload(true)}
                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        Verify Now
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {showKycUpload && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-150 rounded-xl p-5 bg-white shadow-xs space-y-4 mt-4"
                    >
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <h4 className="font-bold text-sm text-gray-950">Upload Identity Documents</h4>
                        <button
                          type="button"
                          onClick={() => setShowKycUpload(false)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <IdentityVerificationForm 
                        isWizard={false}
                        onSuccess={() => {
                          setShowKycUpload(false);
                          refreshUser();
                        }}
                      />
                    </motion.div>
                  )}
                </div>
              </>
            )}

            {activeTab === "security" && (
              <>
                <h2 className="text-lg font-bold text-gray-900">Security</h2>
                <div className="space-y-5 max-w-sm">
                  {["Current Password", "New Password", "Confirm New Password"].map((label, i) => (
                    <div key={i}>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                      <input type="password" placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "notifications" && (
              <>
                <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                <div className="space-y-4">
                  {[
                    { label: "New Matches",         desc: "When someone matches your criteria"    },
                    { label: "New Messages",         desc: "When you receive a new message"       },
                    { label: "Interest Received",    desc: "When someone sends you an interest"   },
                    { label: "Profile Views",        desc: "When someone views your profile"      },
                    { label: "Promotional Updates",  desc: "Offers and subscription reminders"    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={i < 4} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-brand-600 peer-focus:ring-2 peer-focus:ring-brand-500/20 transition-all after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "privacy" && (
              <>
                <h2 className="text-lg font-bold text-gray-900">Privacy</h2>
                <div className="space-y-4">
                  {[
                    { label: "Hide my profile from search", desc: "Your profile won't appear in search results" },
                    { label: "Show profile to premium only", desc: "Only premium members can view your profile"  },
                    { label: "Hide last seen",               desc: "Others can't see when you were last active"  },
                    { label: "Blur my photo",                desc: "Photos are blurred until interest is accepted"},
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-brand-600 peer-focus:ring-2 peer-focus:ring-brand-500/20 transition-all after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                    </div>
                  ))}
                </div>

                {/* Danger Zone */}
                <div className="border-t border-red-100 pt-6 mt-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-red-650 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      Danger Zone
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Permanently delete your matrimonial profile and all associated verify documents, message logs, and match lists. This action is irreversible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-650 font-bold border border-red-200 text-xs rounded-lg transition-colors active:scale-95"
                  >
                    Delete Account
                  </button>
                </div>
              </>
            )}

            {activeTab === "feedback" && (
              <>
                <div className="border-b border-gray-50 pb-5">
                  <h2 className="text-lg font-bold text-gray-900">Share Your Feedback</h2>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Help us improve Malappuram Nikah! Your suggestions, bug reports, and appreciation help us build a better platform for everyone.
                  </p>
                </div>

                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  {feedbackSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3 text-teal-800"
                    >
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-teal-900">Feedback Submitted!</p>
                        <p className="text-[10px] text-teal-700 mt-0.5">Thank you for your valuable feedback. Our team will review it.</p>
                      </div>
                    </motion.div>
                  )}

                  {feedbackError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-red-900">Submission Failed</p>
                        <p className="text-[10px] text-red-700 mt-0.5">{feedbackError}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Category Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Feedback Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "SUGGESTION", label: "💡 Suggestion" },
                        { id: "BUG", label: "🐛 Bug Report" },
                        { id: "APPRECIATION", label: "💖 Appreciation" },
                        { id: "OTHER", label: "✨ Other" }
                      ].map((cat) => {
                        const isSelected = feedbackCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFeedbackCategory(cat.id)}
                            className={`py-3 px-2 text-center text-xs font-bold rounded-xl border transition-all duration-200 ${
                              isSelected
                                ? "bg-brand-50 border-brand-500 text-brand-700 shadow-sm"
                                : "bg-white border-gray-150 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rating Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Rate your experience</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = (feedbackRatingHover !== null ? feedbackRatingHover : feedbackRating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            onMouseEnter={() => setFeedbackRatingHover(star)}
                            onMouseLeave={() => setFeedbackRatingHover(null)}
                            className="p-1 transition-transform active:scale-90"
                          >
                            <Star
                              className={`w-8 h-8 transition-colors ${
                                isFilled
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="text-xs font-semibold text-gray-500 ml-2">
                        {feedbackRating === 5 && "Excellent! 🌟"}
                        {feedbackRating === 4 && "Very Good! 👍"}
                        {feedbackRating === 3 && "Good! 🙂"}
                        {feedbackRating === 2 && "Fair 😐"}
                        {feedbackRating === 1 && "Poor 😞"}
                      </span>
                    </div>
                  </div>

                  {/* Subject Input */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block" htmlFor="feedback-subject">Subject</label>
                    <input
                      id="feedback-subject"
                      type="text"
                      required
                      value={feedbackSubject}
                      onChange={(e) => setFeedbackSubject(e.target.value)}
                      placeholder="Summary of your feedback"
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors bg-white text-gray-900"
                    />
                  </div>

                  {/* Message Input */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block" htmlFor="feedback-message">Message Details</label>
                    <textarea
                      id="feedback-message"
                      required
                      rows={5}
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder="Please tell us details about your feedback or suggestion..."
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors bg-white text-gray-900 resize-none"
                    />
                    <div className="flex justify-between items-center text-[10px] text-gray-400 px-1">
                      <span>Minimum 10 characters</span>
                      <span>{feedbackMessage.length} characters</span>
                    </div>
                  </div>

                  {/* Submit button inside form */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={feedbackSubmitting}
                      className="w-full sm:w-auto px-6 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {feedbackSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Submitting Feedback...
                        </>
                      ) : (
                        "Submit Feedback"
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Save button */}
            {activeTab !== "feedback" && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                {saved && <span className="text-sm text-brand-600 font-medium">✓ Changes saved!</span>}
                {saveError && <span className="text-sm text-red-600 font-medium">{saveError}</span>}
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            )}
          </motion.div>
        </div>

      </div>

      {/* Account Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-xl p-6 shadow-xl border border-gray-150 space-y-4 z-10"
            >
              <div className="flex items-center gap-3 text-red-650">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-950">Delete Account Permanently?</h4>
                  <p className="text-xs text-gray-400">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 leading-relaxed">
                By deleting your account, you will lose your profile details, KYC verification status, and all matching history. Your active chat messages and expressed interests will be permanently deleted.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Permanently"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
