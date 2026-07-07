"use client";

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return null;

  const currentLang = i18n.language || "en";

  const languages = [
    { code: "en", name: "English" },
    { code: "ml", name: "മലയാളം (Malayalam)" },
  ];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-brand-600 transition-colors border border-transparent hover:border-gray-150"
        title="Switch Language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-bold uppercase">{currentLang.substring(0, 2)}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-150 shadow-xl rounded-xl overflow-hidden z-50"
          >
            <div className="p-2 border-b border-gray-50 bg-gray-50/50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Select Language</p>
            </div>
            <div className="p-1.5 flex flex-col gap-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                    currentLang.startsWith(lang.code)
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
