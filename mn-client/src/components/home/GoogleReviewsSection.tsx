"use client";

import { Star, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const reviews = [
  {
    id: 1,
    name: "Dr. Faisal & Dr. Shamna",
    location: "Manjeri, Malappuram",
    rating: 5,
    date: "2 weeks ago",
    content:
      "Alhamdulillah, we found each other through Malappuram Nikah. The privacy controls and verified family profiles made the entire process dignified and secure. Highly recommended for genuine Kerala Muslim families.",
    verified: true,
  },
  {
    id: 2,
    name: "Abdul Latheef (Father of Bride)",
    location: "Perinthalmanna, Malappuram",
    rating: 5,
    date: "1 month ago",
    content:
      "As a parent, my biggest concern was privacy and genuine family backgrounds. Malappuram Nikah's KYC verification and strict profile filtering gave us complete peace of mind. May Allah bless the team.",
    verified: true,
  },
  {
    id: 3,
    name: "Anas & Rinsha",
    location: "Kottakkal, Malappuram",
    rating: 5,
    date: "2 months ago",
    content:
      "The best matrimony platform tailored specifically for Malappuram and Kerala Muslims. The direct filters for religious values, education, and district made matching effortless. Truly 5 stars!",
    verified: true,
  },
];

export default function GoogleReviewsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white via-slate-50/50 to-white relative overflow-hidden border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-xs">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Google Verified Reviews</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight font-playfair">
            Loved by Thousands of Kerala Muslim Families
          </h2>

          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-900">4.9 / 5.0 Rating</span>
            <span className="text-xs text-gray-400">• Based on 500+ Family Reviews</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {reviews.map((rev) => (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: rev.id * 0.1 }}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-150 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 relative"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-400">{rev.date}</span>
                </div>

                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                  &ldquo;{rev.content}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    {rev.name}
                    {rev.verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    )}
                  </h4>
                  <p className="text-[11px] text-gray-400">{rev.location}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-gray-600">
                  {rev.name.charAt(0)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#026d77]" />
            <span>100% ID & Phone Verified Profiles</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#026d77]" />
            <span>Privacy & Photo Blur Protection</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[#026d77]" />
            <span>Highest Match Success Rate in Malappuram</span>
          </div>
        </div>
      </div>
    </section>
  );
}
