"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-gray-100">
        <div className="flex justify-center mb-6">
          <Image
            src="/logoMain-01.svg"
            alt="Malappuram Nikah"
            width={130}
            height={65}
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold font-playfair text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          We encountered an issue loading this section. You can refresh or return to the home page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
