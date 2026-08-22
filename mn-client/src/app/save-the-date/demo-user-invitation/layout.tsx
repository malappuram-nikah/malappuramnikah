import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Save the Date Digital Invitation | Malappuram Nikah",
  description: "Digital wedding invitation card preview with venue map, event details, and RSVP.",
  alternates: {
    canonical: "https://malappuramnikah.com/save-the-date/demo-user-invitation",
  },
  openGraph: {
    title: "Save the Date Digital Invitation | Malappuram Nikah",
    description: "Digital wedding invitation card preview with venue map, event details, and RSVP.",
    url: "https://malappuramnikah.com/save-the-date/demo-user-invitation",
  },
};

export default function SaveTheDateDemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
