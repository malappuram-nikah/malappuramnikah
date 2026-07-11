import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Malappuram Nikah | Premium Matrimony",
  description: "Find your perfect life partner with our premium, secure, and trusted matchmaking service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable}`}>
      <body className="font-sans bg-background text-text-primary antialiased min-h-screen flex flex-col">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
