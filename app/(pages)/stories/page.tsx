import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { t as tr } from "@/lib/i18n";

import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vakansisme.club";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string; type?: string }> }): Promise<Metadata> {
  const { page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const canonical = pageNum > 1 ? `${SITE_URL}/stories?page=${pageNum}` : `${SITE_URL}/stories`;
  return {
    title: "Stories — Jurnal Petualangan | Vakansisme",
    description: "Baca cerita perjalanan, photo dump, dan momen chaos dari komunitas Vakansisme. Tulis dan bagikan petualanganmu.",
    alternates: { canonical },
    openGraph: {
      title: "Stories — Vakansisme",
      description: "Jurnal petualangan komunitas outdoor Indonesia.",
      type: "website",
      url: canonical,
    },
    twitter: { card: "summary_large_image", title: "Stories — Vakansisme" },
  };
}

const PAGE_SIZE = 12;
const FALLBACK = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80";
const STORY_TYPES = ["photo dump", "short story", "video POV", "chaos moment"] as const;
const COMMON_TAGS = ["indonesia", "gunung", "pantai", "kota", "solo", "couple", "backpacker", "budget", "offroad", "night hike"];

type SearchParams = Promise<{ page?: string; type?: string; tag?: string }>;

export default async function StoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageStr, type, tag } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const locale = await getLocale();
  const { data: { user } } = await supabase.auth.getUser();

  let blockedIds: string[] = [];
  if (user) {
    const { data: blocks } = await supabase.from("user_blocks").select("blocked_id").eq("blocker_id", user.id);
    blockedIds = (blocks ?? []).map((b) => b.blocked_id);
  }

  let query = supabase
    .from("stories")
    .select("id, slug, author_id, author_handle, type, title, excerpt, image_url, created_at, tags, view_count, featured", { count: "exact" })
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);
  if (tag) query = query.contains("tags", [tag]);
  if (blockedIds.length) query = query.not("author_id", "in", `(${blockedIds.join(",")})`);

  const { data: stories, count } = await query.range(from, to);

  // Trending: top 4 most liked stories in last 7 days (via DB view)
  let trendingStories: { id: string; slug: string; title: string; author_handle: string; image_url: string | null; type: string }[] = [];
  if (!type && !tag && page === 1) {
    const { data: trendingIds } = await supabase
      .from("trending_stories")
      .select("story_id");
    const topIds = (trendingIds ?? []).map((r) => r.story_id as string);
    if (topIds.length) {
      const { data: trending } = await supabase
        .from("stories")
        .select("id, slug, title, author_handle, image_url, type")
        .eq("published", true)
        .in("id", topIds);
      trendingStories = trending ?? [];
    }
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  function pillHref(t?: string, g?: string) {
    const params = new URLSearchParams();
    if (t) params.set("type", t);
    if (g) params.set("tag", g);
    return `/stories${params.size ? "?" + params.toString() : ""}`;
  }

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (tag) params.set("tag", tag);
    params.set("page", String(p));
    return `/stories?${params.toString()}`;
  }

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Stories — Jurnal Petualangan | Vakansisme",
    description: "Baca cerita perjalanan, photo dump, dan momen chaos dari komunitas Vakansisme.",
    url: `${SITE_URL}/stories`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "48px" }}>
          <div>
            <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(3rem, 8vw, 6rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}>
              {tr(locale, "page_stories")}
            </h1>
            <p className="font-body text-muted-ink mt-3" style={{ fontSize: "0.9rem" }}>
              {count ?? 0} {locale === "id" ? "cerita dari lapangan." : "stories from the field."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/series"
              className="font-body font-semibold text-off-white/70 hover:text-off-white transition-colors duration-150"
              style={{ fontSize: "0.7rem", letterSpacing: "0.12em", padding: "11px 20px", border: "1px solid rgba(74,59,42,0.4)" }}
            >
              {tr(locale, "series")}
            </Link>
            {user && (
              <Link
                href="/stories/new"
                className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
                style={{ fontSize: "0.7rem", letterSpacing: "0.12em", padding: "11px 24px" }}
              >
                + {tr(locale, "write_story")}
              </Link>
            )}
          </div>
        </div>

        {/* Trending this week */}
        {trendingStories.length > 0 && (
          <div style={{ marginBottom: "48px" }}>
            <p className="font-body font-semibold text-muted-ink uppercase mb-4" style={{ fontSize: "0.62rem", letterSpacing: "0.14em" }}>
              {tr(locale, "trending")}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px" }}>
              {trendingStories.map((s) => (
                <Link key={s.id} href={`/stories/${s.slug}`} className="group flex items-center gap-3" style={{ padding: "10px 14px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)" }}>
                  {s.image_url && (
                    <div style={{ position: "relative", width: "44px", height: "36px", flexShrink: 0 }}>
                      <Image src={s.image_url} alt={s.title} fill sizes="44px" className="object-cover" style={{ filter: "grayscale(20%)" }} />
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p className="font-display font-bold uppercase text-off-white group-hover:text-neon-green transition-colors duration-150" style={{ fontSize: "0.78rem", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.title}
                    </p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.62rem" }}>{s.author_handle}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Type filter pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          {[undefined, ...STORY_TYPES].map((t) => {
            const active = type === t || (!type && !t);
            return (
              <Link
                key={t ?? "all"}
                href={pillHref(t, tag)}
                className="font-body font-semibold transition-all duration-150"
                style={{
                  fontSize: "0.66rem", letterSpacing: "0.1em", padding: "7px 14px", border: "1px solid",
                  background: active ? "#9BFF3C" : "transparent",
                  color: active ? "#111111" : "#8B7355",
                  borderColor: active ? "#9BFF3C" : "rgba(74,59,42,0.5)",
                }}
              >
                {t ? t : tr(locale, "all")}
              </Link>
            );
          })}
        </div>

        {/* Tag filter pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "40px" }}>
          {tag && (
            <Link
              href={pillHref(type)}
              className="font-body font-semibold transition-all duration-150"
              style={{ fontSize: "0.6rem", letterSpacing: "0.08em", padding: "5px 10px", background: "rgba(155,255,60,0.15)", border: "1px solid rgba(155,255,60,0.4)", color: "#9BFF3C" }}
            >
              #{tag} ✕
            </Link>
          )}
          {COMMON_TAGS.filter((t) => t !== tag).map((t) => (
            <Link
              key={t}
              href={pillHref(type, t)}
              className="font-body text-muted-ink hover:text-off-white transition-colors duration-150"
              style={{ fontSize: "0.6rem", letterSpacing: "0.06em", padding: "5px 10px", border: "1px solid rgba(74,59,42,0.3)" }}
            >
              #{t}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {!stories?.length ? (
          <p className="font-story text-muted-ink" style={{ fontSize: "1rem" }}>
            {locale === "id"
              ? `Belum ada cerita${type ? ` bertipe "${type}"` : ""}${tag ? ` dengan #${tag}` : ""} nih.`
              : `No stories${type ? ` tagged "${type}"` : ""}${tag ? ` with #${tag}` : ""} yet.`}
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {stories.map((story) => (
              <Link key={story.id} href={`/stories/${story.slug}`} className="group block">
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
                    <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(31,59,44,0.6) 0%, transparent 60%)" }} />
                    {(story as { featured?: boolean }).featured && (
                      <span className="font-body font-semibold text-charcoal absolute top-3 right-3" style={{ fontSize: "0.58rem", letterSpacing: "0.1em", padding: "2px 7px", background: "#9BFF3C" }}>★ FEATURED</span>
                    )}
                    <span className="font-body font-semibold text-neon-green uppercase absolute bottom-3 left-3" style={{ fontSize: "0.6rem", letterSpacing: "0.14em" }}>
                      {story.type}
                    </span>
                    {story.view_count > 0 && (
                      <span className="font-body text-off-white/60 absolute bottom-3 right-3" style={{ fontSize: "0.58rem" }}>
                        {story.view_count} views
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "18px 20px 20px" }}>
                    <h2 className="font-display font-bold uppercase text-off-white leading-tight" style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)", letterSpacing: "-0.01em", marginBottom: "8px" }}>
                      {story.title}
                    </h2>
                    {story.excerpt && (
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.8rem", marginBottom: "10px" }}>
                        {story.excerpt}
                      </p>
                    )}
                    {story.tags?.length > 0 && (
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                        {(story.tags as string[]).slice(0, 3).map((t) => (
                          <span key={t} className="font-body" style={{ fontSize: "0.58rem", letterSpacing: "0.06em", padding: "2px 6px", border: "1px solid rgba(155,255,60,0.2)", color: "#9BFF3C" }}>
                            #{t}
                          </span>
                        ))}
                      </div>
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
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "56px", alignItems: "center" }}>
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150" style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 16px", border: "1px solid rgba(74,59,42,0.4)" }}>
                ← PREV
              </Link>
            )}
            <span className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.1em", padding: "8px 12px" }}>
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150" style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 16px", border: "1px solid rgba(74,59,42,0.4)" }}>
                NEXT →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
