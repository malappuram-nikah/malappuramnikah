"use client";

import { motion } from "framer-motion";
import { Search, MapPin, Users, CheckCircle2 } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-[#f0faf9]">
      {/* Subtle teal grid background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#a3e1dc33_1px,transparent_1px),linear-gradient(to_bottom,#a3e1dc33_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      {/* Teal glow blob */}
      <div className="absolute top-[-10%] right-[-5%] -z-10 w-[60%] h-[60%] rounded-full bg-brand-200/40 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-brand-200 text-brand-700 text-sm font-medium w-fit mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              #1 Trusted Matrimony in Kerala
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-playfair text-gray-900 leading-[1.15] tracking-tight">
              Begin Your Journey to <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">Forever.</span>
            </h1>
            
            <p className="mt-6 text-base sm:text-lg text-gray-500 leading-relaxed max-w-xl">
              Experience a premium matchmaking service designed for those who seek meaningful connections. Verified profiles, dedicated assistance, and absolute privacy.
            </p>

            {/* Professional Search Widget */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="mt-10 bg-white p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-brand-100 max-w-2xl"
            >
              <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-brand-400" />
                  </div>
                  <select defaultValue="" className="w-full bg-brand-50/50 border border-brand-100 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer">
                    <option value="" disabled>I&apos;m looking for a</option>
                    <option value="bride">Bride</option>
                    <option value="groom">Groom</option>
                  </select>
                </div>
                
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-brand-400" />
                  </div>
                  <select defaultValue="" className="w-full bg-brand-50/50 border border-brand-100 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer">
                    <option value="" disabled>Location</option>
                    <option value="kerala">Kerala</option>
                    <option value="uae">UAE</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <button className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-6 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow group whitespace-nowrap">
                  <Search className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Search
                </button>
              </form>
            </motion.div>

            {/* Trust Metrics */}
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-500" />
                <span>10k+ Success Stories</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-500" />
                <span>100% Verified</span>
              </div>
            </div>
          </motion.div>

          {/* Right Visuals */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-5 xl:col-span-6 relative flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-lg aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl bg-brand-100 border-4 border-white">
              <img 
                src="https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?q=80&w=1000&auto=format&fit=crop" 
                alt="Elegant Couple" 
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#013d43]/50 via-transparent to-transparent" />
            </div>

            {/* Floating Stats Card */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 sm:left-4 bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-brand-100 hidden sm:flex items-center gap-4"
            >
              <div className="flex -space-x-3">
                <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=1" alt="User" />
                <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=2" alt="User" />
                <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=3" alt="User" />
                <div className="w-10 h-10 rounded-full border-2 border-white bg-brand-50 flex items-center justify-center text-xs font-semibold text-brand-700">
                  +2k
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">New matches</p>
                <p className="text-xs text-gray-500">Joined this week</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
