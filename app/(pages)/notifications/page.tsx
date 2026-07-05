"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

const TYPE_ICONS: Record<string, string> = {
  join: "↗",
  story_approved: "✓",
  story_rejected: "✕",
  new_follower: "⊕",
  leader_update: "◈",
  gallery_approved: "◻",
  gallery_rejected: "◻",
  proposal_approved: "✓",
  proposal_rejected: "✕",
  story_like: "♥",
  story_comment: "◆",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/login"); return; }

      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => { setNotifs(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));

      const channel = supabase
        .channel("notif-page")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${data.user.id}` },
          (payload) => setNotifs((prev) => [payload.new as Notif, ...prev])
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    });
  }, []);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-2xl mx-auto px-6">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "48px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
            >
              NOTIFICATIONS
            </h1>
            {unread > 0 && (
              <p className="font-body text-muted-ink mt-2" style={{ fontSize: "0.82rem" }}>
                {unread} unread
              </p>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-150"
              style={{ background: "none", border: "1px solid rgba(74,59,42,0.4)", cursor: "pointer", padding: "8px 18px", fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              MARK ALL READ
            </button>
          )}
        </div>

        {loading && (
          <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>Loading…</p>
        )}

        {!loading && notifs.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p className="font-display font-black uppercase text-muted-ink" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", marginBottom: "12px" }}>
              ALL CLEAR
            </p>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.85rem" }}>No notifications yet.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {notifs.map((n) => (
            <div
              key={n.id}
              onClick={async () => {
                if (!n.read) await markRead(n.id);
                if (n.link) router.push(n.link);
              }}
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
                padding: "18px 20px",
                background: n.read ? "#1a1a1a" : "rgba(155,255,60,0.04)",
                border: "1px solid",
                borderColor: n.read ? "rgba(74,59,42,0.25)" : "rgba(155,255,60,0.15)",
                cursor: n.link ? "pointer" : "default",
              }}
            >
              <span
                className="font-display font-black"
                style={{ fontSize: "0.9rem", color: n.read ? "#4A3B2A" : "#9BFF3C", flexShrink: 0, marginTop: "2px" }}
              >
                {TYPE_ICONS[n.type] ?? "·"}
              </span>
              <div style={{ flex: 1 }}>
                <p
                  className="font-body font-semibold text-off-white"
                  style={{ fontSize: "0.85rem", marginBottom: n.body ? "4px" : 0 }}
                >
                  {n.title}
                </p>
                {n.body && (
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem", lineHeight: 1.55 }}>
                    {n.body}
                  </p>
                )}
                <p className="font-body text-muted-ink" style={{ fontSize: "0.62rem", marginTop: "8px" }}>
                  {new Date(n.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {!n.read && (
                <div style={{ width: "6px", height: "6px", background: "#9BFF3C", borderRadius: "50%", flexShrink: 0, marginTop: "6px" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
