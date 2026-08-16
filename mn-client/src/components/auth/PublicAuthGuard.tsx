"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useClientMounted } from "@/hooks/useClientMounted";
import {
  getPostAdminLoginRedirect,
  getPostLoginRedirect,
} from "@/lib/auth-session";
import AuthLoadingScreen from "./AuthLoadingScreen";

type PublicAuthMode = "member" | "admin";

/**
 * Prevents authenticated users from accessing login/register pages.
 * Shows loading state until auth is resolved to avoid flash.
 */
export default function PublicAuthGuard({
  children,
  mode = "member",
}: {
  children: React.ReactNode;
  mode?: PublicAuthMode;
}) {
  const { status, isAdmin } = useAuth();
  const router = useRouter();
  const mounted = useClientMounted();

  useEffect(() => {
    if (status !== "authenticated") return;

    if (mode === "admin") {
      if (isAdmin) {
        router.replace(getPostAdminLoginRedirect());
      } else {
        router.replace("/dashboard");
      }
      return;
    }

    // Member auth pages — redirect logged-in users away
    if (isAdmin) {
      router.replace("/admin");
    } else {
      router.replace(getPostLoginRedirect());
    }
  }, [status, isAdmin, mode, router]);

  if (!mounted || status === "loading") {
    return <AuthLoadingScreen />;
  }

  if (status === "authenticated") {
    return <AuthLoadingScreen message="Redirecting..." />;
  }

  return <>{children}</>;
}
