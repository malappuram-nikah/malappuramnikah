"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, EyeOff, Phone, Lock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mobile_number: countryCode + mobile,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.message || "Invalid mobile number or password");
      }

      // Store token and redirect to dashboard
      localStorage.setItem("mn_token", data.token);
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 flex-col items-center justify-center relative overflow-hidden p-12">
        {/* Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:28px_28px]" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-brand-500/40 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-brand-800/40 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 text-center">
          <Image
            src="/logoMain-01.svg"
            alt="Malappuram Nikah"
            width={180}
            height={90}
            className="mx-auto mb-8 brightness-200 h-20 w-auto object-contain"
          />
          <h2 className="text-4xl font-bold font-playfair text-white mb-4 leading-tight">
            Welcome Back
          </h2>
          <p className="text-brand-200 text-lg max-w-sm mx-auto leading-relaxed">
            Continue your journey to finding your perfect life partner. Your match could be just a click away.
          </p>

          {/* Decorative couple image */}
          <div className="mt-12 w-64 h-72 mx-auto rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=600&auto=format&fit=crop"
              alt="Happy couple"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/logoMain-01.svg"
              alt="Malappuram Nikah"
              width={140}
              height={70}
              className="h-14 w-auto object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold font-playfair text-gray-900 mb-2">Sign In</h1>
          <p className="text-gray-500 mb-10">
            New here?{" "}
            <Link href="/" className="text-brand-600 font-medium hover:underline">
              Create a free account
            </Link>
          </p>

          {error && (
            <div className="mb-6 p-4 bg-brand-50 text-brand-700 text-sm rounded-xl border border-brand-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mobile field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-28 px-3 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-gray-50 text-center"
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
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">
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
              className="w-full bg-brand-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-brand-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow flex items-center justify-center gap-2 text-base"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

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
