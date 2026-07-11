"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getProfileCompletionStatus, ProfileSection } from "@/lib/profile-utils";
import { useUser } from "@/context/UserContext";

export default function ProfileCompletionTracker() {
  const [completionPercent, setCompletionPercent] = useState(0);
  const [missingSections, setMissingSections] = useState<ProfileSection[]>([]);
  const { currentUser: user, loadingUser } = useUser();

  useEffect(() => {
    if (loadingUser) return;

    const { percent, missing } = getProfileCompletionStatus(user);
    setCompletionPercent(percent);
    setMissingSections(missing);
  }, [user, loadingUser]);

  if (loadingUser) return null;

  // Determine profile strength
  let strength = "Weak";
  let strengthColor = "text-red-500 bg-red-50 border-red-200";
  let barColor = "bg-red-500";
  
  if (completionPercent >= 80) {
    strength = "Excellent";
    strengthColor = "text-green-600 bg-green-50 border-green-200";
    barColor = "bg-green-500";
  } else if (completionPercent >= 60) {
    strength = "Strong";
    strengthColor = "text-brand-600 bg-brand-50 border-brand-200";
    barColor = "bg-brand-500";
  } else if (completionPercent >= 40) {
    strength = "Average";
    strengthColor = "text-yellow-600 bg-yellow-50 border-yellow-200";
    barColor = "bg-yellow-500";
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          Profile Strength
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${strengthColor}`}>
            {strength}
          </span>
        </h3>
        <span className={`text-xl font-bold ${strengthColor.split(' ')[0]}`}>{completionPercent}%</span>
      </div>
      
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completionPercent}%` }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>

      {completionPercent < 100 ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {completionPercent < 40 
              ? "Your profile is almost empty. Complete it to start seeing relevant matches!"
              : "You're getting there! Complete these remaining sections to unlock 3x more matches."}
          </p>
          
          {/* Show top 2 missing sections as suggestions */}
          {missingSections.slice(0, 2).map((section, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{section.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{section.suggestion}</p>
                </div>
              </div>
              <Link 
                href={`/dashboard/profile-builder?step=${section.step}`} 
                className="shrink-0 px-4 py-1.5 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors"
              >
                Complete
              </Link>
            </div>
          ))}

          {missingSections.length > 2 && (
            <div className="flex items-center justify-center mt-2 mb-1">
              <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
                + {missingSections.length - 2} more section{missingSections.length - 2 !== 1 ? 's' : ''} remaining
              </span>
            </div>
          )}

          <Link href="/dashboard/profile-builder" className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline">
            Go to Profile Builder <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-gray-900">Outstanding Profile!</h4>
          <p className="text-sm text-gray-500 mt-1">
            Your profile is 100% complete. You are now fully visible to your best matches.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <Link href="/dashboard/profile-builder" className="inline-flex items-center gap-1 text-xs font-semibold px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors shadow-sm">
              Edit Full Profile
            </Link>
            <Link href="/dashboard/matches" className="inline-flex items-center gap-1 text-xs font-semibold px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm">
              View AI Matches <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
