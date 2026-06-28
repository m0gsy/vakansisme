"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  partnerId: string;
  username: string;
  avatar_url: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

export default function MessagesPage() {
  const router = useRouter();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      fetch("/api/dm")
        .then((r) => r.json())
        .then((d) => { setConvos(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-2xl mx-auto px-6">
        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "48px" }}
        >
          MESSAGES
        </h1>

        {loading && (
          <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>Loading…</p>
        )}

        {!loading && !convos.length && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p className="font-display font-black uppercase text-muted-ink" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", marginBottom: "12px" }}>
              NO MESSAGES
            </p>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.85rem", marginBottom: "28px" }}>
              Find crew members and start a conversation.
            </p>
            <Link
              href="/crew"
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
              style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "12px 28px" }}
            >
              BROWSE CREW →
            </Link>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {convos.map((c) => (
            <Link key={c.partnerId} href={`/messages/${c.username}`} className="group block">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px 20px",
                  background: c.unread > 0 ? "rgba(155,255,60,0.04)" : "#1a1a1a",
                  border: "1px solid",
                  borderColor: c.unread > 0 ? "rgba(155,255,60,0.15)" : "rgba(74,59,42,0.25)",
                }}
              >
                <div className="relative flex-shrink-0" style={{ width: "44px", height: "44px", overflow: "hidden", background: "#111" }}>
                  {c.avatar_url ? (
                    <Image src={c.avatar_url} alt={c.username} fill className="object-cover" sizes="44px" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="font-display font-black text-neon-green" style={{ fontSize: "1.1rem" }}>{c.username[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span
                      className={`font-body font-semibold ${c.unread > 0 ? "text-off-white" : "text-muted-ink group-hover:text-off-white"} transition-colors duration-150`}
                      style={{ fontSize: "0.85rem" }}
                    >
                      @{c.username}
                    </span>
                    <span className="font-body text-muted-ink" style={{ fontSize: "0.62rem" }}>
                      {new Date(c.lastAt).toLocaleDateString("en", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p
                    className="font-body text-muted-ink"
                    style={{ fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {c.lastMessage}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span
                    style={{
                      background: "#9BFF3C",
                      color: "#111",
                      fontSize: "0.55rem",
                      fontWeight: 800,
                      padding: "2px 6px",
                      minWidth: "20px",
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    {c.unread > 9 ? "9+" : c.unread}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
