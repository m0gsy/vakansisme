import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/seo";

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
        .select("slug, created_at, image_url");

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
      const { data: series } = await supabase.from("story_series").select("slug, created_at");

      return (series ?? []).map((s) => ({
        url: absoluteUrl(`/series/${s.slug}`),
        lastModified: new Date(s.created_at),
        priority: 0.6,
      }));
    }

    // ponytail: destinations table arrives Task 7
    case "destinations":
      return [];

    // ponytail: hubs arrive Task 10
    case "hubs":
      return [];

    default:
      return [];
  }
}
