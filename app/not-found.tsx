import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-6">
      <div style={{ textAlign: "center", maxWidth: "480px" }}>
        <p
          className="font-display font-black text-chaos-orange"
          style={{ fontSize: "clamp(6rem, 22vw, 14rem)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 0 }}
          aria-hidden="true"
        >
          404
        </p>
        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}
        >
          LOST IN THE FIELD
        </h1>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "32px" }}>
          This page doesn&apos;t exist. Maybe it got left behind at base camp.
        </p>
        <Link
          href="/"
          className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
          style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "12px 28px" }}
        >
          BACK TO BASE CAMP →
        </Link>
      </div>
    </div>
  );
}
