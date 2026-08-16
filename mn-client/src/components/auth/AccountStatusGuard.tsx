"use client";

import React from "react";
import { Ban, LogOut, Mail } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { handleSignOut } from "@/lib/auth";
import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";

interface AccountRestriction {
  title: string;
  message: string;
  tone: "danger" | "warning";
}

function getAccountRestriction(user: {
  status?: string;
  last_login?: string | null;
} | null): AccountRestriction | null {
  if (!user?.status) return null;

  if (user.status === "suspended") {
    return {
      title: "Account Suspended",
      message:
        "Your account has been suspended by our administration team. You cannot access the platform until this is resolved.",
      tone: "danger",
    };
  }

  if (user.status === "in_active" && user.last_login) {
    return {
      title: "Account Deactivated",
      message:
        "Your account has been deactivated or rejected. Please contact support if you believe this is a mistake.",
      tone: "warning",
    };
  }

  return null;
}

export default function AccountStatusGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, loadingUser } = useUser();

  if (loadingUser) {
    return <AuthLoadingScreen />;
  }

  const restriction = getAccountRestriction(currentUser);
  if (!restriction) {
    return <>{children}</>;
  }

  const isDanger = restriction.tone === "danger";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-150 shadow-sm p-8 text-center space-y-6">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border ${
            isDanger
              ? "bg-red-50 text-red-600 border-red-100"
              : "bg-amber-50 text-amber-600 border-amber-100"
          }`}
        >
          <Ban className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900 font-playfair">{restriction.title}</h1>
          <p className="text-sm text-gray-500 leading-relaxed">{restriction.message}</p>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-left">
          <p className="text-xs text-gray-500 flex items-start gap-2">
            <Mail className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
            Need help? Reach out to our support team with your registered mobile number.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
