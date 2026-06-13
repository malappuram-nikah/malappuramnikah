"use client";

import React, { useState, useEffect } from "react";
import { useCompare } from "@/context/CompareContext";
import { X, Layers, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function CompareFloatingBar() {
  const { compareIds, removeFromCompare, clearCompare } = useCompare();
  const [profiles, setProfiles] = useState<any[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    if (compareIds.length === 0 || pathname === "/dashboard/compare") {
      setProfiles([]);
      return;
    }

    const fetchProfiles = async () => {
      try {
        const res = await fetch("http://localhost:3333/user/profiles");
        const data = await res.json();
        if (data.success && data.users) {
          const matched = data.users.filter((u: any) => compareIds.includes(u.id));
          const mapped = matched.map((u: any, i: number) => {
            let avatar = `https://i.pravatar.cc/200?img=${45 + (u.id % 20)}`;
            const photos = u.profile_details?.mn_profile_photos_draft?.photos;
            if (photos && photos.length > 0) {
              const primary = photos.find((p: any) => p.isPrimary);
              avatar = primary ? primary.dataUrl : photos[0].dataUrl;
            }
            return {
              id: u.id,
              name: `${u.first_name} ${u.last_name}`,
              img: avatar,
              age: u.dob ? Math.floor((new Date().getTime() - new Date(u.dob).getTime()) / 31557600000) : 25,
            };
          });
          setProfiles(mapped);
        }
      } catch (e) {
        console.error("Failed to load compared profiles info", e);
      }
    };

    fetchProfiles();
  }, [compareIds]);

  if (compareIds.length === 0 || pathname === "/dashboard/compare") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-gray-900 text-white rounded-2xl shadow-2xl border border-gray-800 p-4"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-600 rounded-xl text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Compare Profiles</h4>
              <p className="text-xs text-gray-400">
                {compareIds.length} of 3 profiles selected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto py-1 sm:py-0">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 bg-gray-805 px-2.5 py-1.5 rounded-xl border border-gray-800 text-xs shrink-0"
              >
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="font-medium truncate max-w-[80px]">{p.name}</span>
                <button
                  onClick={() => removeFromCompare(p.id)}
                  className="p-0.5 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            
            {/* Empty slots placeholders */}
            {Array.from({ length: 3 - compareIds.length }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-center w-28 h-9 border border-dashed border-gray-850 rounded-xl text-xs text-gray-600 shrink-0"
              >
                Slot Empty
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={clearCompare}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <Link
              href="/dashboard/compare"
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              Compare <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
