"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div
      className="min-h-screen bg-charcoal flex items-center justify-center px-6"
      style={{ paddingBlock: "80px" }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Wordmark */}
        <Link
          href="/"
          className="font-display font-black uppercase text-off-white block text-center mb-12"
          style={{ fontSize: "1.4rem", letterSpacing: "0.18em" }}
        >
          VAKANSISME
        </Link>

        <h1
          className="font-display font-black uppercase text-off-white"
          style={{
            fontSize: "clamp(2rem, 6vw, 3rem)",
            letterSpacing: "-0.025em",
            lineHeight: 0.9,
            marginBottom: "8px",
          }}
        >
          SIGN IN
        </h1>
        <p className="font-body text-muted-ink mb-10" style={{ fontSize: "0.88rem" }}>
          Back to the chaos.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <label
              htmlFor="email"
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="font-body text-off-white w-full focus:outline-none"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "2px solid #4A3B2A",
                padding: "10px 0",
                fontSize: "0.95rem",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="font-body text-off-white w-full focus:outline-none"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "2px solid #4A3B2A",
                padding: "10px 0",
                fontSize: "0.95rem",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
          </div>

          {error && (
            <p role="alert" className="font-body text-chaos-orange" style={{ fontSize: "0.82rem" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
            style={{
              fontSize: "0.72rem",
              letterSpacing: "0.14em",
              padding: "14px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "8px",
            }}
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <p className="font-body text-muted-ink text-center mt-6" style={{ fontSize: "0.82rem" }}>
          <Link href="/forgot-password" className="text-muted-ink hover:text-off-white transition-colors duration-150">
            Forgot password?
          </Link>
        </p>
        <p className="font-body text-muted-ink text-center mt-3" style={{ fontSize: "0.82rem" }}>
          No account?{" "}
          <Link href="/register" className="text-neon-green hover:text-chaos-orange transition-colors duration-150">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
