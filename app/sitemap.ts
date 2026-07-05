import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl, slugify } from "@/lib/seo";
import { destBasePath } from "@/lib/related";

export async function generateSitemaps() {
  return [
    { id: "static" },
    { id: "stories" },
    { id: "expeditions" },
    { id: "profiles" },
    { id: "series" },
    { id: "destinations" },
    { id: "hubs" },
  ];
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const segment = await id;

  switch (segment) {
    case "static":
      return [
        { url: absoluteUrl("/"), lastModified: new Date(), priority: 1 },
        { url: absoluteUrl("/stories"), lastModified: new Date(), priority: 0.9 },
        { url: absoluteUrl("/crew"), lastModified: new Date(), priority: 0.8 },
        { url: absoluteUrl("/search"), lastModified: new Date(), priority: 0.7 },
        { url: absoluteUrl("/leaderboard"), lastModified: new Date(), priority: 0.7 },
        { url: absoluteUrl("/chaos"), lastModified: new Date(), priority: 0.7 },
        { url: absoluteUrl("/series"), lastModified: new Date(), priority: 0.6 },
        { url: absoluteUrl("/terms"), lastModified: new Date(), priority: 0.3 },
        { url: absoluteUrl("/privacy"), lastModified: new Date(), priority: 0.3 },
      ];

    case "stories": {
      const supabase = await createClient();
      const { data: stories } = await supabase
        .from("stories")
        .select("slug, created_at, image_url")
        .eq("published", true);

      return (stories ?? []).map((s) => ({
        url: absoluteUrl(`/stories/${s.slug}`),
        lastModified: new Date(s.created_at),
        priority: 0.7,
        ...(s.image_url ? { images: [s.image_url] } : {}),
      }));
    }

    case "expeditions": {
      const supabase = await createClient();
      const { data: expeditions } = await supabase
        .from("expeditions")
        .select("slug, created_at, image_url")
        .neq("status", "cancelled");

      return (expeditions ?? []).map((e) => ({
        url: absoluteUrl(`/expeditions/${e.slug}`),
        lastModified: new Date(e.created_at),
        priority: 0.8,
        ...(e.image_url ? { images: [e.image_url] } : {}),
      }));
    }

    case "profiles": {
      const supabase = await createClient();
      const { data: profiles } = await supabase
        .from("profiles")
        .select("username")
        .not("bio", "is", null);

      return (profiles ?? []).map((p) => ({
        url: absoluteUrl(`/u/${p.username}`),
        lastModified: new Date(),
        priority: 0.6,
      }));
    }

    case "series": {
      const supabase = await createClient();
      const [{ data: series }, { data: activeSeries }] = await Promise.all([
        supabase.from("story_series").select("id, slug, created_at"),
        supabase.from("stories").select("series_id").eq("published", true).not("series_id", "is", null),
      ]);
      const activeIds = new Set((activeSeries ?? []).map((s) => s.series_id));

      return (series ?? [])
        .filter((s) => activeIds.has(s.id))
        .map((s) => ({
          url: absoluteUrl(`/series/${s.slug}`),
          lastModified: new Date(s.created_at),
          priority: 0.6,
        }));
    }

    case "destinations": {
      const supabase = await createClient();
      const { data: destinations } = await supabase
        .from("destinations")
        .select("slug, kind, created_at, image_url")
        .not("description", "is", null);

      return (destinations ?? []).map((d) => ({
        url: absoluteUrl(`${destBasePath(d.kind)}/${d.slug}`),
        lastModified: new Date(d.created_at),
        priority: 0.6,
        ...(d.image_url ? { images: [d.image_url] } : {}),
      }));
    }

    case "hubs": {
      const supabase = await createClient();

      const { data: tagRows } = await supabase
        .from("stories")
        .select("tags")
        .eq("published", true)
        .not("tags", "is", null);

      const tagCounts = new Map<string, number>();
      for (const row of tagRows ?? []) {
        for (const t of (row.tags as string[] | null) ?? []) {
          tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
        }
      }
      const tagUrls = [...tagCounts.entries()]
        .filter(([, count]) => count >= 2)
        .map(([tag]) => ({
          url: absoluteUrl(`/tag/${slugify(tag)}`),
          lastModified: new Date(),
          priority: 0.5,
        }));

      const [{ data: activities }, { data: expeditions }] = await Promise.all([
        supabase.from("activities").select("name, slug").eq("archived", false),
        supabase.from("expeditions").select("activity_category"),
      ]);

      const categoryCounts = new Map<string, number>();
      for (const e of expeditions ?? []) {
        categoryCounts.set(e.activity_category, (categoryCounts.get(e.activity_category) ?? 0) + 1);
      }
      const categoryUrls = (activities ?? [])
        .filter((a) => (categoryCounts.get(a.name) ?? 0) >= 2)
        .map((a) => ({
          url: absoluteUrl(`/categories/${a.slug}`),
          lastModified: new Date(),
          priority: 0.5,
        }));

      return [...tagUrls, ...categoryUrls];
    }

    default:
      return [];
  }
}
