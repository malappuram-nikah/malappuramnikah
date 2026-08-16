"use client";

import { clearSession, isAdminSession } from "@/lib/auth-session";

/**
 * Signs out the current session and redirects to the appropriate login page.
 */
export function handleSignOut() {
  if (typeof window === "undefined") return;

  const wasAdmin = isAdminSession();

  try {
    clearSession();
  } catch (e) {
    console.error("Error during sign out:", e);
  }

  window.location.href = wasAdmin ? "/admin/login" : "/login";
}
