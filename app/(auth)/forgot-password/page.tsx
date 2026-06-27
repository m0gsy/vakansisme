"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputStyle = {
  background: "transparent",
  border: "none",
  borderBottom: "2px solid #4A3B2A",
  padding: "10px 0",
  fontSize: "0.95rem",
  color: "#F0EDEA",
  width: "100%",
  transition: "border-color 0.2s",
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-6" style={{ paddingBlock: "80px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <Link href="/" className="font-display font-black uppercase text-off-white block text-center mb-12" style={{ fontSize: "1.4rem", letterSpacing: "0.18em" }}>
          VAKANSISME
        </Link>

        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2rem, 6vw, 3rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "8px" }}>
          FORGOT PASSWORD
        </h1>
        <p className="font-body text-muted-ink mb-10" style={{ fontSize: "0.88rem" }}>
          We&apos;ll send a reset link to your email.
        </p>

        {sent ? (
          <div style={{ background: "rgba(155,255,60,0.08)", border: "1px solid rgba(155,255,60,0.3)", padding: "20px" }}>
            <p className="font-body font-semibold text-neon-green" style={{ fontSize: "0.85rem", marginBottom: "8px" }}>Check your inbox.</p>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.8rem" }}>
              Reset link sent to {email}. Check spam if it doesn&apos;t arrive in a minute.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <label htmlFor="email" className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="font-body text-off-white focus:outline-none"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
              />
            </div>
            {error && <p className="font-body text-chaos-orange" style={{ fontSize: "0.82rem" }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
              style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px", border: "none", cursor: loading ? "not-allowed" : "pointer", marginTop: "8px" }}
            >
              {loading ? "SENDING..." : "SEND RESET LINK"}
            </button>
          </form>
        )}

        <p className="font-body text-muted-ink text-center mt-8" style={{ fontSize: "0.82rem" }}>
          <Link href="/login" className="text-neon-green hover:text-chaos-orange transition-colors duration-150">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
