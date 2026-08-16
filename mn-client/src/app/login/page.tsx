"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Phone, Lock, ArrowRight, KeyRound, MessageSquare, ShieldCheck, RefreshCw, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { getPostLoginRedirect, setToken } from "@/lib/auth-session";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();

  // Login Mode: "password" or "otp"
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");

  // Form Inputs
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [countryCode, setCountryCode] = useState("+91");

  // State
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Password Login Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mobile_number: countryCode + mobile.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.message || "Invalid mobile number or password");
      }

      setToken(data.token);
      refreshAuth();
      router.replace(getPostLoginRedirect());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Send Handler (Step 1 of OTP Login)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim()) {
      setError("Please enter a valid mobile number.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    setDevOtpHint(null);

    try {
      const fullPhone = countryCode + mobile.trim();
      const res = await fetch(`${API_URL}/otp/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send OTP. Please check your mobile number.");
      }

      setOtpSent(true);
      setSuccessMsg(data.message || "Verification code sent to your WhatsApp / Phone.");
      if (data.otp) setDevOtpHint(String(data.otp));
    } catch (err: any) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Verify Handler (Step 2 of OTP Login)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fullPhone = countryCode + mobile.trim();
      const res = await fetch(`${API_URL}/otp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: fullPhone,
          otpCode: otp.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || (!data.accessToken && !data.token)) {
        throw new Error(data.message || "Invalid or expired OTP code.");
      }

      const authToken = data.accessToken || data.token;
      setToken(authToken);
      refreshAuth();
      router.replace(getPostLoginRedirect());
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-150 shadow-xl p-8 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/logoMain-01.svg"
              alt="Malappuram Nikah"
              width={140}
              height={70}
              className="h-14 w-auto object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold font-playfair text-gray-900 mb-1">Sign In</h1>
          <p className="text-gray-500 mb-6 text-sm">
            New here?{" "}
            <Link href="/" className="text-brand-600 font-medium hover:underline">
              Create a free account
            </Link>
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginMode("password");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                loginMode === "password"
                  ? "bg-white text-brand-700 shadow-sm font-bold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Password
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode("otp");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                loginMode === "otp"
                  ? "bg-white text-brand-700 shadow-sm font-bold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-brand-600" /> Email OTP
            </button>
          </div>

          {/* Feedback Banners */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-150"
              >
                {error}
              </motion.div>
            )}

            {successMsg && !error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200"
              >
                {successMsg}
              </motion.div>
            )}

            {devOtpHint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-3 bg-amber-50 text-amber-900 text-xs rounded-xl border border-amber-200 flex items-center justify-between font-mono"
              >
                <span>🔑 OTP Hint:</span>
                <span className="font-bold tracking-wider text-sm bg-amber-200/80 px-2 py-0.5 rounded">{devOtpHint}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── PASSWORD LOGIN FORM ─── */}
          {loginMode === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {/* Mobile field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Mobile Number</label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-28 px-3 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-gray-50 text-center font-medium"
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+971">+971 (UAE)</option>
                    <option value="+966">+966 (KSA)</option>
                  </select>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Enter mobile number"
                      required
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Password</label>
                  <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
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

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !mobile || !password}
                className="w-full bg-brand-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-brand-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow flex items-center justify-center gap-2 text-sm mt-2"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ─── EMAIL OTP LOGIN FORM ─── */}
          {loginMode === "otp" && (
            <div className="space-y-5">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Registered Email or Mobile</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="Enter registered email or mobile number"
                        required
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !mobile.trim()}
                    className="w-full bg-brand-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-brand-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow flex items-center justify-center gap-2 text-sm"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Email OTP
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">6-Digit Verification Code</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter 6-digit OTP"
                        required
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono tracking-widest text-center text-lg font-bold text-gray-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.length < 4}
                    className="w-full bg-brand-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-brand-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow flex items-center justify-center gap-2 text-sm"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify & Sign In
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setError(null);
                      }}
                      className="text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Change Number
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="text-brand-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} /> Resend OTP
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <p className="mt-8 text-center text-xs text-gray-400">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-brand-600">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-brand-600">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
