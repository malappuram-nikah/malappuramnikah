"use client";

import { motion } from "framer-motion";

interface CTASectionProps {
  onRegisterOpen: () => void;
}

export default function CTASection({ onRegisterOpen }: CTASectionProps) {
  return (
    <section className="py-24 bg-white border-t border-brand-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative bg-gradient-to-r from-[#013d43] via-[#026d77] to-[#025f68] rounded-3xl px-8 py-16 md:px-16 md:py-20 text-center overflow-hidden shadow-2xl"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:28px_28px]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-700/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold font-playfair text-white mb-6 leading-tight"
            >
              Your Perfect Match <br className="hidden sm:block" />
              Is Waiting For You
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-brand-100 text-base md:text-lg mb-10 max-w-xl mx-auto font-normal leading-relaxed"
            >
              Join thousands of verified members and start your journey toward a meaningful, blessed marriage today.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={onRegisterOpen}
                className="w-full sm:w-auto px-8 py-4 bg-white text-[#026d77] font-bold rounded-xl hover:bg-brand-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 text-base cursor-pointer"
              >
                Register Free — It&apos;s Easy
              </button>
              <a
                href="/success-stories"
                className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white/40 text-white font-semibold rounded-xl hover:border-white hover:bg-white/10 transition-all text-base"
              >
                View Success Stories
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 text-xs text-brand-100/90 font-medium flex flex-col sm:flex-row items-center justify-center gap-2"
            >
              <span>📞 Need help registering? Call Support:</span>
              <a href="tel:+919447868443" className="text-white hover:underline font-bold">+91 94478 68443</a>
              <span className="hidden sm:inline text-brand-300/40">•</span>
              <a href="https://wa.me/919447868443?text=Hello%20Malappuram%20Nikah%2C%20I%20need%20assistance." target="_blank" rel="noopener noreferrer" className="text-white hover:underline font-bold flex items-center gap-1">
                💬 WhatsApp Chat Support
              </a>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
