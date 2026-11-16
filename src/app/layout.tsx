import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AirScout — Clean-air routing for India",
  description:
    "Compare driving routes by the air quality along them, not just the minutes saved. Live AQI from Open-Meteo, routing by OSRM.",
  applicationName: "AirScout",
  keywords: ["AQI", "air quality", "India", "routing", "pollution", "clean air"],
  openGraph: {
    title: "AirScout — Clean-air routing for India",
    description:
      "Find the route with cleaner air. Compare AQI exposure across alternative paths in Indian cities.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}