import type { Metadata } from "next";
import { Barlow_Condensed, Manrope, Special_Elite } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-special-elite",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Vakansisme — Summit to Story.",
    template: "%s",
  },
  description:
    "Outdoor community and media platform for youth. Expeditions, Journal, Chaos Wall. Not a hiking website — this is culture.",
  openGraph: {
    title: "Vakansisme",
    description: "Lost in nature, found in chaos.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${manrope.variable} ${specialElite.variable}`}
    >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
