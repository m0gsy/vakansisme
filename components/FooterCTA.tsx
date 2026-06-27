"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

const navLinks = [
  { label: "EXPEDITIONS", href: "/expeditions" },
  { label: "JOURNAL", href: "/stories" },
  { label: "CREW", href: "/crew" },
  { label: "CHAOS WALL", href: "/chaos" },
];

const ease = [0.16, 1, 0.3, 1] as const;

export default function FooterCTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setSubmitted(true);
      setEmail("");
    } else {
      const json = await res.json();
      setError(json.error ?? "Something went wrong");
    }
  };

  return (
    <footer
      id="crew"
      style={{ background: "#111111", borderTop: "1px solid rgba(74,59,42,0.3)" }}
    >
      {/* CTA block */}
      <div
        className="max-w-7xl mx-auto px-6"
        style={{ paddingBlock: "96px 72px" }}
        ref={ref}
      >
        <div style={{ maxWidth: "640px" }}>
          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease }}
            className="font-display font-black uppercase text-off-white"
            style={{
              fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
              letterSpacing: "-0.025em",
              lineHeight: 0.88,
              marginBottom: "20px",
            }}
          >
            JOIN THE CHAOS
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="font-body text-off-white/55"
            style={{
              fontSize: "0.95rem",
              maxWidth: "50ch",
              marginBottom: "40px",
              textWrap: "pretty",
            }}
          >
            No FOMO. No motivational clichés. Just people who want to escape the routine and make stories worth telling.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.22, ease }}
          >
            {submitted ? (
              <p className="font-story text-neon-green" style={{ fontSize: "1.1rem" }}>
                Nice. We&apos;ll hit you up when new trips drop.
              </p>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexWrap: "wrap", gap: "0", maxWidth: "480px" }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your email"
                  required
                  aria-label="Email address"
                  className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
                  style={{
                    flex: "1 1 200px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "2px solid #4A3B2A",
                    padding: "10px 0",
                    fontSize: "0.9rem",
                    color: "#F0EDEA",
                    transition: "border-color 0.2s",
                    borderRadius: 0,
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderBottomColor = "#9BFF3C")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderBottomColor = "#4A3B2A")
                  }
                />
                {error && (
                  <p className="font-body text-chaos-orange w-full" style={{ fontSize: "0.78rem", marginBottom: "4px" }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.14em",
                    padding: "10px 28px",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    marginTop: "8px",
                  }}
                >
                  SIGN UP
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="max-w-7xl mx-auto px-6"
        style={{
          borderTop: "1px solid rgba(74,59,42,0.2)",
          paddingBlock: "28px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        <span
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "0.95rem", letterSpacing: "0.18em" }}
        >
          VAKANSISME
        </span>

        <nav aria-label="Footer navigation">
          <ul
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "24px",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200"
                  style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p
          className="font-body text-muted-ink"
          style={{ fontSize: "0.72rem" }}
        >
          © 2025 Vakansisme. Lost in nature, found in chaos.
        </p>
      </div>
    </footer>
  );
}
