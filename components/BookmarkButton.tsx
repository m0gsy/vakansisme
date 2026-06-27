"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function BookmarkButton({
  expeditionId,
  initialBookmarked,
  currentUserId,
}: {
  expeditionId: string;
  initialBookmarked: boolean;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!currentUserId) { router.push("/login"); return; }
    setLoading(true);
    const res = await fetch(`/api/expeditions/${expeditionId}/bookmark`, { method: bookmarked ? "DELETE" : "POST" });
    if (res.ok) {
      setBookmarked(!bookmarked);
      toast(bookmarked ? "Removed from bookmarks." : "Saved to bookmarks.", bookmarked ? "info" : "success");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
      className="font-body font-semibold transition-all duration-150"
      style={{
        fontSize: "0.68rem",
        letterSpacing: "0.1em",
        padding: "7px 16px",
        background: "transparent",
        border: "1px solid",
        borderColor: bookmarked ? "rgba(155,255,60,0.4)" : "rgba(74,59,42,0.4)",
        color: bookmarked ? "#9BFF3C" : "#8B7355",
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {bookmarked ? "SAVED ✓" : "SAVE"}
    </button>
  );
}
