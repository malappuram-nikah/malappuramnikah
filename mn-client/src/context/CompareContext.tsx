"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CompareContextType {
  compareIds: number[];
  addToCompare: (id: number) => void;
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
  isCompared: (id: number) => boolean;
  alertMsg: string | null;
  setAlertMsg: (msg: string | null) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mn_compare_ids");
    if (stored) {
      try {
        setCompareIds(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse compare ids", e);
      }
    }
  }, []);

  const addToCompare = (id: number) => {
    if (compareIds.includes(id)) return;
    if (compareIds.length >= 3) {
      setAlertMsg("You can compare up to 3 profiles at a time.");
      return;
    }
    const updated = [...compareIds, id];
    setCompareIds(updated);
    localStorage.setItem("mn_compare_ids", JSON.stringify(updated));
    setAlertMsg("Added to comparison list.");
  };

  const removeFromCompare = (id: number) => {
    const updated = compareIds.filter((x) => x !== id);
    setCompareIds(updated);
    localStorage.setItem("mn_compare_ids", JSON.stringify(updated));
    setAlertMsg("Removed from comparison list.");
  };

  const clearCompare = () => {
    setCompareIds([]);
    localStorage.removeItem("mn_compare_ids");
    setAlertMsg("Cleared comparison list.");
  };

  const isCompared = (id: number) => compareIds.includes(id);

  // Automatically dismiss alerts
  useEffect(() => {
    if (alertMsg) {
      const t = setTimeout(() => setAlertMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alertMsg]);

  return (
    <CompareContext.Provider
      value={{
        compareIds,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isCompared,
        alertMsg,
        setAlertMsg,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
