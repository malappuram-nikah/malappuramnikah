import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | Malappuram Nikah",
  description: "Refund and cancellation policy for Malappuram Nikah matrimonial memberships and services.",
  alternates: {
    canonical: "https://malappuramnikah.com/refund",
  },
  openGraph: {
    title: "Refund Policy | Malappuram Nikah",
    description: "Refund and cancellation policy for Malappuram Nikah matrimonial memberships and services.",
    url: "https://malappuramnikah.com/refund",
  },
};

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
