"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

const SNAP_URL = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";

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
  expeditionId,
  priceAmount,
  currentUserId,
  alreadyPaid = false,
  paymentDueAt = null,
}: {
  expeditionId: string;
  priceAmount: number;
  currentUserId: string | null;
  alreadyPaid?: boolean;
  paymentDueAt?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const deadline = useDeadlineCountdown(paymentDueAt);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) return;
    const existing = document.querySelector(`script[src="${SNAP_URL}"]`);
    if (existing) return;
    const script = document.createElement("script");
    script.src = SNAP_URL;
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
    document.head.appendChild(script);
  }, []);

  const formatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(priceAmount);

  if (alreadyPaid) {
    return (
      <div className="font-body font-semibold text-neon-green" style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px 0" }}>
        PEMBAYARAN DIKONFIRMASI ✓
      </div>
    );
  }

  async function handlePay() {
    if (!currentUserId) { router.push("/login"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/midtrans/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expeditionId }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Gagal memproses pembayaran"); setLoading(false); return; }

      if (!window.snap) { setError("Snap.js belum dimuat. Refresh halaman."); setLoading(false); return; }

      window.snap.pay(json.token, {
        onSuccess: () => { router.push("/payment/success"); },
        onPending: () => { setError("Pembayaran tertunda — cek email kamu."); setLoading(false); },
        onError: () => { setError("Pembayaran gagal. Coba lagi."); setLoading(false); },
        onClose: () => { setLoading(false); },
      });
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
      <button
        onClick={handlePay}
        disabled={loading}
        className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed w-full"
        style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px 28px", border: "none", cursor: "pointer" }}
      >
        {loading ? "MEMPROSES…" : `LUNASI PEMBAYARAN — ${formatted}`}
      </button>
      {error && (
        <p className="font-body text-chaos-orange" style={{ fontSize: "0.72rem", marginTop: "8px" }}>{error}</p>
      )}
    </div>
  );
}
