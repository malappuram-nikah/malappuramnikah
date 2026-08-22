import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Matches | Malappuram Nikah",
  description: "Explore verified Muslim matrimonial profiles in Malappuram and Kerala. Find your compatible life partner.",
  alternates: {
    canonical: "https://malappuramnikah.com/matches",
  },
};

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
