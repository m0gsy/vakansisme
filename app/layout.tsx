import type { Metadata } from "next";
import { Barlow_Condensed, Manrope, Special_Elite } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import OnboardingBanner from "@/components/OnboardingBanner";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vakansisme.club";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Vakansisme — Summit to Story.",
    template: "%s | Vakansisme",
  },
  description:
    "Outdoor community and media platform for Indonesian youth. Expeditions, stories, chaos. Not a hiking website — this is culture.",
  keywords: ["ekspedisi", "outdoor", "hiking", "pendakian", "komunitas alam", "petualangan", "Indonesia"],
  authors: [{ name: "Vakansisme" }],
  creator: "Vakansisme",
  publisher: "Vakansisme",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    siteName: "Vakansisme",
    title: "Vakansisme — Summit to Story.",
    description: "Outdoor community and media platform for Indonesian youth. Expeditions, stories, chaos.",
    type: "website",
    url: SITE_URL,
    locale: "id_ID",
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: "Vakansisme" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@vakansisme",
    creator: "@vakansisme",
    title: "Vakansisme — Summit to Story.",
    description: "Outdoor community and media platform for Indonesian youth. Expeditions, stories, chaos.",
    images: [`${SITE_URL}/og-default.jpg`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Vakansisme",
  url: SITE_URL,
  description: "Outdoor community and media platform for Indonesian youth. Expeditions, stories, chaos.",
  sameAs: ["https://instagram.com/vakansisme"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${barlowCondensed.variable} ${manrope.variable} ${specialElite.variable}`}
    >
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://supabase.co"} />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ToastProvider>{children}<OnboardingBanner /></ToastProvider>
      </body>
    </html>
  );
}
