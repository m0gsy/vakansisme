import type { Metadata } from "next";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { resolveSlugOrRedirect } from "@/lib/resolve";
import { absoluteUrl, buildEntityMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import StoryComments from "@/components/StoryComments";
import StoryLikeButton from "@/components/StoryLikeButton";
import ShareButtons from "@/components/ShareButtons";
import MarkdownContent from "@/components/MarkdownContent";
import ViewCounter from "@/components/ViewCounter";
import ReportButton from "@/components/ReportButton";

function readingTime(content: string | null): string {
  const words = (content ?? "").split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

type Params = Promise<{ slug: string }>;

type Story = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  type: string;
  author_handle: string;
  author_id: string;
  image_url: string | null;
  audio_url: string | null;
  content: string | null;
  tags: string[] | null;
  created_at: string;
  view_count: number;
  published: boolean;
};

const getStory = cache(async (param: string) => {
  const supabase = await createClient();
  return resolveSlugOrRedirect<Story>({
    supabase,
    table: "stories",
    entityType: "story",
    param,
    basePath: "/stories",
    select: "*",
    filter: [{ column: "published", value: true }],
  });
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);
  const desc = story.excerpt ?? `A ${story.type} story by ${story.author_handle}.`;
  return buildEntityMetadata({
    title: `${story.title} — VAKANSISME`,
    description: desc,
    path: `/stories/${story.slug}`,
    image: story.image_url,
    type: "article",
  });
}

export default async function StoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const story = await getStory(slug);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: comments }, { count: likeCount }, { data: userLike }] = await Promise.all([
    supabase.from("story_comments").select("id, author_id, author_handle, content, created_at").eq("story_id", story.id).order("created_at", { ascending: true }),
    supabase.from("story_likes").select("*", { count: "exact", head: true }).eq("story_id", story.id),
    user
      ? supabase.from("story_likes").select("user_id").eq("story_id", story.id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const { data: related } = await supabase
    .from("stories")
    .select("id, slug, title, type, image_url, author_handle")
    .eq("published", true)
    .eq("type", story.type)
    .neq("id", story.id)
    .limit(3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    description: story.excerpt ?? undefined,
    author: { "@type": "Person", name: `@${story.author_handle}` },
    ...(story.image_url ? { image: story.image_url } : {}),
    datePublished: story.created_at,
    url: absoluteUrl(`/stories/${story.slug}`),
    mainEntityOfPage: absoluteUrl(`/stories/${story.slug}`),
    publisher: { "@type": "Organization", name: "Vakansisme", url: absoluteUrl("") },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Vakansisme", item: absoluteUrl("") },
      { "@type": "ListItem", position: 2, name: "Journal", item: absoluteUrl("/stories") },
      { "@type": "ListItem", position: 3, name: story.title, item: absoluteUrl(`/stories/${story.slug}`) },
    ],
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {/* Cover image */}
      {story.image_url && (
        <div className="relative w-full" style={{ height: "clamp(260px, 45vw, 520px)" }}>
          <Image
            src={story.image_url}
            alt={story.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ filter: "grayscale(15%) brightness(0.7)" }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 40%, #111111 100%)",
            }}
          />
        </div>
      )}

      <div
        className="max-w-3xl mx-auto px-6"
        style={{ paddingTop: story.image_url ? "40px" : "120px", paddingBottom: "80px" }}
      >
        {/* Back */}
        <Link
          href="/stories"
          className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-10"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
        >
          ← JOURNAL
        </Link>

        {/* Type */}
        <p
          className="font-body font-semibold text-neon-green uppercase"
          style={{ fontSize: "0.65rem", letterSpacing: "0.18em", marginBottom: "14px" }}
        >
          {story.type}
        </p>

        {/* Title */}
        <h1
          className="font-display font-black uppercase text-off-white"
          style={{
            fontSize: "clamp(2rem, 6vw, 4rem)",
            letterSpacing: "-0.025em",
            lineHeight: 0.9,
            marginBottom: "20px",
            textWrap: "balance",
          }}
        >
          {story.title}
        </h1>

        {/* Meta */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            marginBottom: "48px",
            paddingBottom: "24px",
            borderBottom: "1px solid rgba(74,59,42,0.3)",
          }}
        >
          <span className="font-body text-muted-ink" style={{ fontSize: "0.78rem" }}>
            {story.author_handle}
          </span>
          <span className="font-body text-muted-ink" style={{ fontSize: "0.78rem" }}>
            {new Date(story.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span className="font-body text-muted-ink" style={{ fontSize: "0.78rem" }}>
            {readingTime(story.content)}
          </span>
          {story.view_count > 0 && (
            <span className="font-body text-muted-ink" style={{ fontSize: "0.78rem" }}>
              {story.view_count} view{story.view_count !== 1 ? "s" : ""}
            </span>
          )}
          <ReportButton contentType="story" contentId={story.id} currentUserId={user?.id ?? null} />
          {user && story.author_id === user.id && !story.published && (
            <Link
              href={`/stories/${story.slug}/edit`}
              className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-150"
              style={{ fontSize: "0.72rem", letterSpacing: "0.1em" }}
            >
              EDIT
            </Link>
          )}
        </div>

        {/* Tags */}
        {!!story.tags?.length && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
            {(story.tags as string[]).map((tag) => (
              <span
                key={tag}
                className="font-body"
                style={{ fontSize: "0.62rem", letterSpacing: "0.08em", padding: "3px 8px", border: "1px solid rgba(155,255,60,0.25)", color: "#9BFF3C" }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Audio player */}
        {story.audio_url && (
          <div style={{ marginBottom: "28px" }}>
            <p className="font-body font-semibold text-muted-ink uppercase mb-2" style={{ fontSize: "0.62rem", letterSpacing: "0.14em" }}>LISTEN</p>
            <audio
              controls
              src={story.audio_url}
              style={{ width: "100%", height: "36px", accentColor: "#9BFF3C" }}
            />
          </div>
        )}

        {/* Like + Share */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "32px" }}>
          <StoryLikeButton
            storyId={story.id}
            initialCount={likeCount ?? 0}
            initialLiked={!!userLike}
            currentUserId={user?.id ?? null}
          />
          <ShareButtons title={story.title} url={absoluteUrl(`/stories/${story.slug}`)} />
        </div>

        {/* Excerpt */}
        {story.excerpt && (
          <p
            className="font-story text-off-white/80"
            style={{ fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "32px", fontStyle: "italic" }}
          >
            {story.excerpt}
          </p>
        )}

        <ViewCounter storyId={story.id} />

        {/* Content */}
        {story.content ? (
          <MarkdownContent content={story.content} />
        ) : (
          <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem" }}>
            No content yet.
          </p>
        )}

        <StoryComments
          storyId={story.id}
          initialComments={comments ?? []}
          currentUserId={user?.id ?? null}
        />

        {/* Related stories */}
        {!!related?.length && (
          <section style={{ marginTop: "64px", paddingTop: "40px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
            <h2
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}
            >
              MORE {story.type.toUpperCase()}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/stories/${r.slug}`}
                  className="group"
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "#1a1a1a",
                    border: "1px solid rgba(74,59,42,0.3)",
                  }}
                >
                  {r.image_url && (
                    <div className="relative flex-shrink-0" style={{ width: "56px", height: "40px" }}>
                      <Image src={r.image_url} alt={r.title} fill sizes="56px" className="object-cover" style={{ filter: "grayscale(20%)" }} />
                    </div>
                  )}
                  <div>
                    <p
                      className="font-display font-bold uppercase text-off-white group-hover:text-neon-green transition-colors duration-150"
                      style={{ fontSize: "0.85rem", letterSpacing: "-0.01em" }}
                    >
                      {r.title}
                    </p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", marginTop: "2px" }}>
                      {r.author_handle}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
