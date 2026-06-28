"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  follower_count: number;
  is_following: boolean;
  is_self: boolean;
};

export default function CrewGrid({
  members,
  currentUserId,
  blockedIds = [],
}: {
  members: Member[];
  currentUserId: string | null;
  blockedIds?: string[];
}) {
  const router = useRouter();
  const [followState, setFollowState] = useState<Record<string, boolean>>(
    Object.fromEntries(members.map((m) => [m.id, m.is_following]))
  );
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(members.map((m) => [m.id, m.follower_count]))
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [blockState, setBlockState] = useState<Set<string>>(new Set(blockedIds));
  const [blockLoading, setBlockLoading] = useState<string | null>(null);

  async function toggleFollow(memberId: string) {
    if (!currentUserId) { router.push("/login"); return; }

    const isFollowing = followState[memberId];
    setLoading(memberId);

    const res = await fetch("/api/crew/follow", {
      method: isFollowing ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following_id: memberId }),
    });

    if (res.ok) {
      setFollowState((prev) => ({ ...prev, [memberId]: !isFollowing }));
      setCounts((prev) => ({ ...prev, [memberId]: prev[memberId] + (isFollowing ? -1 : 1) }));
    }
    setLoading(null);
  }

  async function toggleBlock(memberId: string) {
    if (!currentUserId) { router.push("/login"); return; }

    const isBlocked = blockState.has(memberId);
    setBlockLoading(memberId);

    const res = await fetch("/api/crew/block", {
      method: isBlocked ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked_id: memberId }),
    });

    if (res.ok) {
      setBlockState((prev) => {
        const next = new Set(prev);
        if (isBlocked) next.delete(memberId); else next.add(memberId);
        return next;
      });
      if (!isBlocked && followState[memberId]) {
        // unfollow when blocking
        await fetch("/api/crew/follow", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ following_id: memberId }),
        });
        setFollowState((prev) => ({ ...prev, [memberId]: false }));
        setCounts((prev) => ({ ...prev, [memberId]: Math.max(0, prev[memberId] - 1) }));
      }
    }
    setBlockLoading(null);
  }

  if (members.length === 0) {
    return (
      <p className="font-story text-muted-ink" style={{ fontSize: "1rem" }}>
        No crew yet. Be the first to register.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "16px",
      }}
    >
      {members.map((member) => (
        <div
          key={member.id}
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(74,59,42,0.35)",
            padding: "24px",
          }}
        >
          {/* Avatar placeholder */}
          <div
            className="bg-forest-dark flex items-center justify-center"
            style={{ width: "48px", height: "48px", marginBottom: "14px", fontSize: "1.1rem" }}
            aria-hidden="true"
          >
            <span className="font-display font-black text-neon-green" style={{ fontSize: "1rem" }}>
              {member.username[0].toUpperCase()}
            </span>
          </div>

          <p
            className="font-display font-bold uppercase text-off-white"
            style={{ fontSize: "1rem", letterSpacing: "-0.01em", marginBottom: "4px" }}
          >
            @{member.username}
          </p>

          {member.bio && (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem", marginBottom: "8px", maxWidth: "28ch" }}>
              {member.bio}
            </p>
          )}

          <p className="font-body text-muted-ink" style={{ fontSize: "0.7rem", marginBottom: "16px" }}>
            {counts[member.id]} follower{counts[member.id] !== 1 ? "s" : ""}
          </p>

          {!member.is_self && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {!blockState.has(member.id) && (
                <button
                  onClick={() => toggleFollow(member.id)}
                  disabled={loading === member.id}
                  className="font-body font-semibold transition-all duration-150 disabled:opacity-50"
                  style={{
                    fontSize: "0.65rem",
                    letterSpacing: "0.12em",
                    padding: "8px 18px",
                    border: "1px solid",
                    cursor: loading === member.id ? "not-allowed" : "pointer",
                    background: followState[member.id] ? "transparent" : "#9BFF3C",
                    color: followState[member.id] ? "#7A7570" : "#111111",
                    borderColor: followState[member.id] ? "rgba(74,59,42,0.5)" : "#9BFF3C",
                  }}
                >
                  {loading === member.id ? "..." : followState[member.id] ? "FOLLOWING" : "FOLLOW"}
                </button>
              )}
              <button
                onClick={() => toggleBlock(member.id)}
                disabled={blockLoading === member.id}
                className="font-body font-semibold transition-all duration-150 disabled:opacity-50"
                style={{
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  padding: "8px 12px",
                  border: "1px solid rgba(74,59,42,0.4)",
                  cursor: blockLoading === member.id ? "not-allowed" : "pointer",
                  background: "transparent",
                  color: blockState.has(member.id) ? "#9BFF3C" : "#8B7355",
                }}
              >
                {blockLoading === member.id ? "..." : blockState.has(member.id) ? "UNBLOCK" : "BLOCK"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
