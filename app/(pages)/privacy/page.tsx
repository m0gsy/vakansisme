import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy — VAKANSISME" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-3xl mx-auto px-6">
        <Link href="/" className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-10" style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}>
          ← HOME
        </Link>
        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "48px" }}>
          PRIVACY POLICY
        </h1>
        <div className="font-body text-off-white/80" style={{ fontSize: "0.9rem", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: "28px" }}>
          <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem" }}>Last updated: June 2026</p>

          {[
            {
              title: "What we collect",
              body: "When you create an account, we collect your email address and any profile information you choose to provide (username, bio, avatar). When you join or create an expedition, we store that association. Stories, chaos submissions, and comments you write are stored in our database.",
            },
            {
              title: "How we use it",
              body: "Your email is used to send trip confirmations, status updates, and newsletters you opt into. We never sell your data. We use your activity (joined expeditions, stories) only to power features you directly use — notifications, your profile page, crew lists.",
            },
            {
              title: "Third parties",
              body: "We use Supabase for database and authentication, and Resend for transactional email. Both are GDPR-compliant. We use Unsplash for fallback imagery. No advertising networks or analytics SDKs are included.",
            },
            {
              title: "Cookies",
              body: "We use a single session cookie to keep you logged in. No tracking cookies, no third-party ad pixels.",
            },
            {
              title: "Data deletion",
              body: "You can permanently delete your account from Settings → Delete Account. This removes all your profile data, joined expeditions, stories, and comments. Email us at hello@vakansisme.com if you need help.",
            },
            {
              title: "Contact",
              body: "Questions? hello@vakansisme.com",
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
