"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function JoinButton({
  tripId,
  initialCount,
  quotaMax,
  currentUserId,
  initialJoined,
  initialOnWaitlist,
  initialWaitlistCount,
  tripStatus,
}: {
  tripId: string;
  initialCount: number;
  quotaMax: number;
  currentUserId: string | null;
  initialJoined: boolean;
  initialOnWaitlist?: boolean;
  initialWaitlistCount?: number;
  tripStatus?: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
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
      toast("Joined! See you on the trail.");
      router.refresh();
    } else if (res.status === 409 && json.error === "Already joined") {
      setJoined(true);
      router.refresh();
    } else {
      setError(json.error ?? "Something went wrong");
      toast(json.error ?? "Something went wrong", "error");
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
        tripStatus === "ongoing" || tripStatus === "completed" ? (
          <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.06em", marginTop: "4px" }}>
            {tripStatus === "ongoing" ? "Trip is underway — you're locked in." : "Trip completed."}
          </p>
        ) : (
          <button
            onClick={handleLeave}
            className="font-body font-semibold transition-all duration-150"
            style={{
              fontSize: "0.68rem",
              letterSpacing: "0.12em",
              padding: "8px 20px",
              background: "transparent",
              border: "1px solid rgba(255,107,26,0.4)",
              color: "#FF6B1A",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,107,26,0.1)";
              e.currentTarget.style.borderColor = "rgba(255,107,26,0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(255,107,26,0.4)";
            }}
          >
            LEAVE TRIP
          </button>
        )
      )}

      {error && (
        <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem", marginTop: "6px" }}>{error}</p>
      )}
    </div>
  );
}
