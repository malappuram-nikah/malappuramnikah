"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getToken,
  isAdminSession,
  isAuthenticated,
  isTokenExpired,
  clearSession,
} from "@/lib/auth-session";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  status: AuthStatus;
  isAdmin: boolean;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function resolveAuth(): { status: AuthStatus; isAdmin: boolean } {
  const token = getToken();
  if (!token) {
    return { status: "unauthenticated", isAdmin: false };
  }
  if (isTokenExpired(token)) {
    clearSession();
    return { status: "unauthenticated", isAdmin: false };
  }
  return { status: "authenticated", isAdmin: isAdminSession() };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshAuth = useCallback(() => {
    const result = resolveAuth();
    setStatus(result.status);
    setIsAdmin(result.isAdmin);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [pathname, refreshAuth]);

  useEffect(() => {
    const onAuthChange = () => refreshAuth();
    window.addEventListener("mn-auth-change", onAuthChange);
    window.addEventListener("storage", onAuthChange);
    return () => {
      window.removeEventListener("mn-auth-change", onAuthChange);
      window.removeEventListener("storage", onAuthChange);
    };
  }, [refreshAuth]);

  return (
    <AuthContext.Provider value={{ status, isAdmin, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
