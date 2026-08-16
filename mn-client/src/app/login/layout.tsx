import type { Metadata } from "next";
import GuestAuthLayout from "@/components/auth/GuestAuthLayout";

export const metadata: Metadata = {
  title: "Sign In | Malappuram Nikah",
  description: "Sign in to your Malappuram Nikah account to find your perfect match.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <GuestAuthLayout mode="member">{children}</GuestAuthLayout>;
}
