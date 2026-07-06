import Link from "next/link";

export const metadata = { title: "Payment Successful — VAKANSISME" };

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-xl mx-auto px-6" style={{ textAlign: "center", paddingTop: "80px" }}>
        <p className="font-display font-black text-neon-green" style={{ fontSize: "3rem", marginBottom: "16px" }}>✓</p>
        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "16px" }}
        >
          PAYMENT CONFIRMED
        </h1>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "40px" }}>
          You&apos;re in. Check your email for details and join the crew on the expedition page.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/expeditions"
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
            style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "12px 28px" }}
          >
            ALL EXPEDITIONS →
          </Link>
          <Link
            href="/dashboard"
            className="font-body font-semibold text-off-white hover:text-neon-green transition-colors duration-150"
            style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "12px 28px", border: "1px solid rgba(74,59,42,0.4)" }}
          >
            MY BOOKINGS
          </Link>
        </div>
      </div>
    </div>
  );
}
