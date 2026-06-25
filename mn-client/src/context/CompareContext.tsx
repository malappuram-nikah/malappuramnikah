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

  const getStorageKey = () => {
    if (typeof window === "undefined") return "mn_compare_ids_guest";
    const token = localStorage.getItem("mn_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.userId) {
          return `mn_compare_ids_${payload.userId}`;
        }
      } catch (e) {}
    }
    return "mn_compare_ids_guest";
  };

  useEffect(() => {
    const handleSync = () => {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setCompareIds(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse compare ids", e);
        }
      } else {
        setCompareIds([]);
      }
    };

    handleSync();

    window.addEventListener("storage", handleSync);
    window.addEventListener("focus", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, []);

  const addToCompare = (id: number) => {
    if (compareIds.includes(id)) return;
    if (compareIds.length >= 3) {
      setAlertMsg("You can compare up to 3 profiles at a time.");
      return;
    }
    const updated = [...compareIds, id];
    setCompareIds(updated);
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(updated));
    setAlertMsg("Added to comparison list.");
  };

  const removeFromCompare = (id: number) => {
    const updated = compareIds.filter((x) => x !== id);
    setCompareIds(updated);
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(updated));
    setAlertMsg("Removed from comparison list.");
  };

  const clearCompare = () => {
    setCompareIds([]);
    const key = getStorageKey();
    localStorage.removeItem(key);
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
