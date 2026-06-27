"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-6">
      <div style={{ textAlign: "center", maxWidth: "480px" }}>
        <p
          className="font-body font-semibold text-chaos-orange uppercase"
          style={{ fontSize: "0.68rem", letterSpacing: "0.14em", marginBottom: "16px" }}
        >
          SOMETHING WENT WRONG
        </p>
        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(2rem, 6vw, 4rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "24px" }}
        >
          UNEXPECTED CHAOS
        </h1>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "32px" }}>
          Not the fun kind. Try again or head back home.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={reset}
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
            style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "12px 24px", border: "none", cursor: "pointer" }}
          >
            TRY AGAIN
          </button>
          <Link
            href="/"
            className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
            style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "12px 24px", border: "1px solid rgba(74,59,42,0.5)" }}
          >
            GO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
