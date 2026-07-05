import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/AdminNav";
import { StoryModerationActions } from "@/components/AdminActions";
import { tableStyle, rowStyle, Cell, TH } from "@/components/AdminTable";

export const metadata = { title: "Stories — Admin — VAKANSISME" };

export default async function AdminStoriesPage() {
  const { supabase } = await requireAdmin();

  const [{ data: pendingStories }, { data: allStories }] = await Promise.all([
    supabase
      .from("stories")
      .select("id, slug, author_handle, type, title, excerpt, created_at, featured")
      .eq("published", false)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("stories")
      .select("id, slug, author_handle, type, title, status, created_at, featured")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div style={{ marginBottom: "48px" }}>
          <p className="font-body font-semibold text-chaos-orange uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.14em", marginBottom: "8px" }}>ADMIN</p>
          <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}>
            STORIES
          </h1>
        </div>

        <AdminNav active="stories" />

        <section style={{ marginBottom: "56px" }}>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}>
            STORIES PENDING ({pendingStories?.length ?? 0})
          </h2>
          {!pendingStories?.length ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>No stories awaiting review.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead style={{ borderBottom: "1px solid rgba(74,59,42,0.4)" }}>
                  <tr>
                    <TH>Title</TH>
                    <TH>Author</TH>
                    <TH>Type</TH>
                    <TH>Date</TH>
                    <TH>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {pendingStories.map((s) => (
                    <tr key={s.id} style={rowStyle}>
                      <Cell>
                        <Link
                          href={`/stories/${s.slug}/edit`}
                          className="hover:text-neon-green transition-colors duration-150"
                        >
                          {s.title}
                        </Link>
                        {s.excerpt && (
                          <span className="font-body text-muted-ink block" style={{ fontSize: "0.72rem", marginTop: "2px" }}>
                            {s.excerpt.length > 70 ? s.excerpt.slice(0, 70) + "…" : s.excerpt}
                          </span>
                        )}
                      </Cell>
                      <Cell muted>{s.author_handle}</Cell>
                      <Cell muted>{s.type}</Cell>
                      <Cell muted>
                        {new Date(s.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                      </Cell>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <StoryModerationActions id={s.id} initialFeatured={(s as { featured?: boolean }).featured ?? false} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={{ marginBottom: "56px" }}>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}>
            ALL STORIES ({allStories?.length ?? 0})
          </h2>
          {!allStories?.length ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>No stories yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead style={{ borderBottom: "1px solid rgba(74,59,42,0.4)" }}>
                  <tr>
                    <TH>Title</TH>
                    <TH>Author</TH>
                    <TH>Type</TH>
                    <TH>Status</TH>
                    <TH>Date</TH>
                    <TH>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {allStories.map((s) => {
                    const badge =
                      s.status === "published"
                        ? { bg: "#9BFF3C", fg: "#111111" }
                        : s.status === "pending"
                        ? { bg: "#FF6B1A", fg: "#111111" }
                        : { bg: "rgba(74,59,42,0.4)", fg: "#8B7355" };
                    return (
                      <tr key={s.id} style={rowStyle}>
                        <Cell>
                          <Link
                            href={s.status === "published" ? `/stories/${s.slug}` : `/stories/${s.slug}/edit`}
                            className="hover:text-neon-green transition-colors duration-150"
                          >
                            {s.title}
                          </Link>
                        </Cell>
                        <Cell muted>{s.author_handle}</Cell>
                        <Cell muted>{s.type}</Cell>
                        <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <span
                            className="font-body font-semibold"
                            style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "3px 8px", background: badge.bg, color: badge.fg, textTransform: "uppercase" }}
                          >
                            {s.status}
                          </span>
                        </td>
                        <Cell muted>
                          {new Date(s.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                        </Cell>
                        <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <StoryModerationActions id={s.id} initialFeatured={(s as { featured?: boolean }).featured ?? false} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
