"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { clearSession, getToken, isAdminSession } from "@/lib/auth-session";

import { getProfileCompletionStatus, ProfileCompletionResult } from "@/lib/profile-utils";

interface UserContextType {
  currentUser: any;
  loadingUser: boolean;
  refreshUser: () => Promise<any>;
  completion: ProfileCompletionResult;
  completionPercent: number;
  strength: string;
  strengthColor: string;
  missingSections: any[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const completion: ProfileCompletionResult = React.useMemo(() => {
    return getProfileCompletionStatus(currentUser);
  }, [currentUser]);

  const fetchUser = useCallback(async () => {
    const token = getToken();
    if (!token || isAdminSession()) {
      setCurrentUser(null);
      setLoadingUser(false);
      return null;
    }
    try {
      let userId = null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
      } catch (e) {
        console.error("Token decoding error in context", e);
      }

      if (!userId) {
        setCurrentUser(null);
        setLoadingUser(false);
        return null;
      }

      const res = await fetch(`${API_URL}/user/${userId}?t=${Date.now()}`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: "no-store"
      });
      if (res.status === 401 || res.status === 403) {
        clearSession();
        setCurrentUser(null);
        setLoadingUser(false);
        return null;
      }
      const data = await res.json();
      if (data.success && data.user) {
        const user = data.user;
        setCurrentUser(user);

        // Sync backend profile details to localStorage (as needed by tracker/other steps)
        const cachedUserId = localStorage.getItem("mn_logged_in_user_id");
        if (cachedUserId !== String(userId)) {
          // Clear old draft keys first to prevent stale cache when user changes
          const draftKeys = [
            "mn_basic_details_draft",
            "mn_religious_info_draft",
            "mn_professional_info_draft",
            "mn_family_details_draft",
            "mn_interests_draft",
            "mn_habits_draft",
            "mn_partner_preferences_draft",
            "mn_profile_photos_draft",
            "mn_voice_intro_draft"
          ];
          draftKeys.forEach(k => localStorage.removeItem(k));
        }

        if (user.profile_details) {
          Object.entries(user.profile_details).forEach(([key, value]) => {
            if (value) {
              localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            }
          });
        }

        // Sync KYC status to localStorage
        localStorage.setItem("mn_kyc_status", user.kyc_status || "NOT_SUBMITTED");

        // Pre-populate step 1 draft from core signup details if not already saved
        const basicKey = "mn_basic_details_draft";
        if (!localStorage.getItem(basicKey)) {
          let calculatedAge = "24";
          if (user.dob) {
            const birthYear = parseInt(user.dob.split("-")[0], 10);
            if (!isNaN(birthYear)) {
              calculatedAge = (new Date().getFullYear() - birthYear).toString();
            }
          }
          const defaultBasic = {
            name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
            profileFor: user.profile_for || "Myself",
            gender: user.gender || "Male",
            location: user.location || "Malappuram, Kerala",
            presentLocation: user.location || "Malappuram",
            age: calculatedAge,
            aboutMe: "Looking for a pious, family-oriented partner with shared values.",
            height: "",
            maritalStatus: "Single",
            motherTongue: "Malayalam",
            physicalStatus: "Normal",
            appearance: "",
            weight: "",
            languagesSpoken: "Malayalam, English"
          };
          localStorage.setItem(basicKey, JSON.stringify(defaultBasic));
        }

        // Pre-populate step 2 draft (Religious) from community column if not already saved
        const religiousKey = "mn_religious_info_draft";
        if (!localStorage.getItem(religiousKey)) {
          const defaultReligious = {
            religion: "Islam",
            community: user.cast || "Sunni",
            religiousness: "Pious"
          };
          localStorage.setItem(religiousKey, JSON.stringify(defaultReligious));
        }

        localStorage.setItem("mn_logged_in_user_id", String(userId));
        return user;
      }
    } catch (e) {
      console.error("Failed to fetch user in context:", e);
    } finally {
      setLoadingUser(false);
    }
    return null;
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        loadingUser,
        refreshUser: fetchUser,
        completion,
        completionPercent: completion.percentage,
        strength: completion.strength,
        strengthColor: completion.strengthColor,
        missingSections: completion.missingSections,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
