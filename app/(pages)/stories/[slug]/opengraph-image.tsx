import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = Promise<{ slug: string }>;

export default async function Image({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const select = "title, excerpt, type, author_handle, image_url";
  const { data: story } = await supabase
    .from("stories")
    .select(select)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  // ponytail: no redirect here (image routes can't 301) — fall back to a UUID lookup for
  // old-style og-image requests still in a CDN/social-card cache.
  const { data: fallbackStory } =
    !story && UUID_RE.test(slug)
      ? await supabase.from("stories").select(select).eq("id", slug).eq("published", true).maybeSingle()
      : { data: null };

  const resolved = story ?? fallbackStory;

  const TYPE_COLORS: Record<string, string> = {
    trip: "#9BFF3C",
    gear: "#FF6B1A",
    opinion: "#F0EDEA",
  };
  const accentColor = TYPE_COLORS[resolved?.type ?? ""] ?? "#9BFF3C";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#1F3B2C",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Cover image — right half */}
        {resolved?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolved.image_url}
            alt=""
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: "45%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.35,
            }}
          />
        )}

        {/* Gradient fade from left over image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, #1F3B2C 55%, rgba(31,59,44,0) 100%)",
          }}
        />

        {/* Accent bar left edge */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            background: accentColor,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            height: "100%",
            maxWidth: 700,
          }}
        >
          {/* Wordmark */}
          <div
            style={{
              fontFamily: "sans-serif",
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: "0.22em",
              color: "#F0EDEA",
              textTransform: "uppercase",
            }}
          >
            VAKANSISME
          </div>

          {/* Main */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {resolved?.type && (
              <div
                style={{
                  display: "inline-flex",
                  background: accentColor,
                  color: "#111111",
                  fontFamily: "sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "5px 12px",
                  alignSelf: "flex-start",
                }}
              >
                {resolved.type}
              </div>
            )}

            <div
              style={{
                fontFamily: "sans-serif",
                fontWeight: 900,
                fontSize: 72,
                color: "#F0EDEA",
                lineHeight: 0.9,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              {resolved?.title ?? "Story"}
            </div>

            {resolved?.excerpt && (
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontWeight: 400,
                  fontSize: 20,
                  color: "#8B7355",
                  lineHeight: 1.45,
                  maxWidth: 540,
                }}
              >
                {resolved.excerpt.length > 120
                  ? resolved.excerpt.slice(0, 120) + "…"
                  : resolved.excerpt}
              </div>
            )}
          </div>

          {/* Author */}
          {resolved?.author_handle && (
            <div
              style={{
                fontFamily: "sans-serif",
                fontWeight: 600,
                fontSize: 16,
                color: "#8B7355",
                letterSpacing: "0.06em",
              }}
            >
              @{resolved.author_handle}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
