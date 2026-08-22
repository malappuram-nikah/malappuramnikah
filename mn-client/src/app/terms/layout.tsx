import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Malappuram Nikah",
  description: "Terms and conditions for using Malappuram Nikah Muslim matrimonial matchmaking services.",
  alternates: {
    canonical: "https://malappuramnikah.com/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
