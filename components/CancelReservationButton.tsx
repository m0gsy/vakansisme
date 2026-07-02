"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelReservationButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/expeditions/${tripId}/join`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Gagal batalkan. Coba lagi.");
      setConfirmed(false);
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ marginTop: "10px", textAlign: "center" }}>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="font-body text-muted-ink hover:text-chaos-orange transition-colors duration-150 disabled:opacity-50"
        style={{ fontSize: "0.68rem", letterSpacing: "0.1em", background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}
      >
        {loading ? "..." : confirmed ? "KONFIRMASI BATALKAN?" : "BATALKAN RESERVASI"}
      </button>
      {error && <p className="font-body" style={{ fontSize: "0.65rem", color: "#FF6B1A", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}
