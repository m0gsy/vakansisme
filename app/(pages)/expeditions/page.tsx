import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { DIFFICULTIES, difficultyLabel } from "@/lib/difficulty";

export const metadata = { title: "Expeditions — VAKANSISME" };

const PAGE_SIZE = 9;
const FALLBACK = "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80";

type SearchParams = Promise<{ difficulty?: string; page?: string }>;

function formatDate(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const mo = s.toLocaleString("en", { month: "short" });
  return `${s.getDate()}–${e.getDate()} ${mo} ${s.getFullYear()}`;
}

export default async function ExpeditionsPage({ searchParams }: { searchParams: SearchParams }) {
  const { difficulty, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("expeditions")
    .select("id, name, location, difficulty, price, date_start, date_end, quota_max, image_url, expedition_members(count)", { count: "exact" })
    .order("date_start", { ascending: true });

  if (difficulty) query = query.eq("difficulty", difficulty);

  const { data: expeditions, count } = await query.range(from, to);
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const pillHref = (d?: string) => (d ? `/expeditions?difficulty=${encodeURIComponent(d)}` : "/expeditions");

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(3rem, 8vw, 6rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
          >
            EXPEDITIONS
          </h1>
          <p className="font-body text-muted-ink mt-3" style={{ fontSize: "0.9rem", maxWidth: "48ch" }}>
            Organized escapes with a controlled dose of chaos. Pick your level.
          </p>
        </div>

        {/* Difficulty filter pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "48px" }}>
          <Link
            href={pillHref()}
            className="font-body font-semibold transition-all duration-150"
            style={{
              fontSize: "0.66rem",
              letterSpacing: "0.1em",
              padding: "7px 14px",
              border: "1px solid",
              background: !difficulty ? "#9BFF3C" : "transparent",
              color: !difficulty ? "#111111" : "#8B7355",
              borderColor: !difficulty ? "#9BFF3C" : "rgba(74,59,42,0.5)",
            }}
          >
            ALL
          </Link>
          {DIFFICULTIES.map((d) => {
            const active = difficulty === d.value;
            return (
              <Link
                key={d.value}
                href={pillHref(d.value)}
                className="font-body font-semibold transition-all duration-150"
                style={{
                  fontSize: "0.66rem",
                  letterSpacing: "0.08em",
                  padding: "7px 14px",
                  border: "1px solid",
                  background: active ? "#9BFF3C" : "transparent",
                  color: active ? "#111111" : "#8B7355",
                  borderColor: active ? "#9BFF3C" : "rgba(74,59,42,0.5)",
                }}
              >
                {d.label}
              </Link>
            );
          })}
        </div>

        {/* Grid */}
        {!expeditions?.length ? (
          <p className="font-story text-muted-ink" style={{ fontSize: "1rem" }}>
            No expeditions{difficulty ? ` at ${difficultyLabel(difficulty)} level` : ""} yet.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {expeditions.map((e) => {
              const count = (e.expedition_members as { count: number }[])[0]?.count ?? 0;
              const full = count >= e.quota_max;
              return (
                <Link key={e.id} href={`/expeditions/${e.id}`} className="group block">
                  <article style={{ background: "#1F3B2C", border: "1px solid rgba(74,59,42,0.4)" }}>
                    <div className="relative overflow-hidden" style={{ height: "200px" }}>
                      <Image
                        src={e.image_url ?? FALLBACK}
                        alt={e.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ filter: "grayscale(15%)" }}
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to top, rgba(31,59,44,0.7) 0%, transparent 50%)" }}
                      />
                      <div className="absolute bottom-3 left-3">
                        <span
                          className="font-body font-semibold text-charcoal bg-neon-green"
                          style={{ fontSize: "0.62rem", letterSpacing: "0.06em", padding: "3px 8px" }}
                        >
                          {difficultyLabel(e.difficulty)}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h2
                        className="font-display font-bold uppercase text-off-white leading-tight group-hover:text-neon-green transition-colors duration-150"
                        style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.3rem)", letterSpacing: "-0.01em", marginBottom: "6px" }}
                      >
                        {e.name}
                      </h2>
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem", marginBottom: "18px" }}>
                        {e.location}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          borderTop: "1px solid rgba(74,59,42,0.4)",
                          paddingTop: "14px",
                        }}
                      >
                        <div>
                          <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}>
                            {formatDate(e.date_start, e.date_end)}
                          </p>
                          <p className="font-body font-semibold text-off-white" style={{ fontSize: "0.9rem", marginTop: "2px" }}>
                            {e.price}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}>
                            QUOTA
                          </p>
                          <p
                            className="font-body font-semibold"
                            style={{ fontSize: "0.9rem", marginTop: "2px", color: full ? "#FF6B1A" : "#9BFF3C" }}
                          >
                            {full ? "FULL" : `${count} / ${e.quota_max}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "56px", alignItems: "center" }}>
            {page > 1 && (
              <Link
                href={`/expeditions?${difficulty ? `difficulty=${encodeURIComponent(difficulty)}&` : ""}page=${page - 1}`}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 16px", border: "1px solid rgba(74,59,42,0.4)" }}
              >
                ← PREV
              </Link>
            )}
            <span className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.1em", padding: "8px 12px" }}>
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/expeditions?${difficulty ? `difficulty=${encodeURIComponent(difficulty)}&` : ""}page=${page + 1}`}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 16px", border: "1px solid rgba(74,59,42,0.4)" }}
              >
                NEXT →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
