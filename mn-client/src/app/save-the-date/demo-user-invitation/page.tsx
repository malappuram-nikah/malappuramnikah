"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Heart, MapPin, Calendar, Clock, Bell, Map, Gift, CheckCircle2, ChevronDown } from "lucide-react";

// Templates Configuration
const templates = {
  "traditional-emerald": {
    bgClass: "bg-[#012526] text-[#dfb15b]",
    accentColor: "#dfb15b",
    textColor: "text-[#dfb15b]",
    accentBg: "bg-[#023e3f]",
    borderColor: "border-[#dfb15b]/30",
    btnClass: "bg-[#dfb15b] hover:bg-[#cf9e4b] text-[#012526]"
  },
  "royal-gold": {
    bgClass: "bg-[#2d020a] text-[#ffd700]",
    accentColor: "#ffd700",
    textColor: "text-[#ffd700]",
    accentBg: "bg-[#5c0618]",
    borderColor: "border-[#ffd700]/30",
    btnClass: "bg-[#ffd700] hover:bg-[#e6c200] text-[#2d020a]"
  },
  "minimalist-pastel": {
    bgClass: "bg-[#FAF5F3] text-[#4A3B32]",
    accentColor: "#8C6A5C",
    textColor: "text-[#8C6A5C]",
    accentBg: "bg-[#FAF5F3] border border-[#8C6A5C]/20",
    borderColor: "border-[#8C6A5C]/20",
    btnClass: "bg-[#8C6A5C] hover:bg-[#725447] text-white"
  },
  "modern-floral": {
    bgClass: "bg-[#e4ede7] text-[#2f4f4f]",
    accentColor: "#4e7c5e",
    textColor: "text-[#4e7c5e]",
    accentBg: "bg-[#f3f7f4]",
    borderColor: "border-[#4e7c5e]/30",
    btnClass: "bg-[#4e7c5e] hover:bg-[#3d634a] text-white"
  }
};

function InvitationContent() {
  const searchParams = useSearchParams();
  
  // Read params or use defaults
  const templateId = searchParams.get("template") || "traditional-emerald";
  const bride = searchParams.get("bride") || "Aysha";
  const groom = searchParams.get("groom") || "Faisal";
  const date = searchParams.get("date") || "2026-12-18";
  const time = searchParams.get("time") || "10:30";
  const venue = searchParams.get("venue") || "Grand Royal Auditorium";
  const address = searchParams.get("address") || "Kottakkal, Malappuram, Kerala";
  const message = searchParams.get("msg") || "Together with our families, we invite you to share in our joy as we begin our new journey.";
  const photo = searchParams.get("photo") || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80";

  const template = templates[templateId as keyof typeof templates] || templates["traditional-emerald"];

  // Countdown calculations
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpStatus, setRsvpStatus] = useState<"none" | "attending" | "declined">("none");
  const [guestCount, setGuestCount] = useState(1);
  const [congratsMsg, setCongratsMsg] = useState("");
  const [submittedRsvp, setSubmittedRsvp] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(date + "T" + time) - +new Date();
      let timeLeftVal = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        timeLeftVal = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      setTimeLeft(timeLeftVal);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [date, time]);

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedRsvp(true);
  };

  return (
    <div className={`min-h-screen ${template.bgClass} flex flex-col items-center justify-start overflow-x-hidden font-serif`}>
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] bg-[size:32px_32px] opacity-[0.03] pointer-events-none" />

      {/* Cinematic Invitation Card Container */}
      <main className="w-full max-w-2xl px-4 md:px-8 py-12 md:py-20 relative flex flex-col items-center space-y-12">
        {/* Decorative borders */}
        <div className={`absolute inset-4 md:inset-8 border-2 ${template.borderColor} pointer-events-none rounded-2xl z-0`} />
        <div className={`absolute inset-6 md:inset-10 border border-dashed ${template.borderColor} pointer-events-none rounded-xl z-0`} />

        {/* Save The Date Callout */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10"
        >
          <span className="text-xs md:text-sm tracking-[0.4em] uppercase opacity-80">Save The Date</span>
          <div className="w-16 h-px bg-current opacity-30 mx-auto my-4" />
        </motion.div>

        {/* Bride & Groom names */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 1 }}
          className="text-center z-10 space-y-4"
        >
          <h1 className="text-4xl md:text-6xl font-playfair font-bold tracking-wide">
            {bride}
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-current opacity-30" />
            <Heart className="w-6 h-6 fill-current animate-pulse text-red-500" />
            <div className="h-px w-8 bg-current opacity-30" />
          </div>
          <h1 className="text-4xl md:text-6xl font-playfair font-bold tracking-wide">
            {groom}
          </h1>
          <p className="text-sm md:text-base italic opacity-85 mt-4">Are getting married</p>
        </motion.div>

        {/* Wedding Photo */}
        {photo && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl z-10 my-4"
          >
            <img src={photo} alt={`${bride} and ${groom}`} className="w-full h-full object-cover" />
          </motion.div>
        )}

        {/* Wedding Date Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center z-10 space-y-2"
        >
          <div className="flex justify-center items-center gap-2 text-sm md:text-base">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-center items-center gap-2 text-sm md:text-base opacity-90">
            <Clock className="w-4 h-4" />
            <span>At {time} AM</span>
          </div>
        </motion.div>

        {/* Countdown Timer */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className={`w-full max-w-md ${template.accentBg} backdrop-blur-md rounded-3xl py-6 px-6 border ${template.borderColor} text-center z-10 shadow-xl`}
        >
          <p className="text-xs uppercase tracking-widest mb-4 opacity-80 font-bold">COUNTDOWN TO CELEBRATION</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { value: timeLeft.days, label: "Days" },
              { value: timeLeft.hours, label: "Hours" },
              { value: timeLeft.minutes, label: "Mins" },
              { value: timeLeft.seconds, label: "Secs" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-3xl md:text-4xl font-bold font-playfair">{item.value.toString().padStart(2, "0")}</span>
                <span className="text-[10px] md:text-xs uppercase tracking-wider opacity-70 mt-1">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Message / Love Story */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center max-w-lg px-6 z-10 leading-relaxed italic text-sm md:text-base opacity-90"
        >
          &quot;{message}&quot;
        </motion.div>

        {/* Venue Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center z-10 space-y-3"
        >
          <div className="w-12 h-px bg-current opacity-30 mx-auto" />
          <h3 className="text-lg md:text-xl font-bold tracking-widest uppercase flex items-center justify-center gap-1.5">
            <MapPin className="w-5 h-5 text-red-500" /> Venue
          </h3>
          <p className="font-bold text-base md:text-lg">{venue}</p>
          <p className="text-xs md:text-sm opacity-80 max-w-xs mx-auto">{address}</p>

          {/* Map Link */}
          <div className="pt-2">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue + ", " + address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-widest border border-current/25 px-4 py-2 rounded-full hover:bg-white/10 transition-colors mt-2`}
            >
              <Map className="w-3.5 h-3.5" /> Navigate on Google Maps
            </a>
          </div>
        </motion.div>

        {/* RSVP Form Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className={`w-full max-w-md ${template.accentBg} backdrop-blur-md rounded-3xl p-6 border ${template.borderColor} z-10 shadow-xl`}
        >
          <h3 className="text-lg font-bold tracking-wider mb-2 text-center uppercase">Will you join us?</h3>
          <p className="text-xs opacity-75 text-center mb-6">Please RSVP by filling out the details below</p>

          {submittedRsvp ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <h4 className="font-bold text-lg">Thank You!</h4>
              <p className="text-xs opacity-80">Your response has been successfully sent to {bride} and {groom}.</p>
            </div>
          ) : (
            <form onSubmit={handleRsvpSubmit} className="space-y-4 text-left">
              {/* RSVP Status */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">Your attendance</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRsvpStatus("attending")}
                    className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all text-center ${
                      rsvpStatus === "attending"
                        ? "bg-white text-black border-white shadow"
                        : "border-current/20 hover:bg-white/5"
                    }`}
                  >
                    Joyfully Attend
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpStatus("declined")}
                    className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all text-center ${
                      rsvpStatus === "declined"
                        ? "bg-white text-black border-white shadow"
                        : "border-current/20 hover:bg-white/5"
                    }`}
                  >
                    Regretfully Decline
                  </button>
                </div>
              </div>

              {rsvpStatus === "attending" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">Number of Guests</label>
                  <select 
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/10 border border-current/25 text-xs text-inherit focus:outline-none focus:bg-black/35"
                  >
                    {[1,2,3,4,5].map(n => (
                      <option key={n} value={n} className="text-black">{n} {n === 1 ? "Guest" : "Guests"}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">Wishes / Congratulatory Note</label>
                <textarea 
                  rows={2}
                  value={congratsMsg}
                  placeholder="Leave a message..."
                  onChange={(e) => setCongratsMsg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/10 border border-current/25 text-xs text-inherit focus:outline-none focus:bg-black/35 placeholder:text-inherit/50"
                />
              </div>

              <button
                type="submit"
                disabled={rsvpStatus === "none"}
                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-all ${template.btnClass} disabled:opacity-50 disabled:pointer-events-none`}
              >
                Submit Response
              </button>
            </form>
          )}
        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="w-full py-8 text-center text-xs opacity-60 z-10 mt-auto border-t border-current/10">
        <p>Digitally powered by Malappuram Nikah</p>
      </footer>
    </div>
  );
}

export default function PublicSaveTheDate() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#012526] flex items-center justify-center text-white text-sm">Loading invitation...</div>}>
      <InvitationContent />
    </Suspense>
  );
}
