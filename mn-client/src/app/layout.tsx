import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-background text-text-primary antialiased min-h-screen flex flex-col">
        {children}
        <Toaster position="bottom-left" />
      </body>
    </html>
  );
}
