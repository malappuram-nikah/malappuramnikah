"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

import { LOCATIONS } from "@/lib/constants";
import { API_URL } from "@/lib/config";
import {
  getMobileMaxLength,
  validateEmail,
  validateMobile,
  validatePassword,
} from "@/lib/registration-validation";
import { getPostLoginRedirect, setToken } from "@/lib/auth-session";
import { useAuth } from "@/context/AuthContext";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const router = useRouter();
  const { status, refreshAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    profileFor: "",
    gender: "",
    first_name: "",
    last_name: "",
    dateOfBirth: "",
    location: "",
    caste: "",
    maritalStatus: "Never Married",
    countryCode: "+91",
    mobile: "",
    email: "",
    password: "",
    referralCode: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        setFormData((prev) => ({ ...prev, referralCode: ref.toUpperCase() }));
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen && status === "authenticated") {
      onClose();
      router.replace(getPostLoginRedirect());
    }
  }, [isOpen, status, onClose, router]);

  const updateForm = (key: string, value: string) => {
    if (key === "mobile") {
      value = value.replace(/\D/g, "").slice(0, getMobileMaxLength(formData.countryCode));
    }

    setFormData((prev) => ({ ...prev, [key]: value }));

    if (key === "mobile" || key === "password" || key === "email") {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validateStep4Fields = () => {
    const errors = {
      mobile: validateMobile(formData.countryCode, formData.mobile) || undefined,
      password: validatePassword(formData.password) || undefined,
      email: validateEmail(formData.email) || undefined,
    };

    setFieldErrors(errors);
    return !errors.mobile && !errors.password && !errors.email;
  };

  const touchField = (field: "mobile" | "password" | "email") => {
    if (field === "mobile") {
      setFieldErrors((prev) => ({
        ...prev,
        mobile: validateMobile(formData.countryCode, formData.mobile) || undefined,
      }));
    } else if (field === "password") {
      setFieldErrors((prev) => ({
        ...prev,
        password: validatePassword(formData.password) || undefined,
      }));
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        email: validateEmail(formData.email) || undefined,
      }));
    }
  };

  const nextStep = () => setStep((p) => Math.min(p + 1, 4));
  const prevStep = () => setStep((p) => Math.max(p - 1, 1));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    mobile?: string;
    password?: string;
    email?: string;
  }>({});
  const [success, setSuccess] = useState(false);

  // OTP verification state
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (showOtpScreen && !verified) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, [showOtpScreen, verified]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">This profile is for</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {["Myself", "Son", "Daughter", "Brother", "Sister", "Relative"].map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => updateForm("profileFor", rel)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${formData.profileFor === rel
                        ? "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Gender</label>
              <div className="grid grid-cols-2 gap-4">
                {["Male", "Female"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => updateForm("gender", g)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${formData.gender === g
                        ? "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Marital Status</label>
              <div className="grid grid-cols-2 gap-3">
                {["Never Married", "Divorced", "Widowed", "Awaiting Divorce"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateForm("maritalStatus", status)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${formData.maritalStatus === status
                        ? "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => updateForm("first_name", e.target.value)}
                  placeholder="First name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => updateForm("last_name", e.target.value)}
                  placeholder="Last name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <select
                value={formData.location}
                onChange={(e) => updateForm("location", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Location</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Caste / Community</label>
              <select
                value={formData.caste}
                onChange={(e) => updateForm("caste", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Community</option>
                <option value="Sunni">Sunni</option>
                <option value="Mujahid">Mujahid</option>
                <option value="Jamaat-e-Islami">Jamaat-e-Islami</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
              <div className="flex gap-2">
                <select
                  value={formData.countryCode}
                  onChange={(e) => {
                    const countryCode = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      countryCode,
                      mobile: prev.mobile.slice(0, getMobileMaxLength(countryCode)),
                    }));
                    setFieldErrors((prev) => ({ ...prev, mobile: undefined }));
                  }}
                  className="w-24 px-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white text-center"
                >
                  <option value="+91">+91 (IN)</option>
                  <option value="+971">+971 (UAE)</option>
                  <option value="+966">+966 (KSA)</option>
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formData.mobile}
                  onChange={(e) => updateForm("mobile", e.target.value)}
                  onBlur={() => touchField("mobile")}
                  placeholder={formData.countryCode === "+91" ? "10 digit number" : "9 digit number"}
                  maxLength={getMobileMaxLength(formData.countryCode)}
                  className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm ${
                    fieldErrors.mobile
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:ring-brand-500/20 focus:border-brand-500"
                  }`}
                />
              </div>
              {fieldErrors.mobile && (
                <p className="mt-1.5 text-xs text-red-600">{fieldErrors.mobile}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => updateForm("email", e.target.value)}
                onBlur={() => touchField("email")}
                placeholder="Enter your email to receive OTP"
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm ${
                  fieldErrors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-200 focus:ring-brand-500/20 focus:border-brand-500"
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateForm("password", e.target.value)}
                onBlur={() => touchField("password")}
                placeholder="Minimum 6 characters"
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm ${
                  fieldErrors.password
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-200 focus:ring-brand-500/20 focus:border-brand-500"
                }`}
              />
              {fieldErrors.password ? (
                <p className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-400">Use at least 6 characters with no spaces.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Referral Code (Optional)</label>
              <input
                type="text"
                value={formData.referralCode}
                onChange={(e) => updateForm("referralCode", e.target.value)}
                placeholder="Enter referral code"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm uppercase font-mono tracking-wider"
              />
            </div>
          </motion.div>
        );
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return Boolean(formData.profileFor && formData.gender && formData.maritalStatus);
      case 2: return formData.first_name.trim().length >= 2 && formData.last_name.trim().length >= 1 && formData.dateOfBirth;
      case 3: return formData.location && formData.caste;
      case 4:
        return (
          formData.email.trim().length > 0 &&
          !validateMobile(formData.countryCode, formData.mobile) &&
          !validatePassword(formData.password) &&
          !validateEmail(formData.email)
        );
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validateStep4Fields()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        profile_for: formData.profileFor,
        gender: formData.gender,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        mobile_number: formData.countryCode + formData.mobile,
        password: formData.password,
        location: formData.location,
        dob: formData.dateOfBirth,
        cast: formData.caste,
        marital_status: formData.maritalStatus,
        email: formData.email || undefined,
        referred_by_code: formData.referralCode || undefined
      };

      const response = await fetch(`${API_URL}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data: { success?: boolean; message?: string; otp?: string; unverified?: boolean; user?: { id?: number } };
      try {
        data = await response.json();
      } catch {
        throw new Error("Unable to reach the server. Please try again.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Registration failed. Please check your details.");
      }

      if (data.otp && typeof data.otp === "string") {
        setOtpDigits(data.otp.split(""));
      }

      if (data.user?.id != null) {
        setRegisteredUserId(data.user.id);
      }

      if (data.unverified) {
        setOtpInfo(data.message || null);
        setOtpError(null);
        setResendCooldown(30);
        setShowOtpScreen(true);
      } else {
        setOtpInfo(null);
        setSuccess(true);
        setResendCooldown(30);
        setTimeout(() => {
          setSuccess(false);
          setShowOtpScreen(true);
        }, 1500);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);

      if (/mobile/i.test(msg)) {
        setFieldErrors((prev) => ({ ...prev, mobile: msg }));
      } else if (/password/i.test(msg)) {
        setFieldErrors((prev) => ({ ...prev, password: msg }));
      } else if (/email/i.test(msg)) {
        setFieldErrors((prev) => ({ ...prev, email: msg }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otpDigits];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtpDigits(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = value;
    setOtpDigits(newOtp);
    setOtpError(null);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otpDigits.join("");
    if (otpString.length < 6) {
      setOtpError("Please enter the complete 6-digit OTP");
      return;
    }

    setIsVerifying(true);
    setOtpError(null);
    try {
      const response = await fetch(`${API_URL}/otp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.countryCode + formData.mobile,
          otpCode: otpDigits,
          userId: registeredUserId,
        })
      });

      let data: { success?: boolean; message?: string; accessToken?: string };
      try {
        data = await response.json();
      } catch {
        throw new Error("Unable to reach the server. Please try again.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Invalid OTP. Please try again.");
      }

      if (data.accessToken) {
        setToken(data.accessToken);
        refreshAuth();
      }

      setVerified(true);
      setTimeout(() => {
        onClose();
        router.replace(getPostLoginRedirect());
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OTP verification failed";
      setOtpError(msg);
      setOtpDigits(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const response = await fetch(`${API_URL}/otp/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.countryCode + formData.mobile,
        })
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to resend OTP");
      }
      if (data.otp && typeof data.otp === "string") {
        setOtpDigits(data.otp.split(""));
      }
      setResendCooldown(30);
      setOtpError(null);
      setOtpInfo(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to resend OTP. Please try again.";
      setOtpError(msg);
    }
  };

  const maskedPhone = () => {
    const phone = formData.mobile;
    if (phone.length <= 4) return phone;
    return phone.slice(0, 2) + "****" + phone.slice(-2);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* ── Verified success screen ── */}
          {verified ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center flex flex-col items-center justify-center min-h-[340px]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-5"
              >
                <ShieldCheck className="w-10 h-10" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Verified!</h2>
              <p className="text-gray-500 text-sm">Your mobile number has been verified successfully. Redirecting to your dashboard...</p>
              <div className="mt-6">
                <span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin inline-block" />
              </div>
            </motion.div>

            /* ── OTP entry screen ── */
          ) : showOtpScreen ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Verify OTP</h2>
                  <p className="text-xs font-medium text-brand-600">Enter the code sent to {formData.countryCode} {maskedPhone()}</p>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* OTP Body */}
              <div className="p-6 flex flex-col items-center">
                <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-7 h-7 text-brand-600" />
                </div>

                <p className="text-sm text-gray-500 text-center mb-6">
                  We&apos;ve sent a 6-digit verification code to your <strong className="text-gray-900 font-semibold">Email Inbox ({formData.email})</strong>. Enter it below to verify your account.
                </p>

                {otpInfo && (
                  <div className="w-full mb-5 p-3 bg-blue-50 text-blue-700 text-sm rounded-xl border border-blue-100 text-center">
                    {otpInfo}
                  </div>
                )}

                {otpError && (
                  <div className="w-full mb-5 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 text-center">
                    {otpError}
                  </div>
                )}

                {/* OTP input boxes */}
                <div className="flex gap-1.5 sm:gap-3 mb-6 sm:mb-8 justify-center w-full">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpInputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-semibold rounded-xl border-2 transition-all focus:outline-none shrink-0 ${digit
                          ? "border-brand-500 bg-brand-50/50 text-brand-700"
                          : "border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                        }`}
                    />
                  ))}
                </div>

                {/* Resend */}
                <p className="text-sm text-gray-400 mb-6">
                  Didn&apos;t receive the code?{" "}
                  {resendCooldown > 0 ? (
                    <span className="text-gray-500 font-medium">Resend in {resendCooldown}s</span>
                  ) : (
                    <button onClick={handleResendOtp} className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>

              {/* Verify button */}
              <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 shrink-0">
                <button
                  onClick={handleVerifyOtp}
                  disabled={otpDigits.some((d) => !d) || isVerifying}
                  className="w-full bg-brand-600 text-white font-medium py-3.5 px-4 rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 shadow-sm flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Verify & Continue
                    </>
                  )}
                </button>
              </div>
            </>

            /* ── Registration success flash ── */
          ) : success ? (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4"
              >
                <CheckCircle2 className="w-8 h-8" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
              <p className="text-gray-500 text-sm">An OTP has been sent to your mobile number. Preparing verification...</p>
              <div className="mt-4">
                <span className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin inline-block" />
              </div>
            </div>

            /* ── Registration form steps ── */
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  {step > 1 && (
                    <button onClick={prevStep} className="p-1 -ml-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Create Account</h2>
                    <p className="text-xs font-medium text-brand-600">Step {step} of 4</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 bg-gray-100 shrink-0">
                <motion.div
                  className="h-full bg-brand-500"
                  initial={{ width: `${((step - 1) / 4) * 100}%` }}
                  animate={{ width: `${(step / 4) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto">
                {error && (
                  <div className="mb-4 p-3 bg-brand-50 text-brand-700 text-sm rounded-xl border border-brand-100">
                    {error}
                  </div>
                )}
                <AnimatePresence mode="wait">
                  <motion.div key={step}>
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 shrink-0 flex items-center gap-4">
                {step < 4 ? (
                  <button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="w-full bg-brand-600 text-white font-medium py-3.5 px-4 rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 shadow-sm"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!isStepValid() || isSubmitting}
                    className="w-full bg-brand-600 text-white font-medium py-3.5 px-4 rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 shadow-sm flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Complete Registration
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
