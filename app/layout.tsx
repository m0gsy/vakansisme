import type { Metadata } from "next";
import { Barlow_Condensed, Manrope, Special_Elite } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import OnboardingBanner from "@/components/OnboardingBanner";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  icons: { icon: "/logo.png" },
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

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Vakansisme",
  url: SITE_URL,
  description: "Outdoor community and media platform for Indonesian youth. Expeditions, stories, chaos.",
  sameAs: ["https://instagram.com/vakansisme"],
};

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Vakansisme",
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "en" ? "en" : "id";
  return (
    <html
      lang={locale}
      className={`${barlowCondensed.variable} ${manrope.variable} ${specialElite.variable}`}
    >
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://supabase.co"} />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }} />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ToastProvider>{children}<OnboardingBanner /></ToastProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
