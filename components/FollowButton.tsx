"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function FollowButton({
  targetId,
  initialFollowing,
  initialCount,
  currentUserId,
}: {
  targetId: string;
  initialFollowing: boolean;
  initialCount: number;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!currentUserId) { router.push("/login"); return; }
    setLoading(true);
    const res = await fetch("/api/crew/follow", {
      method: following ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following_id: targetId }),
    });
    if (res.ok) {
      setFollowing((f) => !f);
      setCount((c) => c + (following ? -1 : 1));
      toast(following ? "Unfollowed." : "Following!", following ? "info" : "success");
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <button
        onClick={toggle}
        disabled={loading}
        className="font-body font-semibold transition-all duration-150 disabled:opacity-50"
        style={{
          fontSize: "0.68rem",
          letterSpacing: "0.12em",
          padding: "10px 24px",
          border: "1px solid",
          cursor: loading ? "not-allowed" : "pointer",
          background: following ? "transparent" : "#9BFF3C",
          color: following ? "#7A7570" : "#111111",
          borderColor: following ? "rgba(74,59,42,0.5)" : "#9BFF3C",
        }}
      >
        {loading ? "..." : following ? "FOLLOWING" : "FOLLOW"}
      </button>
      <span className="font-body text-muted-ink" style={{ fontSize: "0.78rem" }}>
        {count} follower{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
