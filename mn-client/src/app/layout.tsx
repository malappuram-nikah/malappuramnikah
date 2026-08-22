import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AppProviders from "@/components/auth/AppProviders";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://malappuramnikah.com"),
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable}`}>
      <body className="font-sans bg-background text-text-primary antialiased min-h-screen flex flex-col">
        <AppProviders>
          {children}
        </AppProviders>
        <Toaster position="bottom-left" />
      </body>
    </html>
  );
}
