"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function AdminAlert({
  alert,
}: {
  alert: { type: "success" | "error"; text: string } | null;
}) {
  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md flex items-center gap-3 ${
            alert.type === "success"
              ? "bg-brand-50/90 text-brand-800 border-brand-200"
              : "bg-red-50/90 text-red-800 border-red-200"
          }`}
        >
          <ShieldCheck
            className={`w-5 h-5 ${alert.type === "success" ? "text-brand-600" : "text-red-600"}`}
          />
          <span className="text-xs font-semibold">{alert.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
