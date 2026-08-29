"use client";

import { motion } from "framer-motion";
import { Sparkles, Radar, Search, Heart, ShieldCheck, Zap, Brain, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AiMatchesPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 pb-12 relative max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100/80">
            <Sparkles className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-playfair text-gray-900 flex items-center gap-2.5">
              AI Matches
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Intelligent Muslim Matrimonial Recommendations</p>
          </div>
        </div>
      </div>

      {/* Main Coming Soon Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="bg-gradient-to-b from-white via-brand-50/20 to-amber-50/20 border border-gray-150 rounded-2xl p-8 md:p-12 shadow-sm relative overflow-hidden text-center"
      >
        {/* Subtle Background Glow Elements */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider">Coming Soon</span>
          </div>

          {/* Main Visual Illustration / Icon */}
          <div className="flex justify-center py-2">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-tr from-brand-600 to-amber-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-600/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <Radar className="w-12 h-12 animate-pulse" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center text-amber-600">
                <Brain className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Core Copy */}
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold font-playfair text-gray-900 tracking-tight">
              AI-powered matchmaking is coming soon.
            </h2>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed font-normal">
              We are currently enhancing our intelligent recommendation algorithms to deliver hyper-accurate, deeply compatible matrimonial suggestions based on shared religious values, family background, personality sync, and lifestyle goals.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.push("/dashboard/search")}
              className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Search className="w-4 h-4" />
              Explore Matches in Search
            </button>

            <button
              onClick={() => router.push("/dashboard/interests?tab=favorites")}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Heart className="w-4 h-4 text-brand-600" />
              View Shortlisted Favourites
            </button>
          </div>
        </div>

        {/* Feature Preview Cards Grid */}
        <div className="mt-12 pt-10 border-t border-gray-150 grid sm:grid-cols-3 gap-4 text-left relative z-10">
          <div className="p-4 rounded-xl bg-white/80 border border-gray-150 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 mb-3">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 mb-1">Value & Deen Alignment</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Deep analysis of religious values, practice, and community compatibility.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/80 border border-gray-150 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
              <Brain className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 mb-1">Smart Personality Sync</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Personality matching algorithms to connect complementary communication styles.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/80 border border-gray-150 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 mb-1">Verified Pious Focus</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Quality-first recommendation engine prioritizing verified matrimonial profiles.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
