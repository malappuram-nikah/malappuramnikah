"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Phone, MessageCircle, ArrowLeft } from "lucide-react";

export default function BusinessLoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-gray-100 font-sans">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-[#026d77]/20 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-amber-500/10 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6 bg-gray-900/60 border border-gray-800 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 backdrop-blur-xl text-center"
      >
        <div className="flex flex-col items-center">
          <Link href="/" className="mb-6 inline-block">
            <Image
              src="/logoMain-01.svg"
              alt="Malappuram Nikah"
              width={120}
              height={60}
              className="h-12 w-auto object-contain filter invert brightness-200"
              priority
            />
          </Link>

          <div className="w-16 h-16 bg-[#026d77]/20 text-[#81c4bd] rounded-2xl flex items-center justify-center mb-4 border border-[#026d77]/40 shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>

          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
            Feature Coming Soon 🚀
          </span>

          <h2 className="text-2xl font-extrabold text-white tracking-tight font-playfair mb-2">
            Wedding Partner Portal
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed max-w-[320px]">
            The partner login and management portal is launching soon! Contact us directly to enquire about partner access and listing your business.
          </p>
        </div>

        {/* Contact Buttons */}
        <div className="space-y-3 pt-2">
          <a
            href="https://wa.me/919961341443?text=Hi%2C%20I%20want%20to%20enquire%20about%20my%20wedding%20business%20partner%20login%20on%20Malappuram%20Nikah"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-6 bg-[#026d77] hover:bg-[#03828e] text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Us: +91 99613 41443</span>
          </a>

          <a
            href="tel:+919961341443"
            className="w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-700"
          >
            <Phone className="w-4 h-4 text-[#81c4bd]" />
            <span>Call Us: +91 99613 41443</span>
          </a>
        </div>

        <div className="pt-4 border-t border-gray-800">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
