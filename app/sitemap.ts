import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vakansisme.club";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: expeditions }, { data: stories }] = await Promise.all([
    supabase.from("expeditions").select("id"),
    supabase.from("stories").select("id, created_at").eq("published", true),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), priority: 1 },
    { url: `${SITE_URL}/stories`, lastModified: new Date(), priority: 0.9 },
    { url: `${SITE_URL}/crew`, lastModified: new Date(), priority: 0.8 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), priority: 0.7 },
  ];

  const expeditionRoutes: MetadataRoute.Sitemap = (expeditions ?? []).map((e) => ({
    url: `${SITE_URL}/expeditions/${e.id}`,
    lastModified: new Date(),
    priority: 0.8,
  }));

  const storyRoutes: MetadataRoute.Sitemap = (stories ?? []).map((s) => ({
    url: `${SITE_URL}/stories/${s.id}`,
    lastModified: new Date(s.created_at),
    priority: 0.7,
  }));

  return [...staticRoutes, ...expeditionRoutes, ...storyRoutes];
}
