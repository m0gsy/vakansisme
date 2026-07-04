import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = Promise<{ slug: string }>;

export default async function Image({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const column = UUID_RE.test(slug) ? "id" : "slug";
  const { data: trip } = await supabase
    .from("expeditions")
    .select("name, location, difficulty, date_start, image_url")
    .eq(column, slug)
    .maybeSingle();

  const dateStr = trip?.date_start
    ? new Date(trip.date_start).toLocaleDateString("en", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#111111",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background image */}
        {trip?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trip.image_url}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.25,
            }}
          />
        )}

        {/* Dark gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(17,17,17,0.95) 40%, rgba(17,17,17,0.6) 100%)",
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

          {/* Main content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {trip?.difficulty && (
              <div
                style={{
                  display: "inline-flex",
                  background: "#9BFF3C",
                  color: "#111111",
                  fontFamily: "sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "6px 14px",
                  alignSelf: "flex-start",
                }}
              >
                {trip.difficulty}
              </div>
            )}

            <div
              style={{
                fontFamily: "sans-serif",
                fontWeight: 900,
                fontSize: 88,
                color: "#F0EDEA",
                lineHeight: 0.88,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                maxWidth: 900,
              }}
            >
              {trip?.name ?? "Expedition"}
            </div>

            <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
              {trip?.location && (
                <div
                  style={{
                    fontFamily: "sans-serif",
                    fontWeight: 500,
                    fontSize: 22,
                    color: "#8B7355",
                  }}
                >
                  {trip.location}
                </div>
              )}
              {dateStr && (
                <div
                  style={{
                    fontFamily: "sans-serif",
                    fontWeight: 500,
                    fontSize: 22,
                    color: "#8B7355",
                  }}
                >
                  {dateStr}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
