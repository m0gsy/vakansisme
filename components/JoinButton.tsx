"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinButton({
  tripId,
  initialCount,
  quotaMax,
  currentUserId,
  initialJoined,
  initialOnWaitlist,
  initialWaitlistCount,
}: {
  tripId: string;
  initialCount: number;
  quotaMax: number;
  currentUserId: string | null;
  initialJoined: boolean;
  initialOnWaitlist?: boolean;
  initialWaitlistCount?: number;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [joined, setJoined] = useState(initialJoined);
  const [onWaitlist, setOnWaitlist] = useState(initialOnWaitlist ?? false);
  const [waitlistCount, setWaitlistCount] = useState(initialWaitlistCount ?? 0);
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

  async function handleLeave() {
    if (!confirm("Leave this trip?")) return;
    setLoading(true);
    const res = await fetch(`/api/expeditions/${tripId}/join`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) {
      setJoined(false);
      setCount(json.member_count);
      router.refresh();
    } else {
      setError(json.error ?? "Something went wrong");
    }
    setLoading(false);
  }

  async function handleWaitlist() {
    if (!currentUserId) { router.push("/login"); return; }
    setError("");
    setLoading(true);
    const res = await fetch(`/api/expeditions/${tripId}/waitlist`, { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      setOnWaitlist(true);
      setWaitlistCount(json.waitlist_count);
    } else {
      setError(json.error ?? "Something went wrong");
    }
    setLoading(false);
  }

  async function handleLeaveWaitlist() {
    setLoading(true);
    const res = await fetch(`/api/expeditions/${tripId}/waitlist`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) {
      setOnWaitlist(false);
      setWaitlistCount(json.waitlist_count);
    }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
        {joined ? (
          <button
            disabled
            className="font-body font-semibold"
            style={{ fontSize: "0.75rem", letterSpacing: "0.14em", padding: "14px 40px", border: "none", background: "#9BFF3C", color: "#111111", opacity: 1 }}
          >
            JOINED ✓
          </button>
        ) : full ? (
          <button
            onClick={onWaitlist ? handleLeaveWaitlist : handleWaitlist}
            disabled={loading}
            className="font-body font-semibold transition-all duration-150 disabled:opacity-50"
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.14em",
              padding: "14px 40px",
              border: onWaitlist ? "1px solid rgba(155,255,60,0.4)" : "1px solid rgba(74,59,42,0.4)",
              background: "transparent",
              color: onWaitlist ? "#9BFF3C" : "#8B7355",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "..." : onWaitlist ? "ON WAITLIST ✓" : "JOIN WAITLIST"}
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={loading}
            className="font-body font-semibold transition-all duration-150 disabled:opacity-50"
            style={{ fontSize: "0.75rem", letterSpacing: "0.14em", padding: "14px 40px", border: "none", background: "#9BFF3C", color: "#111111", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "JOINING..." : "JOIN TRIP"}
          </button>
        )}
        <span className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>
          {count} / {quotaMax} slots filled
        </span>
      </div>

      {full && waitlistCount > 0 && (
        <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginBottom: "4px" }}>
          {waitlistCount} on waitlist
        </p>
      )}

      {joined && !loading && (
        <button
          onClick={handleLeave}
          className="font-body text-muted-ink hover:text-chaos-orange transition-colors duration-150"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.06em", padding: 0 }}
        >
          leave trip
        </button>
      )}

      {error && (
        <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem", marginTop: "6px" }}>{error}</p>
      )}
    </div>
  );
}
