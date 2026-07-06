"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function useDeadlineCountdown(dueAt: string | null) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!dueAt) return;
    function update() {
      const diff = new Date(dueAt!).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setTimeLeft(h >= 24 ? `${Math.floor(h / 24)}h ${h % 24}j lagi` : `${h}j ${m}m lagi`);
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [dueAt]);

  return timeLeft;
}

export default function PayButton({
  bookingId,
  expeditionId,
  priceAmount,
  currentUserId,
  alreadyPaid = false,
  paymentDueAt = null,
}: {
  bookingId?: string;
  expeditionId: string;
  priceAmount: number;
  currentUserId: string | null;
  alreadyPaid?: boolean;
  paymentDueAt?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMethods, setShowMethods] = useState(false);
  const deadline = useDeadlineCountdown(paymentDueAt);

  const formatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(priceAmount);

  if (alreadyPaid) {
    return (
      <div className="font-body font-semibold text-neon-green" style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px 0" }}>
        PEMBAYARAN DIKONFIRMASI ✓
      </div>
    );
  }

  async function handlePay(method: string) {
    if (!currentUserId) { router.push("/login"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          expedition_id: expeditionId,
          payment_method: method,
          provider: "manual_transfer",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal memproses pembayaran");
        setLoading(false);
        return;
      }
      router.push(`/bookings/${json.payment?.payment_order_id ?? bookingId}/payment`);
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  return (
    <div>
      {paymentDueAt && (
        <div
          style={{
            padding: "10px 16px",
            background: "rgba(155,255,60,0.06)",
            border: "1px solid rgba(155,255,60,0.2)",
            marginBottom: "12px",
          }}
        >
          <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}>
            Slot reserved —{" "}
            <span className="text-neon-green font-semibold">{deadline}</span>
            {" "}untuk bayar sebelum otomatis dicancel
          </p>
        </div>
      )}

      {!showMethods ? (
        <button
          onClick={() => {
            if (!currentUserId) { router.push("/login"); return; }
            setShowMethods(true);
          }}
          disabled={loading}
          className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed w-full"
          style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px 28px", border: "none", cursor: "pointer" }}
        >
          {loading ? "MEMPROSES…" : `LUNASI PEMBAYARAN — ${formatted}`}
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p className="font-body font-semibold text-off-white uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "4px" }}>
            Pilih Metode Pembayaran
          </p>
          <button
            onClick={() => handlePay("bank_transfer")}
            disabled={loading}
            className="font-body font-semibold text-left transition-colors duration-150 disabled:opacity-50"
            style={{ fontSize: "0.78rem", padding: "12px 18px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", cursor: "pointer" }}
          >
            Transfer Bank
          </button>
          <button
            onClick={() => handlePay("qris")}
            disabled={loading}
            className="font-body font-semibold text-left transition-colors duration-150 disabled:opacity-50"
            style={{ fontSize: "0.78rem", padding: "12px 18px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", cursor: "pointer" }}
          >
            QRIS
          </button>
          <button
            onClick={() => setShowMethods(false)}
            className="font-body text-muted-ink hover:text-off-white transition-colors duration-150"
            style={{ fontSize: "0.68rem", letterSpacing: "0.1em", background: "transparent", border: "none", cursor: "pointer", padding: "6px 0" }}
          >
            Kembali
          </button>
        </div>
      )}

      {error && (
        <p className="font-body text-chaos-orange" style={{ fontSize: "0.72rem", marginTop: "8px" }}>{error}</p>
      )}
    </div>
  );
}
