import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Partner | Malappuram Nikah",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
