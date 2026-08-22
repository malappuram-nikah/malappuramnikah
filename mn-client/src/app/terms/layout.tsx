import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Malappuram Nikah",
  description: "Terms and conditions for using Malappuram Nikah Muslim matrimonial matchmaking services.",
  alternates: {
    canonical: "https://www.malappuramnikah.com/terms",
  },
  openGraph: {
    title: "Terms of Service | Malappuram Nikah",
    description: "Terms and conditions for using Malappuram Nikah Muslim matrimonial matchmaking services.",
    url: "https://www.malappuramnikah.com/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
