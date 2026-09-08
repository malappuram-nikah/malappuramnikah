"use client";

import Image from "next/image";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex items-center justify-center p-4 font-sans antialiased text-gray-900">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100">
          <div className="flex justify-center mb-6">
            <Image
              src="/logoMain-01.svg"
              alt="Malappuram Nikah"
              width={140}
              height={70}
              className="h-11 w-auto object-contain"
            />
          </div>

          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to load page
          </h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Please reload to try again.
          </p>

          <button
            onClick={() => reset()}
            className="w-full bg-[#026d77] hover:bg-[#025f68] text-white text-xs font-semibold py-3.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
