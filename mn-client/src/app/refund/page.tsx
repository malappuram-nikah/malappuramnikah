"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-8 border border-gray-150 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <ShieldCheck className="w-8 h-8 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-playfair">Refund Policy</h1>
            <p className="text-xs text-gray-500">Malappuram Nikah Matrimony</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
          <p>Thank you for choosing Malappuram Nikah Matrimony. We strive to provide the best matchmaking experience for our members.</p>
          <h2 className="text-sm font-bold text-gray-900">1. Membership & Subscription Plans</h2>
          <p>All premium membership and subscription fees are non-refundable once the plan is activated and matchmaking features have been accessed.</p>
          <h2 className="text-sm font-bold text-gray-900">2. Duplicate Charges & Billing Inquiries</h2>
          <p>In the event of accidental duplicate payments or payment gateway processing errors, please contact our support team at support@malappuramnikah.com or +91 99613 41443 within 7 days for verification and refund processing.</p>
          <h2 className="text-sm font-bold text-gray-900">3. Account Cancellation</h2>
          <p>Members may deactivate their profile at any time. Voluntary deactivation before plan expiration does not entitle the user to a partial refund.</p>
        </div>
      </div>
    </div>
  );
}
