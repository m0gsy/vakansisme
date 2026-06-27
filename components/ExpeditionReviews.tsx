"use client";

import { useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/Toast";

type Review = {
  id: string;
  reviewer_id: string;
  rating: number;
  content: string | null;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | { username: string; avatar_url: string | null }[];
};

function Stars({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          disabled={!interactive}
          style={{
            background: "none",
            border: "none",
            cursor: interactive ? "pointer" : "default",
            padding: 0,
            fontSize: "1rem",
            color: n <= rating ? "#9BFF3C" : "rgba(74,59,42,0.5)",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ExpeditionReviews({
  expeditionId,
  initialReviews,
  isMember,
  currentUserId,
  tripStatus,
}: {
  expeditionId: string;
  initialReviews: Review[];
  isMember: boolean;
  currentUserId: string | null;
  tripStatus?: string | null;
}) {
  const toast = useToast();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const myReview = reviews.find((r) => r.reviewer_id === currentUserId);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function submit() {
    if (!rating) { toast("Pick a rating first.", "error"); return; }
    setSubmitting(true);
    const res = await fetch(`/api/expeditions/${expeditionId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, content: content.trim() || null }),
    });
    if (res.ok) {
      const review = await res.json();
      setReviews((prev) => {
        const filtered = prev.filter((r) => r.reviewer_id !== currentUserId);
        return [review, ...filtered];
      });
      toast("Review submitted.", "success");
      setRating(0);
      setContent("");
    } else {
      const { error } = await res.json();
      toast(error ?? "Failed.", "error");
    }
    setSubmitting(false);
  }

  async function deleteReview(id: string) {
    await fetch(`/api/expeditions/${expeditionId}/reviews`, { method: "DELETE" });
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast("Review removed.", "info");
  }

  return (
    <section style={{ marginTop: "56px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <h2
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em" }}
        >
          REVIEWS
        </h2>
        {!!reviews.length && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Stars rating={Math.round(avgRating)} />
            <span className="font-body text-muted-ink" style={{ fontSize: "0.75rem" }}>{avgRating.toFixed(1)} ({reviews.length})</span>
          </div>
        )}
      </div>

      {isMember && tripStatus !== "completed" && !myReview && (
    <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "14px 20px", marginBottom: "24px" }}>
      <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem" }}>
        Rating available once the trip is marked <span style={{ color: "#9BFF3C" }}>completed</span>.
      </p>
    </div>
  )}
  {isMember && tripStatus === "completed" && !myReview && (
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(74,59,42,0.35)",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "10px" }}>
            RATE THIS TRIP
          </p>
          <Stars rating={rating} interactive onChange={setRating} />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Leave a note for future crew... (optional)"
            maxLength={800}
            rows={3}
            className="font-body text-off-white bg-transparent w-full"
            style={{ marginTop: "12px", border: "1px solid rgba(74,59,42,0.3)", padding: "10px 14px", fontSize: "0.82rem", outline: "none", resize: "vertical" }}
          />
          <button
            onClick={submit}
            disabled={submitting || !rating}
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
            style={{ marginTop: "10px", fontSize: "0.65rem", letterSpacing: "0.12em", padding: "10px 22px", border: "none", cursor: submitting ? "not-allowed" : "pointer" }}
          >
            SUBMIT
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {reviews.map((r) => {
          const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles as { username: string; avatar_url: string | null };
          return (
            <div key={r.id} style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div className="relative" style={{ width: "28px", height: "28px", overflow: "hidden", background: "#111", flexShrink: 0 }}>
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt={profile.username} fill sizes="28px" className="object-cover" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="font-display font-black text-neon-green" style={{ fontSize: "0.7rem" }}>{profile?.username?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <span className="font-body font-semibold text-off-white" style={{ fontSize: "0.78rem" }}>@{profile?.username}</span>
                <Stars rating={r.rating} />
                {r.reviewer_id === currentUserId && (
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="font-body text-muted-ink hover:text-chaos-orange transition-colors duration-150 ml-auto"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.6rem" }}
                  >
                    remove
                  </button>
                )}
              </div>
              {r.content && (
                <p className="font-body text-off-white/70" style={{ fontSize: "0.82rem", lineHeight: 1.6 }}>{r.content}</p>
              )}
            </div>
          );
        })}
        {!reviews.length && (
          <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>No reviews yet.</p>
        )}
      </div>
    </section>
  );
}
