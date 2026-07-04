"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 overflow-hidden bg-white">
      {/* Premium subtle warm/purple background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full md:w-[80%] h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-50/50 via-amber-50/30 to-transparent -z-10 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl text-center">
        {/* Header Text Section */}
        <div className="max-w-3xl mx-auto pt-8 pb-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-playfair text-gray-900 leading-[1.1] tracking-tight"
          >
            Serious about marriage? <br />
            So are we.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="mt-6 text-sm sm:text-base md:text-lg text-gray-500 font-medium tracking-wide max-w-xl mx-auto"
          >
            Where Muslims meet with intention, not swipes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="mt-8 flex justify-center"
          >
            <button className="bg-[#111827] hover:bg-black text-white px-8 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
              Join Now
              <span className="text-base font-normal">→</span>
            </button>
          </motion.div>
        </div>

        {/* Floating Profile Cards & Smartphone Showcase Section */}
        <div className="relative w-full max-w-6xl mx-auto mt-6 px-4 py-8 overflow-hidden select-none">
          {/* Side Fading Mask Gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none hidden md:block" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none hidden md:block" />

          {/* Cards Row layout */}
          <div className="flex items-center justify-center gap-4 md:gap-6 lg:gap-8 overflow-x-auto no-scrollbar py-6">
            
            {/* Left Card 1: Man in teal jacket */}
            <motion.div
              initial={{ opacity: 0, x: -30, rotate: -3 }}
              animate={{ opacity: 0.7, x: 0, rotate: -4 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ scale: 1.05, opacity: 0.9, transition: { duration: 0.2 } }}
              className="w-32 h-40 sm:w-44 sm:h-56 md:w-48 md:h-60 rounded-[1.8rem] overflow-hidden bg-white shadow-[0_10px_25px_rgba(0,0,0,0.04)] border-4 border-white flex-shrink-0 hidden sm:block transform cursor-pointer"
            >
              <img
                src="/hero-man-jacket.jpg"
                alt="Kerala Muslim Groom"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Left Card 2: Girl in green dress / pink hijab */}
            <motion.div
              initial={{ opacity: 0, x: -20, rotate: -1 }}
              animate={{ opacity: 0.9, x: 0, rotate: -2 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ scale: 1.05, opacity: 1, transition: { duration: 0.2 } }}
              className="w-36 h-44 sm:w-48 sm:h-60 md:w-52 md:h-64 rounded-[2rem] overflow-hidden bg-white shadow-[0_12px_30px_rgba(0,0,0,0.05)] border-4 border-white flex-shrink-0 cursor-pointer"
            >
              <img
                src="/hero-girl-hijab.jpg"
                alt="Muslim Bride Profile"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Center: Premium Smartphone Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 60 }}
              className="w-[260px] h-[480px] sm:w-[280px] sm:h-[520px] md:w-[310px] md:h-[580px] rounded-[2.8rem] border-[8px] border-gray-900 bg-gray-900 shadow-2xl relative z-10 flex-shrink-0 overflow-hidden"
            >
              {/* Dynamic Island Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-gray-900 rounded-full z-30 flex items-center justify-center">
                <div className="w-12 h-1 bg-gray-800 rounded-full" />
              </div>

              {/* Speaker & Sensor dots inside notch */}
              <div className="absolute top-[18px] left-[calc(50%+24px)] w-1.5 h-1.5 bg-gray-800 rounded-full z-30" />

              {/* Simulated Mobile Status Bar */}
              <div className="absolute top-1.5 left-0 right-0 px-6 flex justify-between items-center text-[10px] font-semibold text-gray-700 z-20 pointer-events-none">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-2.5 border border-gray-700 rounded-sm relative flex items-center justify-start p-0.5"><span className="w-1.5 h-full bg-gray-700 rounded-xs block" /></span>
                </div>
              </div>

              {/* Inside Screen Content */}
              <div className="w-full h-full bg-[#FAF9F5] pt-9 pb-4 px-3 flex flex-col justify-between overflow-hidden">
                <div className="bg-white rounded-[2rem] p-4 sm:p-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col items-center h-full justify-between">
                  
                  {/* User Profile Avatar */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-26 md:h-26 rounded-[2.2rem] overflow-hidden border-2 border-brand-50 shadow-sm">
                    <img
                      src="/hero-muhammad.jpg"
                      alt="Muhammad Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Profile Name & Tagline */}
                  <div className="text-center mt-2">
                    <h3 className="text-lg sm:text-xl font-bold font-playfair text-gray-900">Muhammad</h3>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5">Egypt, Head of School</p>
                  </div>

                  {/* Dot Indicator & Book Icon */}
                  <div className="flex items-center gap-2 mt-2 w-full justify-center">
                    <div className="h-px bg-gray-200 flex-1 max-w-[40px]" />
                    <div className="w-9 h-9 bg-white shadow-[0_3px_10px_rgba(0,0,0,0.05)] rounded-xl flex items-center justify-center border border-gray-50">
                      <BookOpen className="w-4 h-4 text-gray-700" />
                    </div>
                    <div className="h-px bg-gray-200 flex-1 max-w-[40px]" />
                  </div>

                  {/* About Me Title */}
                  <h4 className="text-xs sm:text-sm font-bold font-playfair text-gray-900 mt-2">About me</h4>

                  {/* About Me Text with fade out gradient overlay */}
                  <div className="relative text-center mt-1 px-1 max-h-[85px] overflow-hidden">
                    <p className="text-[10px] sm:text-[11px] leading-relaxed text-gray-500 font-medium">
                      My downtime includes going for runs, hanging out with my family, and experimenting in the kitchen. I find each of these activities grounding and a great way to unwind.
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  </div>

                </div>
              </div>
            </motion.div>

            {/* Right Card 1: Girl with headphones */}
            <motion.div
              initial={{ opacity: 0, x: 20, rotate: 1 }}
              animate={{ opacity: 0.9, x: 0, rotate: 2 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ scale: 1.05, opacity: 1, transition: { duration: 0.2 } }}
              className="w-36 h-44 sm:w-48 sm:h-60 md:w-52 md:h-64 rounded-[2rem] overflow-hidden bg-white shadow-[0_12px_30px_rgba(0,0,0,0.05)] border-4 border-white flex-shrink-0 cursor-pointer"
            >
              <img
                src="/hero-girl-headphones.jpg"
                alt="Muslim Groom Profile"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Right Card 2: Man in teal jacket */}
            <motion.div
              initial={{ opacity: 0, x: 30, rotate: 3 }}
              animate={{ opacity: 0.7, x: 0, rotate: 4 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ scale: 1.05, opacity: 0.9, transition: { duration: 0.2 } }}
              className="w-32 h-40 sm:w-44 sm:h-56 md:w-48 md:h-60 rounded-[1.8rem] overflow-hidden bg-white shadow-[0_10px_25px_rgba(0,0,0,0.04)] border-4 border-white flex-shrink-0 hidden sm:block transform cursor-pointer"
            >
              <img
                src="/hero-man-jacket.jpg"
                alt="Kerala Muslim Bride"
                className="w-full h-full object-cover"
              />
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
