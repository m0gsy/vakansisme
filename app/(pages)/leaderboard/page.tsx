import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vakansisme.club";

export const metadata = {
  title: "Leaderboard — Top Pendaki & Penulis | Vakansisme",
  description: "Ranking pendaki dan penulis paling aktif di komunitas Vakansisme. Siapa yang paling banyak ekspedisi dan stories?",
  alternates: { canonical: `${SITE_URL}/leaderboard` },
  openGraph: { title: "Leaderboard — Vakansisme", description: "Top pendaki dan penulis aktif komunitas outdoor Indonesia.", url: `${SITE_URL}/leaderboard`, type: "website" as const },
  twitter: { card: "summary" as const, title: "Leaderboard — Vakansisme" },
};

function Board({ title, rows, unit }: { title: string; rows: { username: string; avatar_url: string | null; count: number }[]; unit: string }) {
  return (
    <div style={{ flex: "1 1 320px" }}>
      <h2
        className="font-display font-black uppercase text-off-white"
        style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", letterSpacing: "-0.02em", marginBottom: "24px" }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {!rows.length && (
          <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>No data yet.</p>
        )}
        {rows.map((r, i) => (
          <Link key={r.username} href={`/u/${r.username}`} className="group">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "12px 16px",
                background: i === 0 ? "rgba(155,255,60,0.06)" : "#1a1a1a",
                border: "1px solid",
                borderColor: i === 0 ? "rgba(155,255,60,0.2)" : "rgba(74,59,42,0.25)",
              }}
            >
              <span
                className="font-display font-black"
                style={{ fontSize: "1.2rem", color: i === 0 ? "#9BFF3C" : i === 1 ? "#8B7355" : "#4A3B2A", width: "28px", flexShrink: 0 }}
              >
                {i + 1}
              </span>
              <div className="relative flex-shrink-0" style={{ width: "32px", height: "32px", overflow: "hidden", background: "#111" }}>
                {r.avatar_url ? (
                  <Image src={r.avatar_url} alt={r.username} fill className="object-cover" sizes="32px" />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="font-display font-black text-neon-green" style={{ fontSize: "0.9rem" }}>{r.username[0].toUpperCase()}</span>
                  </div>
                )}
              </div>
              <span
                className="font-body font-semibold text-off-white group-hover:text-neon-green transition-colors duration-150 flex-1"
                style={{ fontSize: "0.85rem" }}
              >
                @{r.username}
              </span>
              <span className="font-body text-muted-ink" style={{ fontSize: "0.75rem" }}>
                {r.count} {unit}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const [{ data: tripLeaders }, { data: storyLeaders }] = await Promise.all([
    supabase.from("leaderboard_trips").select("user_id, trip_count, username, avatar_url"),
    supabase.from("leaderboard_stories").select("user_id, story_count, username, avatar_url"),
  ]);

  const topByTrips = (tripLeaders ?? []).map((r) => ({
    username: r.username as string,
    avatar_url: r.avatar_url as string | null,
    count: r.trip_count as number,
  }));

  const topByStories = (storyLeaders ?? []).map((r) => ({
    username: r.username as string,
    avatar_url: r.avatar_url as string | null,
    count: r.story_count as number,
  }));

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Leaderboard — Top Pendaki & Penulis | Vakansisme",
    url: `${SITE_URL}/leaderboard`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />
      <div className="max-w-5xl mx-auto px-6">
        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(3rem, 8vw, 6rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "12px" }}
        >
          LEADERBOARD
        </h1>
        <p className="font-body text-muted-ink mb-16" style={{ fontSize: "0.9rem" }}>
          Most active crew on the platform.
        </p>
        <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
          <Board title="MOST TRIPS" rows={topByTrips} unit="trips" />
          <Board title="MOST STORIES" rows={topByStories} unit="stories" />
        </div>
      </div>
    </div>
  );
}
