"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-8 border border-gray-150 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <ShieldCheck className="w-8 h-8 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-playfair">Terms of Service</h1>
            <p className="text-xs text-gray-500">Malappuram Nikah Matrimony</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
          <p>Welcome to Malappuram Nikah Matrimony. By accessing or using our platform, you agree to comply with and be bound by these Terms of Service.</p>
          <h2 className="text-sm font-bold text-gray-900">1. Account Eligibility & Verification</h2>
          <p>All members must be legally eligible to marry and must submit valid government-issued ID proof (Aadhaar / Passport) to participate in active matchmaking, interests, and chat.</p>
          <h2 className="text-sm font-bold text-gray-900">2. Code of Conduct</h2>
          <p>Members agree to maintain respect, authenticity, and Islamic decorum in all interactions. Misrepresentation, harassment, or inappropriate conduct will result in immediate suspension.</p>
        </div>
      </div>
    </div>
  );
}
