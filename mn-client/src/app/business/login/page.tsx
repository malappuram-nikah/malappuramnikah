"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { API_URL } from "@/lib/config";
import { setToken } from "@/lib/auth-session";

export default function BusinessLoginPage() {
  const router = useRouter();
  const [contactNumber, setContactNumber] = useState("+91 9900112233"); // Default preset for photographer
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const triggerNotification = (text: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccessMsg(text);
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactNumber) {
      triggerNotification("Please enter your registered contact number.", "error");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Fetch live registered vendors from the backend B2B store
      const res = await fetch(`${API_URL}/user/admin/store`);
      const data = await res.json();

      if (data.success && data.store) {
        const vendorsList = data.store.vendors || [];
        // Normalize search matching (ignoring spacing / dial codes)
        const cleanSearch = contactNumber.replace(/[\s\-\+]/g, "");
        
        const matchedVendor = vendorsList.find((v: any) => 
          v.contact.replace(/[\s\-\+]/g, "").includes(cleanSearch) ||
          cleanSearch.includes(v.contact.replace(/[\s\-\+]/g, ""))
        );

        if (matchedVendor) {
          triggerNotification(`Welcome back, ${matchedVendor.name}! Logging into B2B Business Hub...`, "success");
          
          // Store dynamic mock token and session details to localStorage
          setToken("mock_admin_token_sinan"); // Sinan is admin, allowing access to business hub
          localStorage.setItem("b2b_vendor_session", JSON.stringify(matchedVendor));

          setTimeout(() => {
            router.push("/dashboard/business");
          }, 1500);
        } else {
          triggerNotification("Contact number not registered under any B2B vendor. Please register first!", "error");
        }
      } else {
        triggerNotification("Could not retrieve B2B registry from database.", "error");
      }
    } catch (err) {
      triggerNotification("Failed to connect to B2B registry server.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-gray-100">
      {/* Cinematic Golden Accents */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-yellow-500/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-amber-500/5 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />

      {/* Floating Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-red-950/80 border border-red-500/30 text-red-300 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-xs font-semibold">{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-gray-900/40 border border-gray-800 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 backdrop-blur-xl"
      >
        <div className="flex flex-col items-center">
          <Image
            src="/logoMain-01.svg"
            alt="Malappuram Nikah"
            width={120}
            height={60}
            className="h-12 w-auto object-contain mb-6 filter invert brightness-200"
            priority
          />
          <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500 mb-3 shadow-inner border border-yellow-500/20">
            <Briefcase className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
            B2B Creators Login <Sparkles className="w-4 h-4 text-yellow-500" />
          </h2>
          <p className="text-xs text-gray-400 mt-1 text-center max-w-[280px]">
            Access shoot orders, commission margins, and invitations CMS.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Registered Contact Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. +91 9900112233"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full px-4 py-3 bg-gray-950/40 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all font-semibold text-white placeholder-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-50 text-black text-xs font-bold rounded-2xl transition-all shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            {loading ? "Authenticating..." : "Authenticate Creative Vendor"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            Not registered as a platform vendor?{" "}
            <Link href="/business/register" className="text-yellow-500 hover:text-yellow-400 font-bold transition-colors">
              Sign Up B2B
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
