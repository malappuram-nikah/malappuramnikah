import type { Metadata } from "next";
import GuestAuthLayout from "@/components/auth/GuestAuthLayout";

export const metadata: Metadata = {
  title: "Reset Password | Malappuram Nikah",
  description: "Reset your Malappuram Nikah account password.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <GuestAuthLayout mode="member">{children}</GuestAuthLayout>;
}
