"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Story = {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  published: boolean;
  created_at: string;
  excerpt: string | null;
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  published: { bg: "#9BFF3C", color: "#111111" },
  pending:   { bg: "#FF6B1A", color: "#111111" },
  draft:     { bg: "rgba(74,59,42,0.4)", color: "#8B7355" },
  rejected:  { bg: "rgba(255,107,26,0.15)", color: "#FF6B1A" },
};

export default function MyStoriesPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase
        .from("stories")
        .select("id, slug, title, type, status, published, created_at, excerpt")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setStories(data ?? []);
          setLoading(false);
        });
    });
  }, [router]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/stories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setStories((prev) => prev.filter((s) => s.id !== id));
    }
    setDeleting(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-4xl mx-auto px-6">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "8px" }}>
              JOURNAL
            </p>
            <h1
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
            >
              MY STORIES
            </h1>
          </div>
          <Link
            href="/stories/new"
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
            style={{ fontSize: "0.7rem", letterSpacing: "0.12em", padding: "12px 24px" }}
          >
            + NEW STORY
          </Link>
        </div>

        {stories.length === 0 ? (
          <div style={{ paddingTop: "40px" }}>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.95rem", marginBottom: "16px" }}>
              No stories yet.
            </p>
            <Link
              href="/stories/new"
              className="font-body font-semibold text-neon-green hover:text-off-white transition-colors duration-150"
              style={{ fontSize: "0.78rem", letterSpacing: "0.08em" }}
            >
              Write your first story →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {stories.map((s) => {
              const badge = STATUS_STYLE[s.status] ?? STATUS_STYLE.draft;
              const href = s.status === "published" ? `/stories/${s.slug}` : `/stories/${s.slug}/edit`;
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "20px 0",
                    borderBottom: "1px solid rgba(74,59,42,0.25)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span
                        className="font-body font-semibold"
                        style={{ fontSize: "0.58rem", letterSpacing: "0.12em", padding: "2px 7px", textTransform: "uppercase", background: badge.bg, color: badge.color }}
                      >
                        {s.status}
                      </span>
                      <span className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {s.type}
                      </span>
                      <span className="font-body text-muted-ink" style={{ fontSize: "0.68rem" }}>
                        {new Date(s.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <Link href={href} className="group">
                      <h2
                        className="font-display font-black uppercase text-off-white group-hover:text-neon-green transition-colors duration-150"
                        style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: s.excerpt ? "6px" : "0" }}
                      >
                        {s.title}
                      </h2>
                    </Link>
                    {s.excerpt && (
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.8rem", lineHeight: 1.5, maxWidth: "60ch" }}>
                        {s.excerpt.length > 100 ? s.excerpt.slice(0, 100) + "…" : s.excerpt}
                      </p>
                    )}
                    {s.status === "rejected" && (
                      <p className="font-body text-chaos-orange" style={{ fontSize: "0.72rem", marginTop: "6px" }}>
                        Rejected. Edit and resubmit.
                      </p>
                    )}
                    {s.status === "pending" && (
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginTop: "6px" }}>
                        Awaiting review.
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0, paddingTop: "2px" }}>
                    {s.status !== "published" && (
                      <Link
                        href={`/stories/${s.slug}/edit`}
                        className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                        style={{ fontSize: "0.65rem", letterSpacing: "0.1em", padding: "5px 10px", border: "1px solid rgba(74,59,42,0.4)", background: "transparent" }}
                      >
                        EDIT
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(s.id, s.title)}
                      disabled={deleting === s.id}
                      className="font-body font-semibold transition-colors duration-150"
                      style={{ fontSize: "0.65rem", letterSpacing: "0.1em", padding: "5px 10px", border: "1px solid rgba(255,107,26,0.35)", background: "transparent", color: "#FF6B1A", cursor: "pointer", opacity: deleting === s.id ? 0.5 : 1 }}
                    >
                      {deleting === s.id ? "…" : "DELETE"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
