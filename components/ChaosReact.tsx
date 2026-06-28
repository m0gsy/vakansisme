"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChaosReact({
  chaosId,
  initialCount,
  initialReacted,
  currentUserId,
}: {
  chaosId: string;
  initialCount: number;
  initialReacted: boolean;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [reacted, setReacted] = useState(initialReacted);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!currentUserId) { router.push("/login"); return; }
    setLoading(true);
    const res = await fetch(`/api/chaos/${chaosId}/react`, { method: "POST" });
    if (res.ok) {
      const json = await res.json();
      setReacted(json.reacted);
      setCount(json.count);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={reacted ? "Remove reaction" : "React"}
      style={{
        background: "none",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 0",
        opacity: loading ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      <span style={{ fontSize: "1rem", filter: reacted ? "none" : "grayscale(1)", transition: "filter 0.15s" }}>🔥</span>
      {count > 0 && (
        <span className="font-body" style={{ fontSize: "0.65rem", color: reacted ? "#FF6B1A" : "#4A3B2A", letterSpacing: "0.04em" }}>
          {count}
        </span>
      )}
    </button>
  );
}
