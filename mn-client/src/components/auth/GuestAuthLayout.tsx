"use client";

import PublicAuthGuard from "@/components/auth/PublicAuthGuard";

export default function GuestAuthLayout({
  children,
  mode = "member",
}: {
  children: React.ReactNode;
  mode?: "member" | "admin";
}) {
  return <PublicAuthGuard mode={mode}>{children}</PublicAuthGuard>;
}
