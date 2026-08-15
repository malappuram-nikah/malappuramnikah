"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, Zap, Shield, Star, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { API_URL } from "@/lib/config";

const plans = [
  {
    name: "Silver",
    price: "₹499",
    period: "/3 months",
    color: "bg-gray-50 border-gray-200",
    headerColor: "bg-gray-100",
    textColor: "text-gray-700",
    btnClass: "bg-gray-800 text-white hover:bg-gray-700",
    features: [
      "View 50 profiles/month",
      "Send 10 interests/month",
      "Basic search filters",
      "Chat with matches",
    ],
  },
  {
    name: "Gold",
    price: "₹999",
    period: "/6 months",
    color: "bg-brand-600 border-brand-600",
    headerColor: "bg-brand-700",
    textColor: "text-white",
    btnClass: "bg-white text-brand-700 hover:bg-brand-50",
    badge: "Most Popular",
    features: [
      "Unlimited profile views",
      "Unlimited interests",
      "Advanced search filters",
      "Priority in search results",
      "Dedicated matchmaker",
      "WhatsApp number reveal",
    ],
  },
  {
    name: "Platinum",
    price: "₹1,799",
    period: "/12 months",
    color: "bg-gray-50 border-gray-200",
    headerColor: "bg-gray-100",
    textColor: "text-gray-700",
    btnClass: "bg-brand-600 text-white hover:bg-brand-700",
    features: [
      "Everything in Gold",
      "Family contact details",
      "Personal matchmaker call",
      "Verified badge on profile",
      "Premium profile boost",
    ],
  },
];

export default function PremiumPage() {
  const router = useRouter();
  const { currentUser, loadingUser } = useUser();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (loadingUser) return;
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [currentUser, loadingUser, router]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-3 text-brand-500" />
        <p className="font-semibold text-sm">Loading launch offers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      {/* Launch Day Free Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-brand-600 via-brand-700 to-teal-700 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden text-center"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/30 text-amber-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-300" /> Launch Celebration Special
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold font-playfair tracking-tight">
            100% FREE Access for All Members! 🎉
          </h1>
          
          <p className="text-brand-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            To celebrate the official launch of <strong className="text-white">Malappuram Nikah</strong>, paid premium plans are currently disabled. All matching, chatting, search filters, and profile details are <strong>completely FREE</strong> for all registered users!
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push("/dashboard/matches")}
              className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold text-sm rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Crown className="w-5 h-5 text-amber-800" />
              Explore Free Matches
            </button>
          </div>
        </div>
      </motion.div>

      {/* Included Free Features Grid */}
      <div className="bg-white rounded-3xl border border-gray-150 p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 font-playfair text-center">
          Features Currently Unlocked For You
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            "Unlimited Profile Search & Browsing",
            "Direct Interest Expressing & Mutual Acceptances",
            "Real-time Chat with Accepted Matches",
            "High-Quality Profile Photo Access",
            "Detailed Religious & Caste Preferences Filter",
            "Instant PDF Biodata Download"
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Guarantee */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Shield, title: "100% Verified Profiles", desc: "Monitored community safety" },
          { icon: Zap,    title: "Instant Match Delivery",  desc: "Zero waiting period" },
          { icon: Star,   title: "No Hidden Charges",      desc: "Free launch guarantee" },
        ].map((b, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
              <b.icon className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{b.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
