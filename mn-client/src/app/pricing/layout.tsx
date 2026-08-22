import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium Membership Plans | Malappuram Nikah",
  description: "Explore affordable, trusted Muslim matrimonial plans with personalized matchmaking, contact views, and verified profiles.",
  alternates: {
    canonical: "https://www.malappuramnikah.com/pricing",
  },
  openGraph: {
    title: "Premium Membership Plans | Malappuram Nikah",
    description: "Explore affordable, trusted Muslim matrimonial plans with personalized matchmaking, contact views, and verified profiles.",
    url: "https://www.malappuramnikah.com/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
