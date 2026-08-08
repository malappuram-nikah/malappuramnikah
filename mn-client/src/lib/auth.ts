"use client";

/**
 * Performs a complete and clean sign out by:
 * - Wiping all items from localStorage (token, draft data, KYC, preferences)
 * - Wiping sessionStorage
 * - Expiring authentication cookies (refresh_token, mn_token)
 * - Redirecting the user to the login page
 */
export function handleSignOut() {
  if (typeof window === "undefined") return;

  try {
    // 1. Clear all items from localStorage
    localStorage.clear();

    // 2. Clear sessionStorage
    sessionStorage.clear();

    // 3. Clear all potential auth cookies
    document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
    document.cookie = "mn_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
  } catch (e) {
    console.error("Error during sign out:", e);
  }

  // 4. Force hard redirect to login page to reset all in-memory React state
  window.location.href = "/login";
}
