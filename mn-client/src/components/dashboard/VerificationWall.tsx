"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight, Loader2 } from "lucide-react";

export default function VerificationWall({ children }: { children: React.ReactNode }) {
  const { currentUser, loadingUser } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!loadingUser && !currentUser) {
      const token = typeof window !== "undefined" ? localStorage.getItem("mn_token") : null;
      if (!token) {
        window.location.href = "/login";
      }
    }
  }, [currentUser, loadingUser]);

  if (loadingUser || (!currentUser && typeof window !== "undefined" && !localStorage.getItem("mn_token"))) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const isMale = currentUser?.gender?.toLowerCase() === "male";
  const isVerified = currentUser?.kyc_status === "VERIFIED";
  const isUnderReview = currentUser?.kyc_status === "UNDER_REVIEW" || currentUser?.kyc_status === "PENDING";
  const isAdminOrBusiness = currentUser?.isAdmin || currentUser?.role === "admin" || pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/business");
  const isBypassedPath = isAdminOrBusiness || pathname === "/dashboard/settings" || pathname === "/dashboard/profile-builder";

  // If user is male and NOT verified and not on a bypassed settings/wizard page, enforce the verification wall
  if (!isAdminOrBusiness && isMale && !isVerified && !isBypassedPath) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-xl border border-gray-150 p-8 shadow-sm space-y-6 text-center animate-pulse">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900 font-playfair">Verification Required</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            {isUnderReview 
              ? "Your identity verification request is currently under review by our administration team. We will notify you as soon as it is approved." 
              : "To maintain a secure and trustworthy community, all male members are required to complete government-issued ID verification before browsing matches."}
          </p>
        </div>

        {!isUnderReview && (
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            Complete Identity Verification <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
