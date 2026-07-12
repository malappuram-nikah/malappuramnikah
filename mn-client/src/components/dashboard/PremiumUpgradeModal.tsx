"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function PremiumUpgradeModal({ isOpen, onClose, featureName = "this feature" }: PremiumUpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header Graphic */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={onClose}
                className="p-1.5 bg-black/20 hover:bg-black/30 rounded-full text-white transition-colors backdrop-blur-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner">
              <Crown className="w-8 h-8 text-amber-100" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-playfair">Premium Access Required</h3>
            <p className="text-amber-100 text-sm">
              Upgrade your plan to unlock {featureName} and accelerate your partner search.
            </p>
          </div>

          {/* Benefits */}
          <div className="p-6 md:p-8 bg-gray-50/50">
            <ul className="space-y-4 mb-8">
              {[
                "View verified contact numbers directly",
                "Compare multiple profiles side-by-side",
                "Get priority placement in search results",
                "Access advanced matchmaking filters",
              ].map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3">
              <Link 
                href="/dashboard/premium" 
                onClick={onClose}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                View Premium Plans <Crown className="w-4 h-4" />
              </Link>
              <button 
                onClick={onClose}
                className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
