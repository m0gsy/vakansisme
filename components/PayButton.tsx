"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PayButton({
  expeditionId,
  priceAmount,
  currentUserId,
  alreadyPaid = false,
}: {
  expeditionId: string;
  priceAmount: number;
  currentUserId: string | null;
  alreadyPaid?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(priceAmount);

  if (alreadyPaid) {
    return (
      <div
        className="font-body font-semibold text-neon-green"
        style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px 0" }}
      >
        PAYMENT CONFIRMED ✓
      </div>
    );
  }

  async function handlePay() {
    if (!currentUserId) { router.push("/login"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expeditionId }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Checkout failed"); return; }
      window.location.href = json.url;
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed w-full"
        style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px 28px", border: "none", cursor: "pointer" }}
      >
        {loading ? "REDIRECTING…" : `PAY & JOIN — ${formatted}`}
      </button>
      {error && (
        <p className="font-body text-chaos-orange" style={{ fontSize: "0.72rem", marginTop: "8px" }}>{error}</p>
      )}
    </div>
  );
}
