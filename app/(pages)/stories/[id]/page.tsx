import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import StoryComments from "@/components/StoryComments";
import StoryLikeButton from "@/components/StoryLikeButton";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("stories")
    .select("title, excerpt, type, author_handle")
    .eq("id", id)
    .eq("published", true)
    .single();
  if (!data) return { title: "Story — VAKANSISME" };
  return {
    title: `${data.title} — VAKANSISME`,
    description: data.excerpt ?? `A ${data.type} story by ${data.author_handle}.`,
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
        </div>

        {/* Like */}
        <div style={{ marginBottom: "32px" }}>
          <StoryLikeButton
            storyId={id}
            initialCount={likeCount ?? 0}
            initialLiked={!!userLike}
            currentUserId={user?.id ?? null}
          />
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

        {/* Content */}
        {story.content ? (
          <div
            className="font-body text-off-white/75"
            style={{ fontSize: "1rem", lineHeight: 1.85, whiteSpace: "pre-wrap" }}
          >
            {story.content}
          </div>
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
      </div>
    </div>
  );
}
