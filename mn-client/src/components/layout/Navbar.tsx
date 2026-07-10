"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import RegisterModal from "@/components/auth/RegisterModal";
import ReferralGeneratorModal from "@/components/home/ReferralGeneratorModal";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b",
          isScrolled
            ? "bg-white/90 backdrop-blur-md border-gray-200/50 shadow-sm py-3"
            : "bg-transparent border-transparent py-5"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group outline-none">
            <Image
              src="/logoMain-01.svg"
              alt="Malappuram Nikah Logo"
              width={120}
              height={60}
              className="h-12 w-auto object-contain transition-opacity group-hover:opacity-90"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
            <Link href="/matches" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Matches</Link>
            <Link href="/success-stories" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Success Stories</Link>
            <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-5">
            <button 
              onClick={() => setReferralOpen(true)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Partner Program
            </button>
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              Log in
            </Link>
            <button 
              onClick={() => setRegisterOpen(true)}
              className="text-sm font-medium bg-brand-600 text-white px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-all shadow-sm hover:shadow active:scale-95"
            >
              Create Account
            </button>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
                <Link href="/" className="block px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">Home</Link>
                <Link href="/matches" className="block px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">Matches</Link>
                <Link href="/success-stories" className="block px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">Success Stories</Link>
                <Link href="/pricing" className="block px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">Pricing</Link>
                <div className="h-px bg-gray-100 my-2 mx-4" />
                <button 
                  onClick={() => { setMobileMenuOpen(false); setReferralOpen(true); }}
                  className="block w-full text-left px-4 py-3 text-brand-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Partner Program
                </button>
                <Link href="/login" className="block px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">Log in</Link>
                <button 
                  onClick={() => { setMobileMenuOpen(false); setRegisterOpen(true); }}
                  className="block w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium text-center rounded-xl mt-2 transition-colors"
                >
                  Create Account
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      
      {registerOpen && <RegisterModal isOpen={registerOpen} onClose={() => setRegisterOpen(false)} />}
      <ReferralGeneratorModal isOpen={referralOpen} onClose={() => setReferralOpen(false)} />
    </>
  );
}
