"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API = "http://localhost:3333/user";

function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("mn_token") : null;
}

export interface ProfileActionsState {
  favouriteIds: Set<number>;
  blockedIds: Set<number>;
  loading: boolean;
  toggleFavourite: (targetId: number) => Promise<"FAVOURITED" | "UNFAVOURITED">;
  toggleBlock: (targetId: number) => Promise<"BLOCKED" | "UNBLOCKED">;
  isFavourite: (id: number) => boolean;
  isBlocked: (id: number) => boolean;
}

export function useProfileActions(): ProfileActionsState {
  const [favouriteIds, setFavouriteIds] = useState<Set<number>>(new Set());
  const [blockedIds, setBlockedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const token = getToken();
    if (!token) { setLoading(false); return; }

    fetch(`${API}/favourite`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (ctrl.signal.aborted) return;
        if (data.success) {
          setFavouriteIds(new Set<number>(data.favourite_ids ?? []));
          setBlockedIds(new Set<number>(data.blocked_ids ?? []));
        }
      })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });

    return () => ctrl.abort();
  }, []);

  const toggleFavourite = useCallback(async (targetId: number) => {
    const token = getToken();
    if (!token) return "UNFAVOURITED" as const;

    // Optimistic update
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      return next;
    });

    try {
      const res = await fetch(`${API}/favourite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target_id: targetId }),
      });
      const data = await res.json();
      // Reconcile: if API differs from our optimistic assumption, revert
      if (data.success) {
        setFavouriteIds((prev) => {
          const next = new Set(prev);
          if (data.status === "FAVOURITED") next.add(targetId);
          else next.delete(targetId);
          return next;
        });
        return data.status as "FAVOURITED" | "UNFAVOURITED";
      }
    } catch {}
    return "UNFAVOURITED" as const;
  }, []);

  const toggleBlock = useCallback(async (targetId: number) => {
    const token = getToken();
    if (!token) return "UNBLOCKED" as const;

    setBlockedIds((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      return next;
    });

    try {
      const res = await fetch(`${API}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target_id: targetId }),
      });
      const data = await res.json();
      if (data.success) {
        setBlockedIds((prev) => {
          const next = new Set(prev);
          if (data.status === "BLOCKED") next.add(targetId);
          else next.delete(targetId);
          return next;
        });
        return data.status as "BLOCKED" | "UNBLOCKED";
      }
    } catch {}
    return "UNBLOCKED" as const;
  }, []);

  return {
    favouriteIds,
    blockedIds,
    loading,
    toggleFavourite,
    toggleBlock,
    isFavourite: (id: number) => favouriteIds.has(id),
    isBlocked: (id: number) => blockedIds.has(id),
  };
}
