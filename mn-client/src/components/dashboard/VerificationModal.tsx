"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, ArrowRight, UploadCloud, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  kycStatus?: string;
}

export default function VerificationModal({
  isOpen,
  onClose,
  title = "Identity Verification Required",
  description = "To ensure a 100% verified, authentic Muslim Matrimony community, all members (both Male and Female) must verify their ID profile before expressing interest, connecting, or starting a conversation.",
  kycStatus,
}: VerificationModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const isUnderReview = kycStatus === "UNDER_REVIEW" || kycStatus === "PENDING";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-100 text-center space-y-5"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Header */}
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 border border-brand-100 mx-auto shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900 font-playfair">{title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          </div>

          {/* Benefits checklist */}
          <div className="bg-gray-50 rounded-xl p-3.5 space-y-2 text-left text-xs font-semibold text-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Send & receive unlimited interests</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Unlock direct mutual chat messaging</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Get the official Verified Member Badge 🛡️</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 space-y-2">
            {isUnderReview ? (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl border border-amber-200">
                ⏳ Your ID document is under review by Admin. You will be verified shortly!
              </div>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  router.push("/dashboard/settings");
                }}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Government ID (Aadhaar / Passport)
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-800 font-semibold transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
