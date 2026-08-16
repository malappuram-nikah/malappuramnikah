"use client";

import { Suspense } from "react";
import UserRouteGuard from "@/components/auth/UserRouteGuard";
import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";

export default function DashboardProtectedShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      <UserRouteGuard>{children}</UserRouteGuard>
    </Suspense>
  );
}
