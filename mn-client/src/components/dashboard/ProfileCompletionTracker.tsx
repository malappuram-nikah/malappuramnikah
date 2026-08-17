"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

export default function ProfileCompletionTracker() {
  const { completion, loading, percentage, styles, incompleteSections } = useProfileCompletion();

  if (loading || !completion) return null;

  return (
    <div className="relative overflow-hidden bg-[#026d77] rounded-xl p-4 border border-[#026d77] shadow-[0_4px_25px_-5px_rgba(2,109,119,0.15)] transition-all duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:16px_16px] opacity-10 pointer-events-none z-0" />

      <div className="relative z-10 flex items-center justify-between mb-1.5">
        <h3 className="font-bold text-white text-xs tracking-wide flex items-center gap-1.5">
          Profile Strength
          <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded-full border ${styles.text}`}>
            {styles.label}
          </span>
        </h3>
        <span className="text-base font-bold font-sans tracking-tight text-white">{percentage}%</span>
      </div>

      <div className="relative z-10 w-full h-1.5 bg-white/15 rounded-full overflow-hidden mb-3 border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="h-full rounded-full bg-white"
        />
      </div>

      {percentage < 100 ? (
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-[11px] text-teal-100/90 font-medium leading-relaxed max-w-[80%]">
            {incompleteSections[0]?.suggestion ||
              (percentage < 40
                ? "Your profile is currently sparse. Complete it to start seeing relevant matches!"
                : "You're getting closer! Complete remaining sections to unlock 3x more matches.")}
          </p>
          <Link
            href={
              incompleteSections[0]?.step
                ? `/dashboard/profile-builder?step=${incompleteSections[0].step}`
                : "/dashboard/profile-builder"
            }
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-200 hover:text-white transition-colors whitespace-nowrap"
          >
            Go to Profile Builder <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="relative z-10 flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-white/10 text-emerald-300 rounded-full flex items-center justify-center shrink-0 border border-white/10">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-white text-xs sm:text-sm">Outstanding Profile!</h4>
              <p className="text-[11px] text-teal-100/80 mt-0.5 truncate max-w-md">
                Your profile is fully complete and visible.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard/profile-builder"
              className="px-3 py-1.5 bg-white/10 border border-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
            >
              Edit Profile
            </Link>
            <Link
              href="/dashboard/matches"
              className="px-3 py-1.5 bg-white hover:bg-teal-50 text-[#026d77] text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
            >
              View Matches <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
