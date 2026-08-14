"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Multi-step state: 1 = Email Input, 2 = Verify OTP, 3 = Reset Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form inputs
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Resend timer countdown
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Step 1: Request Password Reset OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError("Please enter your registered mobile number or email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDevOtpHint(null);

    try {
      const res = await fetch(`${API_URL}/user/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send reset code. Please check your email.");
      }

      setSuccessMsg(data.message || "Verification code sent to your email.");
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }
      setResendTimer(60);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError("Please enter the verification code sent to your email.");
      return;
    }
    setError(null);
    setStep(3);
  };

  // Step 3: Reset Password Submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify your new password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/user/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reset password. Please check your code and try again.");
      }

      setStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP trigger
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setError(null);
    setDevOtpHint(null);

    try {
      const res = await fetch(`${API_URL}/user/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to resend OTP.");

      setSuccessMsg("A new verification code has been sent to your email.");
      if (data.devOtp) setDevOtpHint(data.devOtp);
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-150 shadow-xl p-8 sm:p-10 relative overflow-hidden">
        
        {/* Top brand accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#026d77] via-[#0b3c49] to-brand-600" />

        {/* Logo Header */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logoMain-01.svg"
            alt="Malappuram Nikah"
            width={140}
            height={70}
            className="h-14 w-auto object-contain"
          />
        </div>

        {/* Step indicator breadcrumbs */}
        {step !== 4 && (
          <div className="flex items-center justify-between mb-8 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-xs">
            <span className={`font-semibold flex items-center gap-1.5 ${step === 1 ? "text-brand-600" : "text-gray-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-600"}`}>1</span>
              Email
            </span>
            <div className="h-0.5 w-6 bg-gray-200" />
            <span className={`font-semibold flex items-center gap-1.5 ${step === 2 ? "text-brand-600" : "text-gray-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-600"}`}>2</span>
              Verify
            </span>
            <div className="h-0.5 w-6 bg-gray-200" />
            <span className={`font-semibold flex items-center gap-1.5 ${step === 3 ? "text-brand-600" : "text-gray-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-600"}`}>3</span>
              Reset
            </span>
          </div>
        )}

        {/* Error notification banner */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-start gap-2"
            >
              <div className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">!</div>
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && !error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-3.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {devOtpHint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-3 bg-amber-50 text-amber-900 text-xs rounded-xl border border-amber-200 flex items-center justify-between"
            >
              <span>🔑 Verification Code:</span>
              <span className="font-mono font-bold text-sm tracking-wider bg-amber-200/80 px-2 py-0.5 rounded text-amber-950">{devOtpHint}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── STEP 1: Enter Email ─── */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold font-playfair text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Enter your registered mobile number or email address and we'll send a 6-digit verification code to reset your password.
            </p>

            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Mobile Number or Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Mobile number (+91...) or email address"
                    required
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending Code...
                  </>
                ) : (
                  <>
                    Send Reset Code <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-600 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 2: Verify OTP Code ─── */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold font-playfair text-gray-900 mb-2">Check Your Email</h1>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              We sent a 6-digit verification code to <span className="font-semibold text-gray-900">{email}</span>.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">6-Digit Reset Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit code"
                    required
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-mono tracking-widest text-center text-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-sm"
              >
                Verify Code <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs">
              <button
                onClick={() => setStep(1)}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change Email
              </button>

              <button
                onClick={handleResend}
                disabled={resendTimer > 0 || isLoading}
                className={`flex items-center gap-1.5 font-bold ${
                  resendTimer > 0 ? "text-gray-400 cursor-not-allowed" : "text-brand-600 hover:underline"
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 3: Enter New Password ─── */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold font-playfair text-gray-900 mb-2">Reset Password</h1>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Create a new secure password for your account.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating Password...
                  </>
                ) : (
                  <>
                    Update Password <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ─── STEP 4: Success View ─── */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h1 className="text-2xl font-bold font-playfair text-gray-900 mb-2">Password Reset!</h1>
            <p className="text-xs text-gray-500 mb-8 leading-relaxed">
              Your password has been successfully updated. You can now log in with your new credentials.
            </p>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition-all text-sm active:scale-[0.98]"
            >
              Sign In to Your Account <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

      </div>
    </div>
  );
}
