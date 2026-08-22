import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://malappuramnikah.com",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
