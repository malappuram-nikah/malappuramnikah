"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/context/AuthContext";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={null}>{children}</Suspense>
    </AuthProvider>
  );
}
