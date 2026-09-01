import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import "@/lib/safari-compat";
import { Toaster } from "sonner";
import AppProviders from "@/components/auth/AppProviders";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#026d77",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.malappuramnikah.com"),
  title: "Malappuram Nikah | Trusted Malappuram Muslim Matrimony",
  description: "Welcome to Malappuram Nikah, the leading Kerala Muslim matrimonial service. Experience trusted Muslim matchmaking and secure Muslim matrimony today.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/favicon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Malappuram Nikah | Trusted Malappuram Muslim Matrimony",
    description: "Welcome to Malappuram Nikah, the leading Kerala Muslim matrimonial service. Experience trusted Muslim matchmaking and secure Muslim matrimony today.",
    url: "https://www.malappuramnikah.com",
    siteName: "Malappuram Nikah",
    images: [
      {
        url: "https://www.malappuramnikah.com/Mlogo-01.png",
        width: 3509,
        height: 2481,
        alt: "Malappuram Nikah - Trusted Kerala Muslim Matrimony",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Malappuram Nikah | Trusted Malappuram Muslim Matrimony",
    description: "Welcome to Malappuram Nikah, the leading Kerala Muslim matrimonial service. Experience trusted Muslim matchmaking and secure Muslim matrimony today.",
    images: ["https://www.malappuramnikah.com/Mlogo-01.png"],
  },
  verification: {
    google: "googlef2ec5e01971e812f",
  },
  other: {
    "og:updated_time": "2026-08-22T13:16:27+05:30",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-background text-text-primary antialiased min-h-screen flex flex-col">
        <AppProviders>
          {children}
        </AppProviders>
        <Toaster position="bottom-left" />
      </body>
    </html>
  );
}
