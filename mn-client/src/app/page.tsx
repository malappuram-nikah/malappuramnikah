"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import CTASection from "@/components/home/CTASection";
import UpcomingBusinessSection from "@/components/home/UpcomingBusinessSection";
import Footer from "@/components/layout/Footer";
import RegisterModal from "@/components/auth/RegisterModal";

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
        <CTASection onRegisterOpen={() => setRegisterOpen(true)} />
      </main>
      <Footer />
      {registerOpen && (
        <RegisterModal isOpen={registerOpen} onClose={() => setRegisterOpen(false)} />
      )}
    </>
  );
}
