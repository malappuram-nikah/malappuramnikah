"use client";

import React, { useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Custom Range Slider
export function RangeSlider({
  min, max, value, onChange, title
}: {
  min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void; title: string;
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between text-xs font-semibold text-gray-500">
        <span>{title}</span>
        <span className="text-brand-600">{value[0]} - {value[1]}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <input 
            type="number" 
            value={value[0]} 
            min={min} max={value[1]} 
            onChange={e => onChange([Number(e.target.value), value[1]])} 
            className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-center focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" 
          />
        </div>
        <span className="text-gray-400 font-medium text-sm">to</span>
        <div className="relative flex-1">
          <input 
            type="number" 
            value={value[1]} 
            min={value[0]} max={max} 
            onChange={e => onChange([value[0], Number(e.target.value)])} 
            className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-center focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" 
          />
        </div>
      </div>
    </div>
  );
}

// Custom Multi-Select with Search
export function MultiSelect({
  title, options, selected, onChange, placeholder, isPremium = false, isUserPremium = false
}: {
  title: string; options: string[]; selected: string[]; onChange: (v: string[]) => void; placeholder: string; isPremium?: boolean; isUserPremium?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  
  const disabled = isPremium && !isUserPremium;

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(x => x !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex justify-between text-xs font-semibold text-gray-700">
        <span className="flex items-center gap-1">
          {title}
          {isPremium && <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Premium</span>}
        </span>
        {selected.length > 0 && <span className="text-brand-600">{selected.length} selected</span>}
      </div>
      <div className="relative">
        <button 
          onClick={() => !disabled && setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        >
          <span className={selected.length ? "text-gray-900 truncate" : "text-gray-400"}>
            {selected.length ? selected.join(", ") : placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg shadow-gray-200/50 max-h-60 overflow-hidden flex flex-col"
            >
              <div className="p-2 border-b border-gray-50 flex items-center gap-2 text-gray-400">
                <Search className="w-4 h-4" />
                <input 
                  type="text" 
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  placeholder="Search..." 
                  className="w-full text-sm outline-none text-gray-700 placeholder:text-gray-400"
                />
              </div>
              <div className="overflow-y-auto p-1 hide-scrollbar">
                {filtered.length === 0 && <p className="p-3 text-center text-sm text-gray-500">No options found</p>}
                {filtered.map(opt => {
                  const active = selected.includes(opt);
                  return (
                    <div 
                      key={opt}
                      onClick={() => toggle(opt)}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer group"
                    >
                      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${active ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300 group-hover:border-brand-400 text-transparent'}`}>
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <span className={`text-sm ${active ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{opt}</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Simple Boolean Toggle
export function FilterToggle({ 
  title, description, checked, onChange 
}: { 
  title: string; description?: string; checked: boolean; onChange: (v: boolean) => void 
}) {
  return (
    <div className="flex items-center justify-between w-full py-1">
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-800">{title}</span>
        {description && <span className="text-[10px] text-gray-500">{description}</span>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${checked ? 'bg-brand-600' : 'bg-gray-200'}`}
      >
        <span className="sr-only">Use setting</span>
        <span aria-hidden="true" className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-2' : '-translate-x-2'}`} />
      </button>
    </div>
  );
}
