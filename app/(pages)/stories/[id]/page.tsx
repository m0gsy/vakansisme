import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("stories")
    .select("title, excerpt, type, author_handle, image_url")
    .eq("id", id)
    .eq("published", true)
    .single();
  if (!data) return { title: "Story — VAKANSISME" };
  const desc = data.excerpt ?? `A ${data.type} story by ${data.author_handle}.`;
  return {
    title: `${data.title} — VAKANSISME`,
    description: desc,
    openGraph: {
      title: data.title,
      description: desc,
      ...(data.image_url ? { images: [{ url: data.image_url, width: 1200, height: 630 }] } : {}),
    },
  };
}

export default async function StoryPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: story }, { data: comments }, { count: likeCount }, { data: userLike }] = await Promise.all([
    supabase.from("stories").select("*").eq("id", id).eq("published", true).single(),
    supabase.from("story_comments").select("id, author_id, author_handle, content, created_at").eq("story_id", id).order("created_at", { ascending: true }),
    supabase.from("story_likes").select("*", { count: "exact", head: true }).eq("story_id", id),
    user
      ? supabase.from("story_likes").select("user_id").eq("story_id", id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!story) notFound();

  const { data: related } = await supabase
    .from("stories")
    .select("id, title, type, image_url, author_handle")
    .eq("published", true)
    .eq("type", story.type)
    .neq("id", id)
    .limit(3);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vakansisme.club";

  return (
    <div className="min-h-screen bg-charcoal">
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
          <ReportButton contentType="story" contentId={id} currentUserId={user?.id ?? null} />
          {user && story.author_id === user.id && !story.published && (
            <Link
              href={`/stories/${id}/edit`}
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
            storyId={id}
            initialCount={likeCount ?? 0}
            initialLiked={!!userLike}
            currentUserId={user?.id ?? null}
          />
          <ShareButtons title={story.title} url={`${siteUrl}/stories/${id}`} />
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

        <ViewCounter storyId={id} />

        {/* Content */}
        {story.content ? (
          <MarkdownContent content={story.content} />
        ) : (
          <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem" }}>
            No content yet.
          </p>
        )}

        <StoryComments
          storyId={id}
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
                  href={`/stories/${r.id}`}
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
