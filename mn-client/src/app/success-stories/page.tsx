"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const stories = [
  {
    couple: "Ahmed & Fathima",
    location: "Malappuram",
    year: "2024",
    story:
      "We found each other on Malappuram Nikah and knew it was meant to be. Alhamdulillah, we are now happily married!",
    initials: "A & F",
  },
  {
    couple: "Muhammed & Zainab",
    location: "Kozhikode",
    year: "2024",
    story:
      "The platform made it easy to find someone who shares our values and family goals. We are grateful for this blessing.",
    initials: "M & Z",
  },
  {
    couple: "Rashid & Mariam",
    location: "Thrissur",
    year: "2023",
    story:
      "We matched within a week, and after two months of family meetings, we got nikah done. JazakAllah to Malappuram Nikah.",
    initials: "R & M",
  },
];

export default function SuccessStoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/logoMain-01.svg"
            alt="Malappuram Nikah"
            width={120}
            height={60}
            className="h-10 w-auto"
          />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Log In
          </Link>
          <Link href="/" className="text-sm font-medium bg-[#026d77] text-white px-5 py-2.5 rounded-xl hover:bg-[#03828e] transition-all shadow-sm">
            Get Started
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-b from-[#026d77]/10 to-transparent py-16 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-14 h-14 bg-[#026d77]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-7 h-7 text-[#026d77] fill-[#026d77]/20" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-playfair text-gray-900 mb-4">
            Success Stories
          </h1>
          <p className="text-gray-500 text-base max-w-lg mx-auto leading-relaxed">
            Real couples who found their perfect match through Malappuram Nikah.
            May Allah bless their unions.
          </p>
        </motion.div>
      </div>

      {/* Stories Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {stories.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#026d77]/10 flex items-center justify-center text-[#026d77] font-bold text-sm mx-auto">
              {s.initials}
            </div>
            <div className="text-center">
              <h2 className="font-bold text-gray-900 font-playfair">{s.couple}</h2>
              <p className="text-xs text-gray-400 mt-1">
                {s.location} · {s.year}
              </p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed text-center italic">
              &ldquo;{s.story}&rdquo;
            </p>
            <div className="flex justify-center">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-[#026d77] py-12 px-6 text-center">
        <h2 className="text-2xl font-bold text-white font-playfair mb-3">
          Begin Your Own Story
        </h2>
        <p className="text-[#81c4bd] text-sm mb-6 max-w-md mx-auto">
          Join thousands of Muslims who found their spouse through Malappuram Nikah.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white text-[#026d77] font-semibold px-8 py-3 rounded-xl hover:bg-[#f0fafa] transition-all shadow-sm text-sm"
        >
          Create Free Account →
        </Link>
      </div>
    </div>
  );
}
