"use client";

import { useEffect, useState } from "react";

/**
 * Returns false during SSR and the first client render so guarded pages
 * match server HTML and avoid hydration mismatches from localStorage auth.
 */
export function useClientMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
