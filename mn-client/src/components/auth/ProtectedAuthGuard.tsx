"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useClientMounted } from "@/hooks/useClientMounted";
import { setReturnUrl } from "@/lib/auth-session";
import AuthLoadingScreen from "./AuthLoadingScreen";

function loginPathFor(pathname: string): string {
  return pathname.startsWith("/dashboard/admin") ? "/admin/login" : "/login";
}

/**
 * Requires authentication for dashboard routes.
 * Preserves intended destination for post-login redirect.
 */
export default function ProtectedAuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mounted = useClientMounted();

  useEffect(() => {
    if (status !== "unauthenticated") return;

    const fullPath = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    setReturnUrl(fullPath);
    router.replace(loginPathFor(pathname));
  }, [status, pathname, searchParams, router]);

  if (!mounted || status === "loading") {
    return <AuthLoadingScreen />;
  }

  if (status === "unauthenticated") {
    return <AuthLoadingScreen message="Redirecting to login..." />;
  }

  return <>{children}</>;
}
