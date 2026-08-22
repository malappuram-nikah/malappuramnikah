import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Success Stories | Malappuram Nikah",
  description: "Read inspiring stories of couples who found their blessed Nikah partner through Malappuram Nikah.",
  alternates: {
    canonical: "https://malappuramnikah.com/success-stories",
  },
};

export default function SuccessStoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
