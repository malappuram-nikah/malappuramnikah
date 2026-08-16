/** Shared auth session helpers — single source of truth for mn_token. */

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
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("mn-auth-change"));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
  document.cookie = "mn_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
  window.dispatchEvent(new Event("mn-auth-change"));
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
  sessionStorage.setItem(RETURN_URL_KEY, url);
}

export function consumeReturnUrl(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;
  const url = sessionStorage.getItem(RETURN_URL_KEY);
  sessionStorage.removeItem(RETURN_URL_KEY);
  if (!url || url.startsWith("/login") || url.startsWith("/admin/login")) {
    return fallback;
  }
  return url;
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
  const url = sessionStorage.getItem(RETURN_URL_KEY);
  sessionStorage.removeItem(RETURN_URL_KEY);
  if (!url || url.startsWith("/login") || url.startsWith("/admin/login")) {
    return "/admin";
  }
  const normalized = url.replace(/^\/dashboard\/admin/, "/admin");
  if (normalized.startsWith("/admin")) {
    return normalized;
  }
  return "/admin";
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
