"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Crown, Zap, Heart, Shield } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    color: "border-gray-200",
    headerColor: "bg-gray-50",
    badge: null,
    features: [
      "Browse profiles",
      "Send up to 5 interests",
      "Basic profile creation",
      "View limited profile details",
    ],
    cta: "Get Started Free",
    ctaHref: "/",
    ctaStyle: "bg-gray-900 text-white hover:bg-black",
  },
  {
    name: "Premium",
    price: "₹999",
    period: "/month",
    color: "border-[#026d77]",
    headerColor: "bg-[#026d77]",
    badge: "Most Popular",
    features: [
      "Unlimited interest requests",
      "Full profile visibility",
      "AI-powered match suggestions",
      "Chat with mutual matches",
      "Biodata PDF download",
      "Voice introduction feature",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
    ctaHref: "/login",
    ctaStyle: "bg-[#026d77] text-white hover:bg-[#03828e]",
  },
  {
    name: "Elite",
    price: "₹2,499",
    period: "/3 months",
    color: "border-amber-400",
    headerColor: "bg-gradient-to-br from-amber-500 to-amber-600",
    badge: "Best Value",
    features: [
      "Everything in Premium",
      "Profile highlighted in search",
      "Dedicated matchmaker assistance",
      "Family verification badge",
      "Wedding planner connections",
    ],
    cta: "Get Elite Plan",
    ctaHref: "/login",
    ctaStyle: "bg-amber-500 text-white hover:bg-amber-600",
  },
];

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
          <Link href="/" className="text-sm font-medium bg-[#026d77] text-white px-5 py-2.5 rounded-xl hover:bg-[#03828e] transition-all shadow-sm">
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
          <h1 className="text-3xl sm:text-4xl font-bold font-playfair text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-gray-500 text-base max-w-lg mx-auto leading-relaxed">
            Choose the plan that works best for your journey. No hidden fees, cancel anytime.
          </p>
        </motion.div>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`bg-white rounded-2xl border-2 ${plan.color} shadow-sm overflow-hidden ${i === 1 ? "ring-2 ring-[#026d77]/20 scale-[1.02]" : ""}`}
          >
            {/* Plan Header */}
            <div className={`${plan.headerColor} p-6 ${i === 0 ? "text-gray-900" : "text-white"}`}>
              {plan.badge && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 inline-block ${i === 1 ? "bg-white/20 text-white" : "bg-white text-amber-600"}`}>
                  {plan.badge}
                </span>
              )}
              <h2 className="text-lg font-bold font-playfair">{plan.name}</h2>
              <div className="mt-2">
                <span className="text-3xl font-black">{plan.price}</span>
                <span className={`text-sm ml-1 ${i === 0 ? "text-gray-500" : "text-white/70"}`}>{plan.period}</span>
              </div>
            </div>

            {/* Features */}
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-[#026d77] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`w-full inline-flex items-center justify-center py-3 rounded-xl text-sm font-semibold transition-all shadow-sm ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>
            </div>
          </motion.div>
        ))}
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
