import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { resolveSlugOrRedirect } from "@/lib/resolve";
import { buildEntityMetadata } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

type Series = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  author_id: string;
  created_at: string;
  profiles: { username: string } | { username: string }[] | null;
};

const getSeries = cache(async (param: string) => {
  const supabase = await createClient();
  return resolveSlugOrRedirect<Series>({
    supabase,
    table: "story_series",
    entityType: "series",
    param,
    basePath: "/series",
    select: "id, slug, title, description, cover_image, author_id, created_at, profiles(username)",
  });
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeries(slug);
  const description = series.description ?? `Baca series cerita "${series.title}" di Vakansisme.`;
  return buildEntityMetadata({
    title: `${series.title} — Vakansisme`,
    description,
    path: `/series/${series.slug}`,
    image: series.cover_image,
    type: "article",
  });
}

export default async function SeriesDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const series = await getSeries(slug);
  const supabase = await createClient();
  const locale = await getLocale();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: stories } = await supabase
    .from("stories")
    .select("id, title, excerpt, image_url, type, series_order, created_at, profiles(username)")
    .eq("series_id", series.id)
    .eq("published", true)
    .order("series_order", { ascending: true });

  const authorProfile = Array.isArray(series.profiles) ? series.profiles[0] : series.profiles as { username: string } | null;
  const isOwner = user?.id === series.author_id;

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      {/* Header */}
      {series.cover_image && (
        <div style={{ position: "relative", height: "320px", marginBottom: 0 }}>
          <Image src={series.cover_image} alt={series.title} fill sizes="100vw" className="object-cover" style={{ filter: "brightness(0.45) grayscale(15%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, #111111 100%)" }} />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6" style={{ paddingTop: series.cover_image ? "0" : "0" }}>
        <Link
          href="/series"
          className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-8"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
        >
          ← {t(locale, "series")}
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
          <h1
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(2rem, 6vw, 4rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
          >
            {series.title}
          </h1>
          {isOwner && (
            <Link
              href={`/series/${series.slug}/edit`}
              className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
              style={{ fontSize: "0.62rem", letterSpacing: "0.1em", border: "1px solid rgba(74,59,42,0.4)", padding: "6px 14px", whiteSpace: "nowrap" }}
            >
              UBAH SERI
            </Link>
          )}
        </div>

        {authorProfile && (
          <p className="font-body font-semibold text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.08em", marginBottom: series.description ? "16px" : "32px" }}>
            oleh <Link href={`/u/${authorProfile.username}`} className="hover:text-off-white transition-colors duration-150">@{authorProfile.username}</Link>
          </p>
        )}

        {series.description && (
          <p className="font-story text-off-white/75" style={{ fontSize: "0.95rem", lineHeight: 1.75, maxWidth: "60ch", marginBottom: "40px" }}>
            {series.description}
          </p>
        )}

        {/* Story list */}
        <h2
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(0.9rem, 2vw, 1.2rem)", letterSpacing: "-0.01em", marginBottom: "16px" }}
        >
          {locale === "id" ? "CERITA DALAM SERI" : "STORIES IN THIS SERIES"}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {!stories?.length ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>Belum ada cerita dalam seri ini.</p>
          ) : (
            stories.map((story, idx) => {
              const profile = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles as { username: string } | null;
              return (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="group"
                  style={{ display: "flex", gap: "20px", alignItems: "center", padding: "20px 22px", background: "#141414", border: "1px solid rgba(74,59,42,0.25)" }}
                >
                  <span
                    className="font-display font-black text-muted-ink group-hover:text-neon-green transition-colors duration-200"
                    style={{ fontSize: "1.8rem", letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0, minWidth: "2ch" }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {story.image_url && (
                    <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
                      <Image src={story.image_url} alt={story.title} fill sizes="72px" className="object-cover" style={{ filter: "grayscale(20%)" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>
                      {story.type}
                    </p>
                    <h3
                      className="font-display font-black uppercase text-off-white group-hover:text-neon-green transition-colors duration-200"
                      style={{ fontSize: "1rem", letterSpacing: "-0.01em", lineHeight: 1.1, marginBottom: "4px" }}
                    >
                      {story.title}
                    </h3>
                    {story.excerpt && (
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
                        {story.excerpt}
                      </p>
                    )}
                    {profile && (
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.62rem", letterSpacing: "0.06em", marginTop: "6px" }}>
                        @{profile.username}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
