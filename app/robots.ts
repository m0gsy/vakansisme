import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vakansisme.club";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/settings",
          "/api/",
          "/messages",
          "/notifications",
          "/bookmarks",
          "/feed",
          "/expeditions/propose",
          "/stories/new",
          "/account",
        ],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap/static.xml`,
      `${SITE_URL}/sitemap/stories.xml`,
      `${SITE_URL}/sitemap/expeditions.xml`,
      `${SITE_URL}/sitemap/profiles.xml`,
      `${SITE_URL}/sitemap/series.xml`,
      `${SITE_URL}/sitemap/destinations.xml`,
      `${SITE_URL}/sitemap/hubs.xml`,
    ],
  };
}
