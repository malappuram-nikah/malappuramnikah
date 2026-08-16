"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const featureStats = [
  {
    value: "100%",
    pill: "MANUAL VERIFICATION",
    description: "Every profile undergoes a strict manual verification process with ID checks to ensure utmost authenticity and safety.",
  },
  {
    value: "24/7",
    pill: "DEDICATED MATCHMAKERS",
    description: "Receive personalized assistance from our expert relationship managers to help you find your perfect match faster.",
  },
  {
    value: "100%",
    pill: "PRIVACY & SAFETY",
    description: "Enjoy a highly curated, private, and secure matchmaking experience tailored specifically for your lifestyle.",
  },
  {
    value: "98%",
    pill: "FAMILY SATISFACTION",
    description: "Designed keeping traditional family values in mind, making it accessible and respectful for parents and candidates alike.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-white text-gray-900 relative overflow-hidden border-t border-gray-100">
      {/* Subtle Background Radial Glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#026d77]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-brand-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Heading, Paragraph & Action Button */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-5 flex flex-col items-start"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold font-playfair text-gray-900 tracking-tight leading-[1.15]">
              We Turn Intentions <br className="hidden sm:inline" />
              Into Blessed <br className="hidden sm:inline" />
              <span className="text-[#026d77]">Beginnings</span>
            </h2>

            <p className="mt-6 text-gray-600 text-sm sm:text-base leading-relaxed max-w-md font-normal">
              Whether you are looking for a compatible life partner, verified family profiles, or personalized matchmaker guidance, we bring authenticity, privacy, and traditional Islamic values to every match.
            </p>

            <div className="mt-8">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center bg-[#026d77] hover:bg-[#03828e] text-white font-semibold px-7 py-3 rounded-full text-sm shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Know More About Us
              </Link>
            </div>
          </motion.div>

          {/* Right Column: 2x2 Feature/Metric Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10"
          >
            {featureStats.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-start group"
              >
                {/* Big Number / Value */}
                <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-sans text-gray-900 tracking-tight mb-3 group-hover:text-[#026d77] transition-colors duration-300">
                  {item.value}
                </span>

                {/* Capsule Pill Badge */}
                <div className="inline-block bg-[#026d77]/10 border border-[#026d77]/20 text-[#026d77] text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
                  {item.pill}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-normal">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
