import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Malappuram Nikah",
  description: "Read about how Malappuram Nikah protects your personal information, profile photos, and verification documents.",
  alternates: {
    canonical: "https://malappuramnikah.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Malappuram Nikah",
    description: "Read about how Malappuram Nikah protects your personal information, profile photos, and verification documents.",
    url: "https://malappuramnikah.com/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
