import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "605 Wells | A Transformational Gathering Place",
  description: "A Kingdom hub where people are healed, built, and sent. Join us for discipling, deliverance, inner healing, and regional Kingdom impact in Jacksonville, FL.",
  keywords: ["605 Wells", "ministry", "church", "Jacksonville", "Kingdom", "discipling", "deliverance", "inner healing", "prayer"],
  authors: [{ name: "605 Wells Ministry" }],
  openGraph: {
    title: "605 Wells | A Transformational Gathering Place",
    description: "Where the waters run deep • Where people are healed, built, and sent",
    url: "https://605wells.com",
    siteName: "605 Wells",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "605 Wells | A Transformational Gathering Place",
    description: "Where the waters run deep • Where people are healed, built, and sent",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${montserrat.variable} antialiased font-sans`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
