"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setNotifs(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: "4px",
          color: "#8B7355",
          display: "flex",
          alignItems: "center",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "#FF6B1A",
              color: "#111111",
              fontSize: "0.5rem",
              fontWeight: 800,
              lineHeight: 1,
              padding: "2px 4px",
              minWidth: "14px",
              textAlign: "center",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 12px)",
            width: "320px",
            background: "#1a1a1a",
            border: "1px solid rgba(74,59,42,0.5)",
            zIndex: 200,
            maxHeight: "420px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              borderBottom: "1px solid rgba(74,59,42,0.3)",
            }}
          >
            <span className="font-body font-semibold text-off-white uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.14em" }}>
              NOTIFICATIONS
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="font-body text-muted-ink hover:text-neon-green transition-colors duration-150"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.6rem", letterSpacing: "0.08em" }}
              >
                MARK ALL READ
              </button>
            )}
          </div>

          {notifs.length === 0 && (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem", padding: "24px 18px", textAlign: "center" }}>
              All clear.
            </p>
          )}

          {notifs.map((n) => (
            <div
              key={n.id}
              onClick={async () => {
                await markRead(n.id);
                setOpen(false);
                if (n.link) router.push(n.link);
              }}
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid rgba(74,59,42,0.2)",
                background: n.read ? "transparent" : "rgba(155,255,60,0.04)",
                cursor: n.link ? "pointer" : "default",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                {!n.read && (
                  <div style={{ width: "6px", height: "6px", background: "#9BFF3C", borderRadius: "50%", marginTop: "5px", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, marginLeft: n.read ? "16px" : 0 }}>
                  <p className="font-body font-semibold text-off-white" style={{ fontSize: "0.78rem", marginBottom: "3px" }}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", lineHeight: 1.5 }}>
                      {n.body}
                    </p>
                  )}
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.62rem", marginTop: "6px" }}>
                    {new Date(n.created_at).toLocaleDateString("en", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {notifs.length > 0 && (
            <div style={{ padding: "12px 18px" }}>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="font-body text-muted-ink hover:text-neon-green transition-colors duration-150"
                style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}
              >
                SEE ALL →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
