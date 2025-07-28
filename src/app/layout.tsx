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
  title: "605 Wells - A Transformational Gathering Place",
  description: "A Kingdom Hub where people are healed, built, and sent. Join us as Kingdom Builders in creating a regional transformation center.",
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
