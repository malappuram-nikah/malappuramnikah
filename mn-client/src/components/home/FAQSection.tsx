"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Phone } from "lucide-react";
import { HOMEPAGE_FAQS } from "@/lib/seo/structured-data";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="py-20 md:py-28 bg-[#FAF9F5]/80 text-gray-900 relative overflow-hidden border-t border-gray-100"
    >
      {/* Ambient background glow matching existing brand palette */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#81c4bd]/20 via-[#026d77]/5 to-transparent -z-10 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#026d77]/10 text-[#026d77] uppercase tracking-wider mb-4"
          >
            Frequently Asked Questions
          </motion.div>

          <motion.h2
            id="faq-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold font-playfair text-gray-900 tracking-tight leading-[1.2]"
          >
            Everything You Need To <span className="text-[#026d77]">Know</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-sm sm:text-base text-gray-600 font-normal leading-relaxed"
          >
            Clear and simple answers to help you navigate registration, profile creation, privacy, and matchmaking on Malappuram Nikah.
          </motion.p>
        </div>

        {/* Accordion Container */}
        <div className="space-y-3.5">
          {HOMEPAGE_FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            const questionId = `faq-question-${index}`;
            const answerId = `faq-answer-${index}`;

            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`rounded-2xl border transition-all duration-200 bg-white ${
                  isOpen
                    ? "border-[#026d77]/40 shadow-sm"
                    : "border-gray-200/90 hover:border-[#026d77]/30 shadow-xs"
                }`}
              >
                <h3>
                  <button
                    type="button"
                    id={questionId}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 text-left cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#026d77] rounded-2xl"
                  >
                    <span className="text-base sm:text-lg font-semibold font-sans text-gray-900 leading-snug">
                      {faq.question}
                    </span>
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isOpen
                          ? "bg-[#026d77] text-white rotate-180"
                          : "bg-gray-100 text-gray-500 hover:bg-[#026d77]/10 hover:text-[#026d77]"
                      }`}
                      aria-hidden="true"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={answerId}
                      role="region"
                      aria-labelledby={questionId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 text-sm sm:text-base text-gray-600 leading-relaxed border-t border-gray-100">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Support Callout Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs"
        >
          <div className="text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 font-sans">
              Have a question not answered here?
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
              Our support team is available to assist you with registration and profile setup.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/919961341443?text=Hello%20Malappuram%20Nikah%2C%20I%20have%20a%20question."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#026d77] hover:bg-[#03828e] text-white transition-all shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Support</span>
            </a>
            <a
              href="tel:+919961341443"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-all"
            >
              <Phone className="w-4 h-4 text-[#026d77]" />
              <span>+91 99613 41443</span>
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
