"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { Loader2 } from "lucide-react";

export default function VerificationWall({ children }: { children: React.ReactNode }) {
  const { currentUser, loadingUser } = useUser();

  if (loadingUser || !currentUser) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // Open browsing for all users — action-level verification modal handles interactions
  return <>{children}</>;
}
