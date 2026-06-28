"use client";

import { useState } from "react";

const REASONS = ["Inappropriate content", "Spam or misleading", "Harassment", "Dangerous information", "Other"];

export default function ReportButton({
  contentType,
  contentId,
  currentUserId,
}: {
  contentType: "story" | "chaos" | "profile" | "comment";
  contentId: string;
  currentUserId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!currentUserId) return null;
  if (done) return (
    <span className="font-body text-muted-ink" style={{ fontSize: "0.65rem" }}>Reported</span>
  );

  async function submit() {
    const finalReason = reason === "Other" ? custom.trim() : reason;
    if (!finalReason) return;
    setLoading(true);
    const res = await fetch("/api/content/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_type: contentType, content_id: contentId, reason: finalReason }),
    });
    if (res.ok) { setDone(true); setOpen(false); }
    setLoading(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-body text-muted-ink hover:text-chaos-orange transition-colors duration-150"
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", letterSpacing: "0.06em" }}
      >
        REPORT
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
            background: "#1a1a1a",
            border: "1px solid rgba(74,59,42,0.5)",
            padding: "16px",
            minWidth: "220px",
            zIndex: 50,
          }}
        >
          <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: "10px" }}>
            Report reason
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className="font-body text-left transition-colors duration-150"
                style={{
                  background: reason === r ? "rgba(155,255,60,0.1)" : "none",
                  border: `1px solid ${reason === r ? "rgba(155,255,60,0.3)" : "transparent"}`,
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  color: reason === r ? "#9BFF3C" : "#8B7355",
                  textAlign: "left",
                }}
              >
                {r}
              </button>
            ))}
          </div>
          {reason === "Other" && (
            <textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Describe the issue..."
              maxLength={300}
              rows={2}
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none"
              style={{ width: "100%", background: "transparent", border: "1px solid rgba(74,59,42,0.5)", padding: "6px 8px", fontSize: "0.72rem", marginBottom: "8px", color: "#F0EDEA" }}
            />
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={submit}
              disabled={loading || !reason || (reason === "Other" && !custom.trim())}
              className="font-body font-semibold text-charcoal bg-chaos-orange disabled:opacity-50 transition-opacity"
              style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "7px 14px", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "..." : "SEND"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="font-body text-muted-ink hover:text-off-white transition-colors"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.6rem" }}
            >
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
