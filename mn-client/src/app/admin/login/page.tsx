"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";

import { API_URL } from "@/lib/config";
import { getPostAdminLoginRedirect, setToken } from "@/lib/auth-session";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const triggerNotification = (text: string, type: "success" | "error") => {
    if (type === "success") {
      setErrorMsg("");
      setSuccessMsg(text);
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      setSuccessMsg("");
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      triggerNotification("Please enter both admin email and password.", "error");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(`${API_URL}/user/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (data.success && data.accessToken) {
        setToken(data.accessToken);
        refreshAuth();
        triggerNotification("Authentication approved. Launching Command Center...", "success");

        setTimeout(() => {
          router.replace(getPostAdminLoginRedirect());
        }, 1000);
      } else {
        triggerNotification(data.message || "Invalid Admin credentials.", "error");
        setLoading(false);
      }
    } catch {
      triggerNotification("Network connection error. Please try again.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-brand-100/30 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-teal-50/40 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />

      {/* Floating Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            key="admin-login-success"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            key="admin-login-error"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-red-50 border border-red-200 text-red-800 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-xs font-semibold">{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white border border-gray-100 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center">
          <Image
            src="/logoMain-01.svg"
            alt="Malappuram Nikah"
            width={120}
            height={60}
            className="h-12 w-auto object-contain mb-6"
            priority
          />
          <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 mb-3 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Super Admin Portal</h2>
          <p className="text-xs text-gray-500 mt-1 text-center max-w-[280px]">
            Enter your admin email and password to access the platform command center.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="Enter admin email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-gray-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-brand-600/10 flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            {loading ? "Authenticating..." : "Login to Command Center"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400">
            Secure Administrator Access · Powered by Malappuram Nikah
          </p>
        </div>
      </motion.div>
    </div>
  );
}
