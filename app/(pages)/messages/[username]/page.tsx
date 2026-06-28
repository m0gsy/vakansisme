"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  read: boolean;
  created_at: string;
};

type Profile = { id: string; username: string; avatar_url: string | null };

export default function DMThreadPage() {
  const { username } = useParams() as { username: string };
  const router = useRouter();
  const [myId, setMyId] = useState<string | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auth + load partner profile
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      setMyId(data.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("username", username)
        .single();

      if (!profile) { router.replace("/messages"); return; }
      setPartner(profile);
      setPartnerId(profile.id);
    });
  }, [username, router]);

  // Load messages + Realtime
  useEffect(() => {
    if (!partnerId) return;
    const supabase = createClient();

    fetch(`/api/dm/${partnerId}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setMessages(d));

    const channel = supabase
      .channel(`dm-${partnerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Mark as read if we're the recipient
          if (msg.sender_id === partnerId) {
            fetch(`/api/dm/${partnerId}`, { method: "GET" }).catch(() => {});
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [partnerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!body.trim() || !partnerId || sending) return;
    setSending(true);
    const res = await fetch(`/api/dm/${partnerId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setBody("");
    }
    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px" }}>
        <div className="max-w-2xl mx-auto px-6">
          <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal" style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(17,17,17,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(74,59,42,0.3)",
          padding: "0 24px",
        }}
      >
        <div className="max-w-2xl mx-auto" style={{ height: "64px", display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/messages" className="font-body text-muted-ink hover:text-neon-green transition-colors duration-150" style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}>
            ← BACK
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <div style={{ width: "32px", height: "32px", overflow: "hidden", background: "#1a1a1a", flexShrink: 0 }}>
              {partner.avatar_url ? (
                <Image src={partner.avatar_url} alt={partner.username} width={32} height={32} className="object-cover" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="font-display font-black text-neon-green" style={{ fontSize: "0.9rem" }}>{partner.username[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
            <Link href={`/u/${partner.username}`} className="font-body font-semibold text-off-white hover:text-neon-green transition-colors duration-150" style={{ fontSize: "0.85rem" }}>
              @{partner.username}
            </Link>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "80px 24px 120px", maxWidth: "672px", margin: "0 auto", width: "100%" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.85rem" }}>
              Start a conversation with @{partner.username}.
            </p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === myId;
            const prevMsg = messages[i - 1];
            const showDate = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
            return (
              <div key={msg.id}>
                {showDate && (
                  <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                    <span className="font-body text-muted-ink" style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                      {new Date(msg.created_at).toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      maxWidth: "72%",
                      padding: "10px 14px",
                      background: isMe ? "#9BFF3C" : "#1a1a1a",
                      border: "1px solid",
                      borderColor: isMe ? "#9BFF3C" : "rgba(74,59,42,0.3)",
                    }}
                  >
                    <p
                      className="font-body"
                      style={{ fontSize: "0.85rem", color: isMe ? "#111" : "#F0EDEA", lineHeight: 1.55, wordBreak: "break-word" }}
                    >
                      {msg.body}
                    </p>
                    <p
                      className="font-body"
                      style={{ fontSize: "0.58rem", marginTop: "4px", color: isMe ? "rgba(17,17,17,0.6)" : "#8B7355", textAlign: isMe ? "right" : "left" }}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#111",
          borderTop: "1px solid rgba(74,59,42,0.3)",
          padding: "16px 24px",
        }}
      >
        <div className="max-w-2xl mx-auto" style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            style={{
              flex: 1,
              background: "#1a1a1a",
              border: "1px solid rgba(74,59,42,0.4)",
              color: "#F0EDEA",
              padding: "12px 14px",
              fontSize: "0.85rem",
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={send}
            disabled={!body.trim() || sending}
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-40"
            style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "12px 20px", flexShrink: 0, cursor: "pointer", border: "none" }}
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}
