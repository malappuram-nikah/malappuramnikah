"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, Zap, Shield, Star, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { API_URL } from "@/lib/config";

const plans = [
  {
    name: "Silver",
    price: "₹499",
    period: "/3 months",
    color: "bg-gray-50 border-gray-200",
    headerColor: "bg-gray-100",
    textColor: "text-gray-700",
    btnClass: "bg-gray-800 text-white hover:bg-gray-700",
    features: [
      "View 50 profiles/month",
      "Send 10 interests/month",
      "Basic search filters",
      "Chat with matches",
    ],
  },
  {
    name: "Gold",
    price: "₹999",
    period: "/6 months",
    color: "bg-brand-600 border-brand-600",
    headerColor: "bg-brand-700",
    textColor: "text-white",
    btnClass: "bg-white text-brand-700 hover:bg-brand-50",
    badge: "Most Popular",
    features: [
      "Unlimited profile views",
      "Unlimited interests",
      "Advanced search filters",
      "Priority in search results",
      "Dedicated matchmaker",
      "WhatsApp number reveal",
    ],
  },
  {
    name: "Platinum",
    price: "₹1,799",
    period: "/12 months",
    color: "bg-gray-50 border-gray-200",
    headerColor: "bg-gray-100",
    textColor: "text-gray-700",
    btnClass: "bg-brand-600 text-white hover:bg-brand-700",
    features: [
      "Everything in Gold",
      "Family contact details",
      "Personal matchmaker call",
      "Verified badge on profile",
      "Premium profile boost",
    ],
  },
];

export default function PremiumPage() {
  const router = useRouter();
  const { currentUser, loadingUser, refreshUser } = useUser();
  const [userId, setUserId] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const triggerAlert = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  useEffect(() => {
    if (loadingUser) return;
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUserId(currentUser.id);
    setIsPremium(!!currentUser.is_premium);
    setLoading(false);
  }, [currentUser, loadingUser, router]);

  const handleUpgradePlan = async (planName: string) => {
    if (!userId) {
      triggerAlert("Please log in to upgrade.", "error");
      return;
    }
    setUpgrading(planName);
    try {
      const token = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/${userId}/premium`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ is_premium: true })
      });
      const data = await res.json();
      if (data.success) {
        setIsPremium(true);
        triggerAlert(`Congratulations! You have successfully upgraded to the ${planName} Plan! 🎉`);
        await refreshUser();
      } else {
        triggerAlert(data.message || "Upgrade failed.", "error");
      }
    } catch (e) {
      triggerAlert("Connection failed. Try again.", "error");
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-3 text-brand-500" />
        <p className="font-semibold text-sm">Checking subscription state...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 text-white text-xs font-semibold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 border ${
              alertMsg.type === "success" ? "bg-gray-900 border-gray-800" : "bg-red-600 border-red-500"
            }`}
          >
            <span>{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center max-w-2xl mx-auto">
        <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5 relative">
          <Crown className={`w-7 h-7 ${isPremium ? "text-amber-500 fill-amber-500" : "text-brand-600"}`} />
          {isPremium && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold font-playfair text-gray-900 mb-3">
          {isPremium ? "You are a Premium Member! 🌟" : "Upgrade Your Experience"}
        </h1>
        <p className="text-gray-500">
          {isPremium 
            ? "Your premium benefits are fully active. You have unlimited visibility, premium search options, and matchmaker support." 
            : "Unlock premium features to find your perfect match faster with greater privacy and visibility."}
        </p>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan, i) => {
          // If user is premium, Gold counts as active premium tier
          const isActivePlan = isPremium && plan.name === "Gold";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border-2 overflow-hidden flex flex-col relative transition-all ${
                isActivePlan 
                  ? "border-amber-500 ring-4 ring-amber-500/10 shadow-lg scale-[1.02]" 
                  : plan.color
              }`}
            >
              {isActivePlan ? (
                <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Active Subscription
                </div>
              ) : plan.badge ? (
                <div className="absolute top-4 right-4 bg-white text-brand-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  {plan.badge}
                </div>
              ) : null}
              
              <div className={`px-6 py-7 ${isActivePlan ? "bg-amber-500" : plan.headerColor}`}>
                <p className={`text-lg font-bold font-playfair mb-2 ${plan.name === "Gold" || isActivePlan ? "text-white" : "text-gray-900"}`}>{plan.name}</p>
                <div className="flex items-end gap-1">
                  <span className={`text-4xl font-bold ${plan.name === "Gold" || isActivePlan ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                  <span className={`text-sm pb-1 ${plan.name === "Gold" || isActivePlan ? "text-brand-200" : "text-gray-500"}`}>{plan.period}</span>
                </div>
              </div>
              
              <div className="px-6 py-6 flex-1 flex flex-col justify-between">
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-start gap-2.5 text-sm ${plan.name === "Gold" && !isActivePlan ? "text-brand-700 font-medium" : "text-gray-600"}`}>
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.name === "Gold" && !isActivePlan ? "text-brand-600" : "text-brand-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleUpgradePlan(plan.name)}
                  disabled={isPremium || upgrading !== null}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
                    isActivePlan 
                      ? "bg-amber-500 text-white" 
                      : plan.btnClass
                  }`}
                >
                  {upgrading === plan.name ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Activating...
                    </>
                  ) : isActivePlan ? (
                    "Current Plan"
                  ) : isPremium ? (
                    "Premium Enabled"
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        {[
          { icon: Shield, title: "Secure Payment",   desc: "SSL encrypted, 100% safe" },
          { icon: Zap,    title: "Instant Activation", desc: "Account upgraded immediately" },
          { icon: Star,   title: "7-Day Refund",     desc: "Not satisfied? Full refund" },
        ].map((b, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
              <b.icon className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{b.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
