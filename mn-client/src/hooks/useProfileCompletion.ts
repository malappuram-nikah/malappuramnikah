"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  fetchProfileCompletion,
  ProfileCompletionResult,
  strengthStyles,
} from "@/lib/profile-api";

export function useProfileCompletion() {
  const { currentUser, loadingUser, refreshUser, completion: userCompletion } = useUser();
  const [completion, setCompletion] = useState<any>(
    userCompletion || currentUser?.profileCompletion || null
  );
  const [loading, setLoading] = useState(loadingUser);
  const completionApiUnavailable = useRef(false);

  const applyCompletion = useCallback(
    (result: any) => {
      setCompletion(result);
    },
    []
  );

  const refreshCompletion = useCallback(async () => {
    if (!currentUser?.id) {
      setCompletion(null);
      return null;
    }
    if (completionApiUnavailable.current) {
      return currentUser.profileCompletion ?? null;
    }
    try {
      const result = await fetchProfileCompletion(currentUser.id);
      applyCompletion(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("endpoint not found") || message.includes("404")) {
        completionApiUnavailable.current = true;
      }
      console.warn("Profile completion API unavailable:", message);
      if (currentUser?.profileCompletion) {
        setCompletion(currentUser.profileCompletion);
      }
      return null;
    }
  }, [currentUser?.id, currentUser?.profileCompletion, applyCompletion]);

  useEffect(() => {
    if (loadingUser) {
      setLoading(true);
      return;
    }
    if (currentUser?.profileCompletion) {
      setCompletion(currentUser.profileCompletion);
      setLoading(false);
      return;
    }
    if (currentUser?.id) {
      setLoading(true);
      refreshCompletion().finally(() => setLoading(false));
    } else {
      setCompletion(null);
      setLoading(false);
    }
  }, [currentUser?.id, currentUser?.profileCompletion, loadingUser, refreshCompletion]);

  const styles = completion ? strengthStyles(completion.strength) : strengthStyles("Weak");

  return {
    completion,
    loading,
    percentage: completion?.percentage ?? 0,
    strength: completion?.strength ?? "Weak",
    incompleteSections: completion?.incompleteSections ?? [],
    sections: completion?.sections ?? [],
    styles,
    refreshCompletion,
    applyCompletion,
    refreshUser,
  };
}
