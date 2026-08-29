"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Phone,
  MessageCircle,
  X,
  ArrowRight,
} from "lucide-react";

const businessServices = [
  {
    category: "RENTAL VENDOR",
    badge: "COMING SOON",
    title: "Wedding Dress Rentals",
    description: "Showcase bridal lehengas, groom sherwanis, designer abayas & traditional wedding attire for rental.",
  },
  {
    category: "JEWELLERY PARTNER",
    badge: "COMING SOON",
    title: "Bridal Jewellery & Ornaments",
    description: "Exquisite antique gold, diamond sets, bridal ornaments & traditional Malabar wedding jewellery rentals.",
  },
  {
    category: "MEDIA PARTNER",
    badge: "COMING SOON",
    title: "Photography & Videography",
    description: "Get booked for wedding photo shoots, drone coverage, and cinematic Nikah wedding films.",
  },
  {
    category: "BRIDAL MAKEOVER",
    badge: "COMING SOON",
    title: "Mehndi & Bridal Makeup Artists",
    description: "Professional bridal makeup artists, hair stylists, and bridal henna mehndi creators across Kerala.",
  },
  {
    category: "CATERING",
    badge: "COMING SOON",
    title: "Wedding Catering & Feasts",
    description: "Connect with families looking for traditional Malabar Dum Biryani, live food counters & wedding catering.",
  },
  {
    category: "EVENT DECOR",
    badge: "COMING SOON",
    title: "Stage & Floral Decoration",
    description: "Offer bespoke Nikah stage decor, floral arches, entrance pavilions, and aesthetic ambience setups.",
  },
  {
    category: "LUXURY FLEET",
    badge: "COMING SOON",
    title: "Wedding Car Rentals",
    description: "Luxury sedan fleets, vintage wedding cars, and VIP bridal chauffeur transport services.",
  },
  {
    category: "CULTURAL EVENTS",
    badge: "COMING SOON",
    title: "Oppana & Cultural Performance",
    description: "Traditional Malabar Oppana teams, Duff Muttu groups, sound reinforcement, and cultural programs.",
  },
];

export default function UpcomingBusinessSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="py-24 bg-white text-gray-900 relative overflow-hidden border-t border-gray-100">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-1/4 w-[30rem] h-[30rem] bg-[#026d77]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[30rem] h-[30rem] bg-brand-100/40 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold font-playfair text-gray-900 tracking-tight leading-tight"
          >
            Grow Your Wedding Business <br className="hidden sm:inline" />
            <span className="text-[#026d77]">Through Our Platform</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Are you a photographer, dress rental owner, caterer, or decorator? Create a business account on Malappuram Nikah to receive direct wedding bookings and client leads.
          </motion.p>
        </div>

        {/* Brand Theme Filled Grid Cards Container */}
        <div className="border border-[#026d77]/20 rounded-3xl overflow-hidden bg-[#026d77] shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 gap-[1px] bg-white/10">
            {businessServices.map((service, index) => {
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  onClick={() => setModalOpen(true)}
                  className="p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer group relative bg-gradient-to-br from-[#026d77] via-[#025f68] to-[#01474d] hover:from-[#03828e] hover:to-[#025f68] text-white"
                >
                  <div>
                    {/* Top Row: Category + Coming Soon Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <p className="text-[10px] font-bold text-brand-200 tracking-[0.15em] uppercase group-hover:text-white transition-colors truncate">
                        {service.category}
                      </p>
                      <span className="inline-block bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-xs">
                        {service.badge}
                      </span>
                    </div>

                    {/* Bold Title */}
                    <h3 className="text-lg sm:text-xl font-bold font-sans text-white mb-2.5 tracking-tight group-hover:text-brand-50 transition-colors line-clamp-2">
                      {service.title}
                    </h3>

                    {/* Subtext Description */}
                    <p className="text-brand-100/90 text-xs leading-relaxed font-normal line-clamp-3">
                      {service.description}
                    </p>
                  </div>

                  {/* Bottom Work & Bookings Link */}
                  <div className="mt-6 pt-3.5 flex items-center justify-between text-xs font-semibold text-brand-200 group-hover:text-white transition-colors border-t border-white/15">
                    <span>Vendor Partner Access</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform text-amber-300" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Coming Soon Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl p-7 sm:p-9 max-w-md w-full text-center shadow-2xl relative border border-gray-100 text-gray-900"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-[#026d77]/10 text-[#026d77] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#026d77]/20 shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>

              <span className="bg-[#026d77]/10 text-[#026d77] text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
                Feature Coming Soon 🚀
              </span>

              <h3 className="text-2xl font-bold font-playfair text-gray-900 mb-2">
                Wedding Business Hub
              </h3>

              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Our automated business portal is launching soon! You can contact us directly to register your business and get early partner access.
              </p>

              <div className="flex flex-col gap-3">
                <a
                  href="https://wa.me/919946341443?text=Hi%2C%20I%20want%20to%20register%20my%20wedding%20business%20on%20Malappuram%20Nikah"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 bg-[#026d77] hover:bg-[#03828e] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp: +91 99463 41443</span>
                </a>

                <a
                  href="tel:+919447868443"
                  className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-200"
                >
                  <Phone className="w-4 h-4 text-[#026d77]" />
                  <span>Call Us: +91 94478 68443</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
