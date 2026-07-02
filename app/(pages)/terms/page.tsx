import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vakansisme.club";

export const metadata: Metadata = {
  title: "Terms of Use — Vakansisme",
  description: "Syarat dan ketentuan penggunaan platform Vakansisme — komunitas outdoor dan ekspedisi Indonesia.",
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: "Terms of Use — Vakansisme",
    description: "Syarat dan ketentuan penggunaan platform Vakansisme.",
    url: `${SITE_URL}/terms`,
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-3xl mx-auto px-6">
        <Link href="/" className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-10" style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}>
          ← HOME
        </Link>
        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "48px" }}>
          TERMS OF USE
        </h1>
        <div className="font-body text-off-white/80" style={{ fontSize: "0.9rem", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: "28px" }}>
          <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem" }}>Last updated: June 2026</p>

          {[
            {
              title: "Using VAKANSISME",
              body: "VAKANSISME is a platform for organizing and joining travel expeditions. By creating an account, you agree to use it honestly and not to impersonate others, spam members, or misuse any feature.",
            },
            {
              title: "Your content",
              body: "Stories, chaos posts, and profile info you submit remain yours. By posting, you grant VAKANSISME a non-exclusive license to display your content on the platform. You're responsible for what you post — no illegal content, no harassment, no hate speech.",
            },
            {
              title: "Expeditions",
              body: "Expedition leaders set their own prices, dates, and terms. VAKANSISME is not a travel agency and does not guarantee the quality, safety, or execution of any expedition. Always do your own research before joining a trip.",
            },
            {
              title: "Liability",
              body: "VAKANSISME is provided as-is. We are not liable for any damages arising from your use of the platform, participation in expeditions, or reliance on any content posted by other users.",
            },
            {
              title: "Termination",
              body: "We reserve the right to suspend or remove accounts that violate these terms. You can delete your account at any time from Settings.",
            },
            {
              title: "Changes",
              body: "We may update these terms. Continued use after changes means you accept the new terms. We'll notify active users of significant changes via email.",
            },
            {
              title: "Contact",
              body: "Questions? hello@vakansisme.club",
            },
          ].map(({ title, body }) => (
            <div key={title}>
              <p className="font-body font-semibold text-neon-green uppercase mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.14em" }}>{title}</p>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
