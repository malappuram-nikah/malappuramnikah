import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";
import JsonLd from "@/components/seo/JsonLd";
import { getHomepageStructuredData } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.malappuramnikah.com",
  },
};

export default function HomePage() {
  const jsonLd = getHomepageStructuredData();
  return (
    <>
      <JsonLd data={jsonLd} />
      <HomePageClient />
    </>
  );
}

