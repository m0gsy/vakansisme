"use client";

import { useState } from "react";
import Link from "next/link";

type PendingMember = { user_id: string; profiles: { username: string } | null };
type ApprovedMember = { user_id: string; profiles: { username: string; avatar_url: string | null } | null };

export default function MemberManagement({
  expeditionId,
  currentUserId,
  initialPending,
  initialApproved,
  locale,
}: {
  expeditionId: string;
  currentUserId: string | null;
  initialPending: PendingMember[];
  initialApproved: ApprovedMember[];
  locale: string;
}) {
  const [pending, setPending] = useState<PendingMember[]>(initialPending);
  const [approved, setApproved] = useState<ApprovedMember[]>(initialApproved);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const t = (key: string) => {
    const map: Record<string, Record<string, string>> = {
      en: { approve: "APPROVE", reject: "REJECT", revoke: "REVOKE", pending_members: "PENDING APPROVAL", crew: "CREW" },
      id: { approve: "SETUJU", reject: "TOLAK", revoke: "CABUT", pending_members: "NUNGGU PERSETUJUAN", crew: "ANGGOTA" },
    };
    return map[locale]?.[key] ?? map.en[key] ?? key;
  };

  async function doAction(userId: string, act: "approve" | "reject" | "pending") {
    if (loadingId) return;
    setLoadingId(userId);

    // ponytail: snapshot before optimistic update for rollback
    const prevPending = [...pending];
    const prevApproved = [...approved];

    if (act === "approve") {
      const member = pending.find((m) => m.user_id === userId);
      if (member) {
        setPending((prev) => prev.filter((m) => m.user_id !== userId));
        setApproved((prev) => [
          ...prev,
          { ...member, profiles: member.profiles as { username: string; avatar_url: string | null } | null },
        ]);
      }
    } else if (act === "reject") {
      setPending((prev) => prev.filter((m) => m.user_id !== userId));
    } else if (act === "pending") {
      const member = approved.find((m) => m.user_id === userId);
      if (member) {
        setApproved((prev) => prev.filter((m) => m.user_id !== userId));
        setPending((prev) => [...prev, { ...member, profiles: member.profiles as { username: string } | null }]);
      }
    }

    const res = await fetch(`/api/expeditions/${expeditionId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act }),
    });

    setLoadingId(null);
    if (!res.ok) {
      setPending(prevPending);
      setApproved(prevApproved);
    }
  }

  // ponytail: inline style object avoids repeated style props on every button
  const BTN: React.CSSProperties = {
    fontFamily: "inherit",
    fontSize: "0.6rem",
    letterSpacing: "0.1em",
    padding: "5px 12px",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
  };

  return (
    <>
      {/* Pending members */}
      {pending.length > 0 && (
        <div style={{ marginBottom: "32px", padding: "16px 20px", background: "#1a1a1a", border: "1px solid rgba(155,255,60,0.2)" }}>
          <p className="font-body font-semibold text-neon-green uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "12px" }}>
            {t("pending_members")} ({pending.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pending.map((m) => {
              const profile = Array.isArray(m.profiles) ? (m.profiles as unknown as { username: string }[])[0] : m.profiles as { username: string } | null;
              if (!profile) return null;
              const busy = loadingId === m.user_id;
              return (
                <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span className="font-body font-semibold text-off-white" style={{ fontSize: "0.78rem", letterSpacing: "0.04em", flex: 1 }}>
                    @{profile.username}
                  </span>
                  <button
                    onClick={() => doAction(m.user_id, "approve")}
                    disabled={busy}
                    className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
                    style={{ ...BTN, opacity: busy ? 0.5 : 1 }}
                  >
                    {busy ? "…" : t("approve")}
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm(`Remove @${profile.username} from this expedition? This cannot be undone.`)) return;
                      doAction(m.user_id, "reject");
                    }}
                    disabled={busy}
                    className="font-body font-semibold text-off-white hover:text-chaos-orange transition-colors duration-150"
                    style={{ ...BTN, border: "1px solid rgba(255,107,26,0.4)", background: "transparent", opacity: busy ? 0.5 : 1 }}
                  >
                    {t("reject")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approved members */}
      {approved.length > 0 && (
        <div>
          <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "14px" }}>
            {t("crew")} ({approved.length})
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {approved.map((m) => {
              const profile = Array.isArray(m.profiles) ? (m.profiles as unknown as { username: string; avatar_url: string | null }[])[0] : m.profiles as { username: string; avatar_url: string | null } | null;
              if (!profile) return null;
              const busy = loadingId === m.user_id;
              const isSelf = m.user_id === currentUserId;
              return (
                <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Link
                    href={`/u/${profile.username}`}
                    className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                    style={{ fontSize: "0.72rem", letterSpacing: "0.06em", padding: "6px 12px", border: "1px solid rgba(74,59,42,0.4)", background: "#1a1a1a" }}
                  >
                    @{profile.username}
                  </Link>
                  {!isSelf && (
                    <button
                      onClick={() => {
                        if (!confirm(`Revoke approval for @${profile.username}? They'll return to the pending list.`)) return;
                        doAction(m.user_id, "pending");
                      }}
                      disabled={busy}
                      className="font-body text-muted-ink hover:text-chaos-orange transition-colors duration-150"
                      style={{ ...BTN, background: "none", border: "none", fontSize: "0.6rem", padding: "4px 6px", opacity: busy ? 0.5 : 1 }}
                      title="Revoke approval"
                    >
                      {busy ? "…" : "↩"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
