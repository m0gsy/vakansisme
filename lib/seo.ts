import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vakansisme.club";

export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function slugify(input: string): string {
  // lowercase → NFKD normalize → strip combining marks (diacritics) →
  // replace every run of non [a-z0-9] chars with single hyphen → trim leading/trailing hyphens
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildEntityMetadata(opts: {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  type?: "article" | "website";
  noindex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(opts.path);

  const openGraphObj: Record<string, unknown> = {
    title: opts.title,
    url: canonical,
    type: opts.type ?? "website",
  };

  if (opts.description) {
    openGraphObj.description = opts.description;
  }

  if (opts.image) {
    openGraphObj.images = [{ url: opts.image }];
  }

  const twitterObj: Record<string, unknown> = {
    card: "summary_large_image",
    title: opts.title,
  };

  if (opts.description) {
    twitterObj.description = opts.description;
  }

  const metadata: Metadata = {
    title: opts.title,
    alternates: {
      canonical,
    },
    openGraph: openGraphObj,
    twitter: twitterObj,
  };

  if (opts.description) {
    metadata.description = opts.description;
  }

  if (opts.noindex) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  return metadata;
}
