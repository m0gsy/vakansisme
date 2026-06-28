"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import type { Locale } from "@/lib/i18n";
import { dict } from "@/lib/i18n";

export default function JoinButton({
  tripId,
  initialCount,
  quotaMax,
  currentUserId,
  initialJoined,
  initialOnWaitlist,
  initialWaitlistCount,
  tripStatus,
  applicationPrompt,
  initialPending = false,
  locale = "id",
}: {
  tripId: string;
  initialCount: number;
  quotaMax: number;
  currentUserId: string | null;
  initialJoined: boolean;
  initialOnWaitlist?: boolean;
  initialWaitlistCount?: number;
  tripStatus?: string | null;
  applicationPrompt?: string | null;
  initialPending?: boolean;
  locale?: Locale;
}) {
  const router = useRouter();
  const toast = useToast();
  const [count, setCount] = useState(initialCount);
  const [joined, setJoined] = useState(initialJoined);
  const [pending, setPending] = useState(initialPending);
  const [onWaitlist, setOnWaitlist] = useState(initialOnWaitlist ?? false);
  const [waitlistCount, setWaitlistCount] = useState(initialWaitlistCount ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [showApp, setShowApp] = useState(false);

  const d = dict[locale];
  const full = count >= quotaMax;

  async function handleJoin(appNotes?: string) {
    if (!currentUserId) { router.push("/login"); return; }
    setError("");
    setLoading(true);
    const res = await fetch(`/api/expeditions/${tripId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: appNotes ?? undefined }),
    });
    const json = await res.json();
    if (res.ok) {
      if (json.pending) {
        setPending(true);
        setShowApp(false);
        toast(locale === "id" ? "Lamaran terkirim! Menunggu persetujuan pemimpin." : "Application sent! Awaiting leader approval.");
      } else {
        setJoined(true);
        setCount(json.member_count);
        setShowApp(false);
        toast(locale === "id" ? "Berhasil bergabung! Sampai ketemu di perjalanan." : "Joined! See you on the trail.");
        router.refresh();
      }
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
    const msg = locale === "id" ? "Keluar dari trip ini?" : "Leave this trip?";
    if (!confirm(msg)) return;
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
    if (res.ok) { setOnWaitlist(true); setWaitlistCount(json.waitlist_count); }
    else setError(json.error ?? "Something went wrong");
    setLoading(false);
  }

  async function handleLeaveWaitlist() {
    setLoading(true);
    const res = await fetch(`/api/expeditions/${tripId}/waitlist`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) { setOnWaitlist(false); setWaitlistCount(json.waitlist_count); }
    setLoading(false);
  }

  function onJoinClick() {
    if (!currentUserId) { router.push("/login"); return; }
    if (applicationPrompt && !showApp) { setShowApp(true); return; }
    handleJoin();
  }

  const slotsLabel = locale === "id" ? `${count} / ${quotaMax} slot terisi` : `${count} / ${quotaMax} slots filled`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
        {pending ? (
          <button
            disabled
            className="font-body font-semibold"
            style={{ fontSize: "0.75rem", letterSpacing: "0.14em", padding: "14px 40px", border: "1px solid rgba(139,115,85,0.5)", background: "transparent", color: "#8B7355" }}
          >
            {d.pending_approval}
          </button>
        ) : joined ? (
          <button disabled className="font-body font-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.14em", padding: "14px 40px", border: "none", background: "#9BFF3C", color: "#111111" }}>
            {d.joined}
          </button>
        ) : full ? (
          <button
            onClick={onWaitlist ? handleLeaveWaitlist : handleWaitlist}
            disabled={loading}
            className="font-body font-semibold transition-all duration-150 disabled:opacity-50"
            style={{ fontSize: "0.75rem", letterSpacing: "0.14em", padding: "14px 40px", border: onWaitlist ? "1px solid rgba(155,255,60,0.4)" : "1px solid rgba(74,59,42,0.4)", background: "transparent", color: onWaitlist ? "#9BFF3C" : "#8B7355", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "..." : onWaitlist ? d.on_waitlist : d.join_waitlist}
          </button>
        ) : (
          <button
            onClick={onJoinClick}
            disabled={loading}
            className="font-body font-semibold transition-all duration-150 disabled:opacity-50"
            style={{ fontSize: "0.75rem", letterSpacing: "0.14em", padding: "14px 40px", border: "none", background: "#9BFF3C", color: "#111111", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? (locale === "id" ? "BERGABUNG..." : "JOINING...") : d.join}
          </button>
        )}
        <span className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>{slotsLabel}</span>
      </div>

      {/* Application form */}
      {showApp && !joined && !pending && (
        <div style={{ marginTop: "12px", padding: "18px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)" }}>
          <p className="font-body font-semibold text-off-white" style={{ fontSize: "0.82rem", marginBottom: "8px" }}>{applicationPrompt}</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={locale === "id" ? "Jawabanmu..." : "Your answer..."}
            className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none"
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(74,59,42,0.5)", padding: "8px 0", fontSize: "0.85rem", lineHeight: 1.6, color: "#F0EDEA" }}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
            <button
              onClick={() => handleJoin(notes)}
              disabled={loading}
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
              style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "10px 24px", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? (locale === "id" ? "MENGIRIM..." : "SUBMITTING...") : (locale === "id" ? "KIRIM LAMARAN" : "SUBMIT & JOIN")}
            </button>
            <button
              onClick={() => setShowApp(false)}
              className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
              style={{ fontSize: "0.68rem", letterSpacing: "0.1em", background: "transparent", border: "none", cursor: "pointer" }}
            >
              {d.cancel}
            </button>
          </div>
        </div>
      )}

      {full && waitlistCount > 0 && (
        <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginBottom: "4px" }}>
          {waitlistCount} {locale === "id" ? "dalam antrian" : "on waitlist"}
        </p>
      )}

      {joined && !loading && (
        tripStatus === "ongoing" || tripStatus === "completed" ? (
          <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.06em", marginTop: "4px" }}>
            {tripStatus === "ongoing"
              ? (locale === "id" ? "Trip sedang berjalan — kamu sudah terkunci." : "Trip is underway — you're locked in.")
              : (locale === "id" ? "Trip selesai." : "Trip completed.")}
          </p>
        ) : (
          <button
            onClick={handleLeave}
            className="font-body font-semibold transition-all duration-150"
            style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 20px", background: "transparent", border: "1px solid rgba(255,107,26,0.4)", color: "#FF6B1A", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,107,26,0.1)"; e.currentTarget.style.borderColor = "rgba(255,107,26,0.7)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,107,26,0.4)"; }}
          >
            {d.leave}
          </button>
        )
      )}

      {error && <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem", marginTop: "6px" }}>{error}</p>}
    </div>
  );
}
