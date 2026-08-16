"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Crown, Zap, Heart, Shield } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/logoMain-01.svg"
            alt="Malappuram Nikah"
            width={120}
            height={60}
            className="h-10 w-auto"
          />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Log In
          </Link>
          <Link href="/?register=true" className="text-sm font-medium bg-[#026d77] text-white px-5 py-2.5 rounded-xl hover:bg-[#03828e] transition-all shadow-sm">
            Get Started
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="py-14 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-14 h-14 bg-[#026d77]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Crown className="w-7 h-7 text-[#026d77]" />
          </div>
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4 inline-block">
            Launch Special Offer 🎉
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-playfair text-gray-900 mb-4">
            100% Free Access During Launch!
          </h1>
          <p className="text-gray-500 text-base max-w-lg mx-auto leading-relaxed">
            To celebrate our launch, all premium features, profile search, chatting, and matchmaking are <strong>completely FREE</strong> for all users!
          </p>
        </motion.div>
      </div>

      {/* Free Features Highlights */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-3xl border-2 border-[#026d77] p-8 sm:p-10 shadow-lg text-center space-y-6">
          <div className="text-3xl font-black text-[#026d77]">₹0 / FREE</div>
          <p className="text-sm font-semibold text-gray-600">Full Access Unlocked For All Registered Members</p>

          <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto pt-4 border-t border-gray-100">
            {[
              "Unlimited profile browsing & matching",
              "Direct interest requests & acceptances",
              "Real-time chat with mutual matches",
              "Full profile photos & details visibility",
              "Detailed caste & religious filters",
              "PDF Biodata downloading"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-[#026d77] shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <Link
              href="/?register=true"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-[#026d77] hover:bg-[#03828e] transition-all shadow-md active:scale-95"
            >
              Get Started Free Now
            </Link>
          </div>
        </div>
      </div>

      {/* Trust signals */}
      <div className="bg-white border-t border-gray-100 py-10 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: Shield, title: "Privacy Protected", desc: "Your data is never shared without consent" },
            { icon: Heart, title: "Halal Matching", desc: "Designed for Muslim matrimonial values" },
            { icon: Zap, title: "Instant Access", desc: "Get started in minutes, no waiting" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#026d77]/10 rounded-xl flex items-center justify-center">
                <item.icon className="w-5 h-5 text-[#026d77]" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
