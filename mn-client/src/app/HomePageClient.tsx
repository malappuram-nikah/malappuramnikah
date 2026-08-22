"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import FAQSection from "@/components/home/FAQSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/layout/Footer";

const UpcomingBusinessSection = dynamic(
  () => import("@/components/home/UpcomingBusinessSection"),
  { ssr: true }
);
const RegisterModal = dynamic(
  () => import("@/components/auth/RegisterModal"),
  { ssr: false }
);

export default function Home() {
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("register") === "true" || params.get("ref")) {
        setRegisterOpen(true);
      }
    }
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">
        <HeroSection onJoinNow={() => setRegisterOpen(true)} />
        <StatsSection />
        <FeaturesSection />
        <UpcomingBusinessSection />
        <FAQSection />
        <CTASection onRegisterOpen={() => setRegisterOpen(true)} />
      </main>
      <Footer />
      {registerOpen && (
        <RegisterModal isOpen={registerOpen} onClose={() => setRegisterOpen(false)} />
      )}
    </>
  );
}
