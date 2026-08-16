"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useClientMounted } from "@/hooks/useClientMounted";
import { setReturnUrl } from "@/lib/auth-session";
import AuthLoadingScreen from "./AuthLoadingScreen";

/**
 * Requires a normal (non-admin) authenticated session for user dashboard routes.
 * Admins are redirected to the admin panel.
 */
export default function UserRouteGuard({ children }: { children: React.ReactNode }) {
  const { status, isAdmin } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mounted = useClientMounted();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && isAdmin) {
      router.replace("/admin");
      return;
    }

    if (status !== "unauthenticated") return;

    const fullPath = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    setReturnUrl(fullPath);
    router.replace("/login");
  }, [status, isAdmin, pathname, searchParams, router]);

  if (!mounted || status === "loading") {
    return <AuthLoadingScreen />;
  }

  if (status === "unauthenticated") {
    return <AuthLoadingScreen message="Redirecting to login..." />;
  }

  if (isAdmin) {
    return <AuthLoadingScreen message="Redirecting to admin panel..." />;
  }

  return <>{children}</>;
}
