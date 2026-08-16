"use client";

import { Loader2 } from "lucide-react";

export default function AuthLoadingScreen({ message = "Checking authentication..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-400">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      <p className="font-semibold mt-4 text-sm text-gray-600">{message}</p>
    </div>
  );
}
