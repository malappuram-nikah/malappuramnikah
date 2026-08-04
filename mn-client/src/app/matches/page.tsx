"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function MatchesPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("mn_token");
    if (token) {
      router.replace("/dashboard/matches");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/logoMain-01.svg"
            alt="Malappuram Nikah"
            width={130}
            height={65}
            className="h-12 w-auto"
          />
        </div>
        <h1 className="text-2xl font-bold font-playfair text-gray-900 mb-3">
          Find Your Perfect Match
        </h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Sign in to browse AI-powered matches tailored to your preferences and values.
        </p>
        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center gap-2 bg-[#026d77] hover:bg-[#03828e] text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.99] text-sm"
        >
          Sign In to View Matches →
        </Link>
        <p className="mt-4 text-xs text-gray-400">
          Don't have an account?{" "}
          <Link href="/" className="text-[#026d77] font-medium hover:underline">
            Register free
          </Link>
        </p>
      </div>
    </div>
  );
}
