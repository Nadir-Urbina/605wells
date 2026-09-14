import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import RecaptchaProvider from "@/components/RecaptchaProvider";
import "./globals.css";
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
  title: "East Gate Revival Hub | A Transformational Gathering Place",
  description: "A Kingdom hub where people are healed, built, and sent. Join us for discipling, deliverance, inner healing, and regional Kingdom impact in Orange Park, FL.",
  keywords: ["East Gate Revival Hub", "East Gate Jax", "ministry", "church", "Orange Park", "Jacksonville", "Kingdom", "discipling", "deliverance", "inner healing", "prayer"],
  authors: [{ name: "East Gate Revival Hub" }],
  openGraph: {
    title: "East Gate Revival Hub | A Transformational Gathering Place",
    description: "Where the waters run deep • Where people are healed, built, and sent",
    url: "https://www.eastgatejax.com",
    siteName: "East Gate Revival Hub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "East Gate Revival Hub | A Transformational Gathering Place",
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
        <RecaptchaProvider>
          {children}
          <Analytics />
        </RecaptchaProvider>
      </body>
    </html>
  );
}
