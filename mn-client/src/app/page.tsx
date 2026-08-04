"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import SuccessStoriesSection from "@/components/home/SuccessStoriesSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/layout/Footer";
import RegisterModal from "@/components/auth/RegisterModal";

export default function Home() {
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">
        <HeroSection onJoinNow={() => setRegisterOpen(true)} />
        <StatsSection />
        <FeaturesSection />
        <SuccessStoriesSection />
        <CTASection onRegisterOpen={() => setRegisterOpen(true)} />
      </main>
      <Footer />
      {registerOpen && (
        <RegisterModal isOpen={registerOpen} onClose={() => setRegisterOpen(false)} />
      )}
    </>
  );
}
