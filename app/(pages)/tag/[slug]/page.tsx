import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl, buildEntityMetadata, slugify } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

const FALLBACK = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80";

type StoryRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  type: string;
  image_url: string | null;
  author_handle: string;
  created_at: string;
};

// ponytail: no tags table — resolve the slug against published stories' tags column each request.
const getTagData = cache(async (param: string) => {
  const supabase = await createClient();

  const { data: tagRows } = await supabase
    .from("stories")
    .select("tags")
    .eq("published", true)
    .not("tags", "is", null);

  const allTags = new Set<string>();
  for (const row of tagRows ?? []) {
    for (const t of (row.tags as string[] | null) ?? []) allTags.add(t);
  }
  const tag = [...allTags].find((t) => slugify(t) === param);
  if (!tag) notFound();

  const { data: stories } = await supabase
    .from("stories")
    .select("id, slug, title, excerpt, type, image_url, author_handle, created_at")
    .eq("published", true)
    .contains("tags", [tag])
    .order("created_at", { ascending: false })
    .limit(24);

  return { tag, stories: (stories ?? []) as StoryRow[] };
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { tag, stories } = await getTagData(slug);
  return buildEntityMetadata({
    title: `#${tag} — VAKANSISME`,
    description: `Stories tagged #${tag} on Vakansisme.`,
    path: `/tag/${slug}`,
    noindex: stories.length < 2,
  });
}

export default async function TagPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { tag, stories } = await getTagData(slug);

  const url = absoluteUrl(`/tag/${slug}`);
  const crumbs: { name: string; href?: string }[] = [
    { name: "HOME", href: "/" },
    { name: "STORIES", href: "/stories" },
    { name: `#${tag}` },
  ];

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `#${tag}`,
    url,
    isPartOf: { "@id": `${absoluteUrl("")}/#website` },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.href ? absoluteUrl(c.href) : url,
    })),
  };

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="max-w-7xl mx-auto px-6">
        <nav
          className="font-body font-semibold text-muted-ink"
          style={{ fontSize: "0.7rem", letterSpacing: "0.08em", marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "6px" }}
        >
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {c.href ? (
                <Link href={c.href} className="hover:text-off-white transition-colors duration-150">
                  {c.name}
                </Link>
              ) : (
                <span className="text-off-white">{c.name}</span>
              )}
              {i < crumbs.length - 1 && <span>→</span>}
            </span>
          ))}
        </nav>

        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(2rem, 6vw, 4rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "12px", textWrap: "balance" }}
        >
          #{tag.toUpperCase()}
        </h1>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "48px" }}>
          {stories.length} {stories.length === 1 ? "story" : "stories"}
        </p>

        {!stories.length ? (
          <p className="font-story text-muted-ink" style={{ fontSize: "1rem" }}>
            No stories tagged #{tag} yet.
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
                    <span className="font-body font-semibold text-neon-green uppercase absolute bottom-3 left-3" style={{ fontSize: "0.6rem", letterSpacing: "0.14em" }}>
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
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.8rem", marginBottom: "10px" }}>
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
      </div>
    </div>
  );
}
