"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-8 border border-gray-150 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <ShieldCheck className="w-8 h-8 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-playfair">Privacy Policy</h1>
            <p className="text-xs text-gray-500">Malappuram Nikah Matrimony</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
          <p>Your privacy and safety are paramount. We strictly safeguard all personal details, profile photos, and verification documents.</p>
          <h2 className="text-sm font-bold text-gray-900">1. Data Encryption & Storage</h2>
          <p>All sensitive information, passwords, and verification documents are encrypted and stored in secure PostgreSQL cloud infrastructure.</p>
          <h2 className="text-sm font-bold text-gray-900">2. Privacy Controls</h2>
          <p>You have full control over your contact details and photos. Contact details are never publicly displayed and are accessible only to verified, mutual matches.</p>
        </div>
      </div>
    </div>
  );
}
