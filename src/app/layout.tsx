import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";

// Bangla-capable primary font (covers Bengali + Latin digits/labels in the UI).
const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ই-ট্রেড লাইসেন্স ট্র্যাকার",
  description:
    "ট্রেড লাইসেন্স ইস্যু, ট্র্যাকিং, বকেয়া আদায় ও বাল্ক এসএমএস — ইন্সপেক্টরদের জন্য SaaS প্ল্যাটফর্ম।",
  manifest: "/manifest.webmanifest",
  applicationName: "ই-ট্রেড লাইসেন্স ট্র্যাকার",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ট্রেড লাইসেন্স",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${notoBengali.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-bengali">{children}</body>
    </html>
  );
}
