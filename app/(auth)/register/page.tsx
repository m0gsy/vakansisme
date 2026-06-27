"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center px-6">
        <div style={{ maxWidth: "400px", textAlign: "center" }}>
          <h2
            className="font-display font-black uppercase text-neon-green"
            style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}
          >
            CHECK YOUR EMAIL
          </h2>
          <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem" }}>
            Confirmation link sent to <span className="text-off-white">{email}</span>.
            Click it to join the chaos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-charcoal flex items-center justify-center px-6"
      style={{ paddingBlock: "80px" }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
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
          JOIN THE CREW
        </h1>
        <p className="font-body text-muted-ink mb-10" style={{ fontSize: "0.88rem" }}>
          Create your account. No inspirational quotes, promise.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <label
              htmlFor="username"
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="@your_handle"
              className="font-body text-off-white placeholder:text-muted-ink w-full focus:outline-none"
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
              autoComplete="new-password"
              minLength={6}
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
            <p className="font-body text-chaos-orange" style={{ fontSize: "0.82rem" }}>
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
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="font-body text-muted-ink text-center mt-8" style={{ fontSize: "0.82rem" }}>
          Already in?{" "}
          <Link href="/login" className="text-neon-green hover:text-chaos-orange transition-colors duration-150">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
