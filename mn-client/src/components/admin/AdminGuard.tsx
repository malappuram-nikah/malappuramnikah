"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldX, AlertCircle } from "lucide-react";
import { AdminApiError, adminApi } from "@/lib/admin-api";
import { useAuth } from "@/context/AuthContext";
import { clearSession, getToken } from "@/lib/auth-session";
import { useClientMounted } from "@/hooks/useClientMounted";
import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";

type GuardPhase = "checking" | "authorized" | "denied" | "error";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, isAdmin } = useAuth();
  const mounted = useClientMounted();
  const [phase, setPhase] = useState<GuardPhase>("checking");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!mounted || status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/admin/login");
      return;
    }

    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }

    let cancelled = false;

    async function verify() {
      const token = getToken();
      if (!token) {
        router.replace("/admin/login");
        return;
      }

      setPhase("checking");
      setErrorMsg("");

      try {
        await adminApi.getAdminProfile();
        if (!cancelled) setPhase("authorized");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AdminApiError) {
          if (err.status === 401) {
            clearSession();
            router.replace("/admin/login");
            return;
          }
          if (err.status === 403) {
            setPhase("denied");
            return;
          }
        }
        setErrorMsg(
          err instanceof Error ? err.message : "Could not verify admin access. Please try again."
        );
        setPhase("error");
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [router, status, isAdmin, mounted]);

  if (!mounted || status === "loading") {
    return <AuthLoadingScreen message="Checking authentication..." />;
  }

  if (status === "unauthenticated") {
    return <AuthLoadingScreen message="Redirecting to admin login..." />;
  }

  if (!isAdmin) {
    return <AuthLoadingScreen message="Redirecting to dashboard..." />;
  }

  if (phase === "checking") {
    return <AuthLoadingScreen message="Verifying admin access..." />;
  }

  if (phase === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gray-50">
        <ShieldX className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-gray-900">Access Denied</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          You do not have permission to access the admin panel.
        </p>
        <button
          type="button"
          onClick={() => router.replace("/dashboard")}
          className="mt-6 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gray-50">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-lg font-bold text-gray-900">Admin Verification Failed</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">{errorMsg}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => router.replace("/admin/login")}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
          >
            Admin Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
