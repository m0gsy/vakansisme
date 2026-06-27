import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

const PAGE_SIZE = 12;
const FALLBACK = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80";
const STORY_TYPES = ["photo dump", "short story", "video POV", "chaos moment"] as const;

type SearchParams = Promise<{ page?: string; type?: string }>;

export default async function StoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageStr, type } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("stories")
    .select("id, author_handle, type, title, excerpt, image_url, created_at", { count: "exact" })
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);

  const { data: stories, count } = await query.range(from, to);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const pillHref = (t?: string) => (t ? `/stories?type=${encodeURIComponent(t)}` : "/stories");
  const pageHref = (p: number) => `/stories?${type ? `type=${encodeURIComponent(type)}&` : ""}page=${p}`;

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div
          style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "56px" }}
        >
          <div>
            <h1
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(3rem, 8vw, 6rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
            >
              JOURNAL
            </h1>
            <p className="font-body text-muted-ink mt-3" style={{ fontSize: "0.9rem" }}>
              {count ?? 0} stories from the field.
            </p>
          </div>
          {user && (
            <Link
              href="/stories/new"
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
              style={{ fontSize: "0.7rem", letterSpacing: "0.12em", padding: "11px 24px" }}
            >
              + WRITE STORY
            </Link>
          )}
        </div>

        {/* Type filter pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "40px" }}>
          <Link
            href={pillHref()}
            className="font-body font-semibold transition-all duration-150"
            style={{
              fontSize: "0.66rem",
              letterSpacing: "0.1em",
              padding: "7px 14px",
              border: "1px solid",
              background: !type ? "#9BFF3C" : "transparent",
              color: !type ? "#111111" : "#8B7355",
              borderColor: !type ? "#9BFF3C" : "rgba(74,59,42,0.5)",
            }}
          >
            ALL
          </Link>
          {STORY_TYPES.map((t) => {
            const active = type === t;
            return (
              <Link
                key={t}
                href={pillHref(t)}
                className="font-body font-semibold transition-all duration-150"
                style={{
                  fontSize: "0.66rem",
                  letterSpacing: "0.08em",
                  padding: "7px 14px",
                  border: "1px solid",
                  background: active ? "#9BFF3C" : "transparent",
                  color: active ? "#111111" : "#8B7355",
                  borderColor: active ? "#9BFF3C" : "rgba(74,59,42,0.5)",
                }}
              >
                {t}
              </Link>
            );
          })}
        </div>

        {/* Grid */}
        {!stories?.length ? (
          <p className="font-story text-muted-ink" style={{ fontSize: "1rem" }}>
            No stories{type ? ` tagged "${type}"` : ""} yet.
          </p>
        ) : (
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}
          >
            {stories.map((story) => (
              <Link key={story.id} href={`/stories/${story.id}`} className="group block">
                <article style={{ background: "#1F3B2C", border: "1px solid rgba(74,59,42,0.4)" }}>
                  <div className="relative overflow-hidden" style={{ height: "180px" }}>
                    <Image
                      src={story.image_url ?? FALLBACK}
                      alt={story.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ filter: "grayscale(20%) brightness(0.85)" }}
                    />
                    <div
                      aria-hidden="true"
                      style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(31,59,44,0.6) 0%, transparent 60%)" }}
                    />
                    <span
                      className="font-body font-semibold text-neon-green uppercase absolute bottom-3 left-3"
                      style={{ fontSize: "0.6rem", letterSpacing: "0.14em" }}
                    >
                      {story.type}
                    </span>
                  </div>
                  <div style={{ padding: "18px 20px 20px" }}>
                    <h2
                      className="font-display font-bold uppercase text-off-white leading-tight"
                      style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)", letterSpacing: "-0.01em", marginBottom: "8px" }}
                    >
                      {story.title}
                    </h2>
                    {story.excerpt && (
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.8rem", marginBottom: "12px" }}>
                        {story.excerpt}
                      </p>
                    )}
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.7rem" }}>
                      {story.author_handle} · {new Date(story.created_at).toLocaleDateString("en", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "56px", alignItems: "center" }}
          >
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 16px", border: "1px solid rgba(74,59,42,0.4)" }}
              >
                ← PREV
              </Link>
            )}
            <span
              className="font-body text-muted-ink"
              style={{ fontSize: "0.68rem", letterSpacing: "0.1em", padding: "8px 12px" }}
            >
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 16px", border: "1px solid rgba(74,59,42,0.4)" }}
              >
                NEXT →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
