"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StoryLikeButton({
  storyId,
  initialCount,
  initialLiked,
  currentUserId,
}: {
  storyId: string;
  initialCount: number;
  initialLiked: boolean;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!currentUserId) { router.push("/login"); return; }
    setLoading(true);
    const method = liked ? "DELETE" : "POST";
    const res = await fetch(`/api/stories/${storyId}/like`, { method });
    if (res.ok) {
      setLiked(!liked);
      setCount((c) => liked ? c - 1 : c + 1);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="font-body font-semibold transition-all duration-150"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "none",
        border: liked ? "1px solid rgba(155,255,60,0.5)" : "1px solid rgba(74,59,42,0.4)",
        padding: "8px 16px",
        cursor: loading ? "not-allowed" : "pointer",
        color: liked ? "#9BFF3C" : "#8B7355",
        fontSize: "0.72rem",
        letterSpacing: "0.08em",
      }}
    >
      <span style={{ fontSize: "0.9rem" }}>{liked ? "♥" : "♡"}</span>
      <span>{count > 0 ? count : ""} {count === 1 ? "like" : count > 1 ? "likes" : "like this"}</span>
    </button>
  );
}
