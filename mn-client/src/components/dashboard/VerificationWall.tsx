"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldAlert, ArrowRight, UploadCloud, LogOut } from "lucide-react";
import { handleSignOut } from "@/lib/auth";

export default function VerificationWall({ children }: { children: React.ReactNode }) {
  const { currentUser, loadingUser } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  if (loadingUser) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Handle referral-only guest accounts
  if (currentUser.status === "referral_only") {
    if (pathname !== "/dashboard/referral" && pathname !== "/dashboard/settings") {
      router.replace("/dashboard/referral");
      return null;
    }
    return <>{children}</>;
  }

  // Define verification statuses that bypass the wall
  const isVerified = currentUser.kyc_status === "VERIFIED";

  // If user has not uploaded their ID and is not on settings or profile-builder, restrict access
  if (!isVerified && pathname !== "/dashboard/settings" && pathname !== "/dashboard/profile-builder") {
    const isUnderReview = currentUser.kyc_status === "PENDING" || currentUser.kyc_status === "UNDER_REVIEW";
    const isRejected = currentUser.kyc_status === "REJECTED";

    if (isUnderReview) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-lg mx-auto space-y-6">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm mx-auto">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-gray-900 font-playfair tracking-tight">
              ID Verification Under Review
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your submitted documents are currently in the queue for review. Only administrators can approve or reject identity verification requests. You will be notified as soon as our team updates your status.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left text-xs font-semibold text-amber-900 leading-relaxed mx-auto w-full">
            ⏳ Verification usually takes less than 2 hours. If you need urgent approval, please click below to contact our support team.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              Go to Settings
            </button>
            
            <button
              onClick={handleSignOut}
              className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          <a
            href="https://wa.me/919946341443?text=Hello%20MalappuramNikah%20Support%2C%20I%20have%20submitted%20my%20ID.%20Please%20approve%20my%20verification."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-full transition-all border border-emerald-100"
          >
            💬 Request Instant Approval via WhatsApp (+91 99463 41443)
          </a>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-lg mx-auto space-y-6">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100 shadow-sm animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-gray-900 font-playfair tracking-tight">
            {isRejected ? "Verification Request Rejected" : "Government ID Verification Required"}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {isRejected ? (
              <>
                Your previously submitted identity verification request was rejected. To ensure a 100% verified, authentic Muslim Matrimony community, please re-upload a valid ID (Aadhaar / Passport) in settings to unlock platform access.
              </>
            ) : (
              <>
                To ensure a 100% verified, authentic Muslim Matrimony community, all members must verify their identity. Please upload your ID (Aadhaar / Passport) to unlock this page and access search, matches, and chat features.
              </>
            )}
          </p>
        </div>

        <div className="w-full bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-3.5 text-left">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">How to verify:</h4>
          <div className="flex items-start gap-3 text-xs font-medium text-gray-700">
            <div className="w-5 h-5 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 shrink-0 font-bold">1</div>
            <p className="leading-relaxed">Click the button below to go to Settings.</p>
          </div>
          <div className="flex items-start gap-3 text-xs font-medium text-gray-700">
            <div className="w-5 h-5 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 shrink-0 font-bold">2</div>
            <p className="leading-relaxed">Upload a clear photo of the front & back of your Aadhaar Card or Passport.</p>
          </div>
          <div className="flex items-start gap-3 text-xs font-medium text-gray-700">
            <div className="w-5 h-5 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 shrink-0 font-bold">3</div>
            <p className="leading-relaxed">Our admin team will review and verify your profile within a few hours!</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Go to Settings & Upload ID
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleSignOut}
            className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <a
          href="https://wa.me/919946341443?text=Hello%20MalappuramNikah%20Support%2C%20I%20need%20help%20with%20ID%20verification."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-full transition-all border border-emerald-100"
        >
          💬 Verify via WhatsApp Support (+91 99463 41443)
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
