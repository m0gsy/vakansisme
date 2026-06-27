"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinButton({
  tripId,
  initialCount,
  quotaMax,
  currentUserId,
  initialJoined,
}: {
  tripId: string;
  initialCount: number;
  quotaMax: number;
  currentUserId: string | null;
  initialJoined: boolean;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [joined, setJoined] = useState(initialJoined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const full = count >= quotaMax;

  async function handleJoin() {
    if (!currentUserId) { router.push("/login"); return; }
    setError("");
    setLoading(true);

    const res = await fetch(`/api/expeditions/${tripId}/join`, { method: "POST" });
    const json = await res.json();

    if (res.ok) {
      setJoined(true);
      setCount(json.member_count);
      router.refresh();
    } else if (res.status === 409 && json.error === "Already joined") {
      setJoined(true);
      router.refresh();
    } else {
      setError(json.error ?? "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
        <button
          onClick={handleJoin}
          disabled={loading || joined || full}
          className="font-body font-semibold transition-all duration-150 disabled:opacity-50"
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.14em",
            padding: "14px 40px",
            border: "none",
            cursor: (loading || joined || full) ? "not-allowed" : "pointer",
            background: joined ? "#9BFF3C" : full ? "rgba(74,59,42,0.4)" : "#9BFF3C",
            color: "#111111",
          }}
        >
          {loading ? "JOINING..." : joined ? "JOINED ✓" : full ? "TRIP FULL" : "JOIN TRIP"}
        </button>
        <span className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>
          {count} / {quotaMax} slots filled
        </span>
      </div>
      {error && (
        <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem" }}>{error}</p>
      )}
    </div>
  );
}
