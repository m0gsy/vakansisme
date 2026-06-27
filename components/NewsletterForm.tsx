"use client";

import { useState } from "react";

const fieldStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  borderBottom: "2px solid #4A3B2A",
  padding: "8px 0",
  fontSize: "0.88rem",
  color: "#F0EDEA",
  width: "100%",
  fontFamily: "inherit",
};

export default function NewsletterForm({ subscriberCount }: { subscriberCount: number }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`Send to ${subscriberCount} subscribers?`)) return;
    setLoading(true);
    setError("");
    setResult(null);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#111111;font-family:sans-serif;padding:48px 24px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table style="max-width:560px;width:100%;"><tr><td style="padding-bottom:24px;"><p style="margin:0;font-size:13px;font-weight:900;letter-spacing:0.2em;color:#F0EDEA;text-transform:uppercase;">VAKANSISME</p></td></tr><tr><td style="font-size:15px;line-height:1.8;color:#8B7355;white-space:pre-wrap;">${body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td></tr></table></td></tr></table></body></html>`;

    const res = await fetch("/api/admin/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, html }),
    });
    const json = await res.json();
    if (res.ok) {
      setResult(json);
      setSubject("");
      setBody("");
    } else {
      setError(json.error ?? "Failed to send");
    }
    setLoading(false);
  }

  return (
    <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.5)", padding: "28px" }}>
      <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem", marginBottom: "20px" }}>
        {subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""} on the list.
      </p>

      {result && (
        <div style={{ background: "rgba(155,255,60,0.08)", border: "1px solid rgba(155,255,60,0.3)", padding: "12px 16px", marginBottom: "20px" }}>
          <p className="font-body font-semibold text-neon-green" style={{ fontSize: "0.78rem" }}>
            Sent to {result.sent} subscribers.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="What's the dispatch about?"
            className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
            onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
          />
        </div>
        <div>
          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>
            Body *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            placeholder="Write the newsletter content here. Plain text — keep it raw."
            className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none"
            style={{ ...fieldStyle, lineHeight: 1.7 }}
            onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
            onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
          />
        </div>
        {error && <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
          style={{ fontSize: "0.7rem", letterSpacing: "0.12em", padding: "12px 24px", border: "none", cursor: loading ? "not-allowed" : "pointer", alignSelf: "flex-start" }}
        >
          {loading ? "SENDING..." : `SEND TO ${subscriberCount} SUBSCRIBERS`}
        </button>
      </form>
    </div>
  );
}
