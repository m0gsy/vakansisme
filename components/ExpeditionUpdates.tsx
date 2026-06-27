"use client";

import { useState } from "react";

type Update = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles: { username: string } | { username: string }[] | null;
};

export default function ExpeditionUpdates({
  expeditionId,
  initialUpdates,
  currentUserId,
  isLeader,
}: {
  expeditionId: string;
  initialUpdates: Update[];
  currentUserId: string | null;
  isLeader: boolean;
}) {
  const [updates, setUpdates] = useState<Update[]>(initialUpdates);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function authorName(u: Update) {
    const p = Array.isArray(u.profiles) ? u.profiles[0] : u.profiles;
    return p?.username ?? "leader";
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/expeditions/${expeditionId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const json = await res.json();
    if (res.ok) {
      setUpdates((prev) => [json, ...prev]);
      setContent("");
    } else {
      setError(json.error ?? "Something went wrong");
    }
    setLoading(false);
  }

  async function handleDelete(updateId: string) {
    await fetch(`/api/expeditions/${expeditionId}/updates`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updateId }),
    });
    setUpdates((prev) => prev.filter((u) => u.id !== updateId));
  }

  if (!updates.length && !isLeader) return null;

  return (
    <section style={{ marginTop: "48px", paddingTop: "40px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
      <h2
        className="font-display font-black uppercase text-off-white"
        style={{ fontSize: "clamp(1.2rem, 3vw, 1.6rem)", letterSpacing: "-0.02em", marginBottom: "28px" }}
      >
        LEADER UPDATES {updates.length > 0 && `(${updates.length})`}
      </h2>

      {isLeader && (
        <form onSubmit={handlePost} style={{ marginBottom: "28px" }}>
          <div style={{ position: "relative" }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Post an update to your crew..."
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none w-full"
              style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", padding: "14px 16px", fontSize: "0.88rem", lineHeight: 1.65 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(74,59,42,0.4)")}
            />
            <span className="font-body text-muted-ink absolute bottom-3 right-3" style={{ fontSize: "0.62rem" }}>
              {content.length}/1000
            </span>
          </div>
          {error && <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem", marginTop: "8px" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-40"
            style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "10px 24px", border: "none", cursor: "pointer", marginTop: "12px" }}
          >
            {loading ? "POSTING..." : "POST UPDATE"}
          </button>
        </form>
      )}

      {updates.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {updates.map((u) => (
            <div key={u.id} style={{ background: "#1a1a1a", border: "1px solid rgba(155,255,60,0.15)", padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span className="font-body font-semibold text-neon-green" style={{ fontSize: "0.72rem", letterSpacing: "0.08em" }}>
                    @{authorName(u)}
                  </span>
                  <span className="font-body font-semibold uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", background: "#9BFF3C", color: "#111111", padding: "1px 6px" }}>
                    LEADER
                  </span>
                  <span className="font-body text-muted-ink" style={{ fontSize: "0.65rem" }}>
                    {new Date(u.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                {currentUserId === u.author_id && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="font-body text-muted-ink hover:text-chaos-orange transition-colors duration-150"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.62rem", letterSpacing: "0.08em" }}
                  >
                    DELETE
                  </button>
                )}
              </div>
              <p className="font-body text-off-white/85" style={{ fontSize: "0.88rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {u.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
