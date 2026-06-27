"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8) { setError("Minimum 8 characters."); return; }
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-6" style={{ paddingBlock: "80px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <Link href="/" className="font-display font-black uppercase text-off-white block text-center mb-12" style={{ fontSize: "1.4rem", letterSpacing: "0.18em" }}>
          VAKANSISME
        </Link>

        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2rem, 6vw, 3rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "8px" }}>
          NEW PASSWORD
        </h1>
        <p className="font-body text-muted-ink mb-10" style={{ fontSize: "0.88rem" }}>
          Choose a strong one.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <label htmlFor="password" className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="font-body text-off-white focus:outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
          </div>
          <div>
            <label htmlFor="confirm" className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
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
            {loading ? "SAVING..." : "SET NEW PASSWORD"}
          </button>
        </form>
      </div>
    </div>
  );
}
