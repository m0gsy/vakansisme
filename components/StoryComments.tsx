"use client";

import { useState } from "react";
import Link from "next/link";

type Comment = {
  id: string;
  author_id: string;
  author_handle: string;
  content: string;
  created_at: string;
};

export default function StoryComments({
  storyId,
  initialComments,
  currentUserId,
}: {
  storyId: string;
  initialComments: Comment[];
  currentUserId: string | null;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/stories/${storyId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const json = await res.json();
    if (res.ok) {
      setComments((prev) => [...prev, json]);
      setContent("");
    } else {
      setError(json.error ?? "Something went wrong");
    }
    setLoading(false);
  }

  async function handleDelete(commentId: string) {
    await fetch(`/api/stories/${storyId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <section style={{ marginTop: "64px", paddingTop: "48px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
      <h2
        className="font-display font-black uppercase text-off-white"
        style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "32px" }}
      >
        CREW NOTES ({comments.length})
      </h2>

      {/* Comment list */}
      {comments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
          {comments.map((c) => {
            const cleanUsername = c.author_handle.startsWith("@") ? c.author_handle.slice(1) : c.author_handle;
            return (
              <div
                key={c.id}
                style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)", padding: "16px 20px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Link
                      href={`/u/${cleanUsername}`}
                      className="font-body font-semibold text-neon-green hover:text-chaos-orange transition-colors duration-150"
                      style={{ fontSize: "0.72rem", letterSpacing: "0.08em" }}
                    >
                      @{cleanUsername}
                    </Link>
                    <span className="font-body text-muted-ink" style={{ fontSize: "0.65rem" }}>
                      {new Date(c.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {currentUserId === c.author_id && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="font-body text-muted-ink hover:text-chaos-orange transition-colors duration-150"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.62rem", letterSpacing: "0.08em" }}
                    >
                      DELETE
                    </button>
                  )}
                </div>
                <p className="font-body text-off-white/80" style={{ fontSize: "0.88rem", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                  {c.content}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Comment form */}
      {currentUserId ? (
        <form onSubmit={handleSubmit}>
          <div style={{ position: "relative" }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Add a note..."
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none w-full"
              style={{
                background: "#1a1a1a",
                border: "1px solid rgba(74,59,42,0.4)",
                padding: "14px 16px",
                fontSize: "0.88rem",
                lineHeight: 1.65,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(74,59,42,0.4)")}
            />
            <span
              className="font-body text-muted-ink absolute bottom-3 right-3"
              style={{ fontSize: "0.62rem" }}
            >
              {content.length}/500
            </span>
          </div>
          {error && (
            <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem", marginTop: "8px" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-40"
            style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "10px 24px", border: "none", cursor: loading ? "not-allowed" : "pointer", marginTop: "12px" }}
          >
            {loading ? "POSTING..." : "POST NOTE"}
          </button>
        </form>
      ) : (
        <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>
          <Link href="/login" className="text-neon-green hover:text-chaos-orange transition-colors duration-150">
            Sign in
          </Link>{" "}
          to leave a note.
        </p>
      )}
    </section>
  );
}
