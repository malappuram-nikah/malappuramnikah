import { safeLocalStorage, safeSessionStorage } from "@/lib/safe-storage";

export const TOKEN_KEY = "mn_token";
export const RETURN_URL_KEY = "mn_return_url";

export interface TokenPayload {
  userId?: number;
  role?: string;
  isAdmin?: boolean;
  exp?: number;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const local = safeLocalStorage.getItem(TOKEN_KEY);
    if (local && local.trim()) return local.trim();
  } catch {}
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`));
    if (match && match[1]) return decodeURIComponent(match[1]).trim();
  } catch {}
  return null;
}

export function setToken(token: string): void {
  if (typeof window === "undefined" || !token) return;
  const clean = token.trim();
  try {
    safeLocalStorage.setItem(TOKEN_KEY, clean);
  } catch {}
  try {
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(clean)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } catch {}
  try {
    window.dispatchEvent(new Event("mn-auth-change"));
  } catch {}
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    safeLocalStorage.clear();
    safeSessionStorage.clear();
  } catch {}
  try {
    document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax";
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
  } catch {}
  try {
    window.dispatchEvent(new Event("mn-auth-change"));
  } catch {}
}

export function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  if (isTokenExpired(token)) {
    clearSession();
    return false;
  }
  return true;
}

export function isAdminSession(): boolean {
  const token = getToken();
  if (!token || isTokenExpired(token)) return false;
  const payload = decodeTokenPayload(token);
  return payload?.isAdmin === true || payload?.role === "admin";
}

export function getUserIdFromToken(): number | null {
  const token = getToken();
  if (!token) return null;
  const payload = decodeTokenPayload(token);
  return payload?.userId ?? null;
}

export function setReturnUrl(url: string): void {
  if (typeof window === "undefined") return;
  try {
    safeSessionStorage.setItem(RETURN_URL_KEY, url);
  } catch {}
}

export function consumeReturnUrl(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;
  try {
    const url = safeSessionStorage.getItem(RETURN_URL_KEY);
    safeSessionStorage.removeItem(RETURN_URL_KEY);
    if (!url || url.startsWith("/login") || url.startsWith("/admin/login")) {
      return fallback;
    }
    return url;
  } catch {
    return fallback;
  }
}

export function getPostLoginRedirect(): string {
  const url = consumeReturnUrl("/dashboard");
  if (url.startsWith("/admin")) {
    return "/dashboard";
  }
  return url;
}

export function getPostAdminLoginRedirect(): string {
  if (typeof window === "undefined") return "/admin";
  try {
    const url = safeSessionStorage.getItem(RETURN_URL_KEY);
    safeSessionStorage.removeItem(RETURN_URL_KEY);
    if (!url || url.startsWith("/login") || url.startsWith("/admin/login")) {
      return "/admin";
    }
    const normalized = url.replace(/^\/dashboard\/admin/, "/admin");
    if (normalized.startsWith("/admin")) {
      return normalized;
    }
    return "/admin";
  } catch {
    return "/admin";
  }
}

/** Paths that require normal user authentication */
export function isUserProtectedPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard");
}

/** Paths that require admin authentication */
export function isAdminProtectedPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Paths that require authentication */
export function isProtectedPath(pathname: string): boolean {
  return isUserProtectedPath(pathname) || isAdminProtectedPath(pathname);
}

/** Guest-only auth pages */
export function isGuestAuthPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/admin/login" ||
    pathname === "/business/login" ||
    pathname === "/business/register"
  );
}
