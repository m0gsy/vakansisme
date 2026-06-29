import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { DIFFICULTIES, difficultyLabel, getDifficulty } from "@/lib/difficulty";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export const metadata = { title: "Expeditions — VAKANSISME" };

const PAGE_SIZE = 9;
const FALLBACK = "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80";

type SearchParams = Promise<{ difficulty?: string; page?: string; status?: string }>;

function formatDate(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const mo = s.toLocaleString("en", { month: "short" });
  return `${s.getDate()}–${e.getDate()} ${mo} ${s.getFullYear()}`;
}

function StarRating({ avg, count }: { avg: number; count: number }) {
  const stars = Math.round(avg);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <span style={{ fontSize: "0.7rem", color: "#9BFF3C", letterSpacing: "-0.02em" }}>
        {"★".repeat(stars)}{"☆".repeat(5 - stars)}
      </span>
      <span className="font-body text-muted-ink" style={{ fontSize: "0.62rem" }}>
        {avg} ({count})
      </span>
    </div>
  );
}

export default async function ExpeditionsPage({ searchParams }: { searchParams: SearchParams }) {
  const { difficulty, page: pageStr, status } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const locale = await getLocale();

  let query = supabase
    .from("expeditions")
    .select("id, name, location, difficulty, price, date_start, date_end, quota_max, image_url, status, featured, expedition_members(count)", { count: "exact" })
    .order("featured", { ascending: false })
    .order("date_start", { ascending: true });

  if (difficulty) query = query.eq("difficulty", difficulty);
  if (status) query = query.eq("status", status);

  const { data: expeditions, count } = await query.range(from, to);

  // Avg ratings for cards on this page
  const ids = expeditions?.map((e) => e.id) ?? [];
  const { data: ratings } = ids.length
    ? await supabase.from("expedition_ratings").select("expedition_id, avg_rating, review_count").in("expedition_id", ids)
    : { data: [] };
  const ratingMap = new Map((ratings ?? []).map((r) => [r.expedition_id, r]));

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  function pillHref(d?: string, s?: string) {
    const p = new URLSearchParams();
    if (d) p.set("difficulty", d);
    if (s) p.set("status", s);
    return `/expeditions${p.size ? "?" + p.toString() : ""}`;
  }

  const STATUS_FILTERS = [
    { value: undefined, label: t(locale, "filter_all") },
    { value: "upcoming", label: t(locale, "filter_upcoming") },
    { value: "ongoing", label: t(locale, "filter_ongoing") },
    { value: "completed", label: t(locale, "filter_completed") },
  ];

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div style={{ marginBottom: "40px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(3rem, 8vw, 6rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}>
              {t(locale, "page_expeditions")}
            </h1>
            <p className="font-body text-muted-ink mt-3" style={{ fontSize: "0.9rem", maxWidth: "48ch" }}>
              {t(locale, "expedition_subtitle")}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "8px" }}>
            <Link
              href="/expeditions/propose"
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em", padding: "10px 20px", whiteSpace: "nowrap", textDecoration: "none" }}
            >
              + PROPOSE TRIP
            </Link>
            <Link
              href="/expeditions/calendar"
              className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-200"
              style={{ fontSize: "0.68rem", letterSpacing: "0.1em", whiteSpace: "nowrap" }}
            >
              ◫ {t(locale, "view_calendar")}
            </Link>
          </div>
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
          {STATUS_FILTERS.map((sf) => {
            const active = status === sf.value || (!status && !sf.value);
            return (
              <Link key={sf.label} href={pillHref(difficulty, sf.value)} className="font-body font-semibold transition-all duration-150"
                style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "5px 12px", border: "1px solid", background: active ? "#FF6B1A" : "transparent", color: active ? "#111111" : "#8B7355", borderColor: active ? "#FF6B1A" : "rgba(74,59,42,0.5)" }}>
                {sf.label}
              </Link>
            );
          })}
        </div>

        {/* Difficulty filter pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "48px" }}>
          <Link href={pillHref(undefined, status)} className="font-body font-semibold transition-all duration-150"
            style={{ fontSize: "0.66rem", letterSpacing: "0.1em", padding: "7px 14px", border: "1px solid", background: !difficulty ? "#9BFF3C" : "transparent", color: !difficulty ? "#111111" : "#8B7355", borderColor: !difficulty ? "#9BFF3C" : "rgba(74,59,42,0.5)" }}>
            {t(locale, "all_levels")}
          </Link>
          {DIFFICULTIES.map((d) => {
            const active = difficulty === d.value;
            return (
              <Link key={d.value} href={pillHref(d.value, status)} className="font-body font-semibold transition-all duration-150"
                title={d.desc}
                style={{ fontSize: "0.66rem", letterSpacing: "0.08em", padding: "7px 14px", border: "1px solid", background: active ? "#9BFF3C" : "transparent", color: active ? "#111111" : "#8B7355", borderColor: active ? "#9BFF3C" : "rgba(74,59,42,0.5)" }}>
                {d.label}
              </Link>
            );
          })}
        </div>

        {/* Grid */}
        {!expeditions?.length ? (
          <p className="font-story text-muted-ink" style={{ fontSize: "1rem" }}>
            {t(locale, "no_expeditions_yet")}
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {expeditions.map((e) => {
              const memberCount = (e.expedition_members as { count: number }[])[0]?.count ?? 0;
              const full = memberCount >= e.quota_max;
              const diff = getDifficulty(e.difficulty);
              const rating = ratingMap.get(e.id);
              return (
                <Link key={e.id} href={`/expeditions/${e.id}`} className="group block">
                  <article style={{ background: "#1F3B2C", border: "1px solid rgba(74,59,42,0.4)" }}>
                    <div className="relative overflow-hidden" style={{ height: "200px" }}>
                      <Image
                        src={e.image_url ?? FALLBACK} alt={e.name} fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ filter: "grayscale(15%)" }}
                      />
                      <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(31,59,44,0.7) 0%, transparent 50%)" }} />
                      {(e as { featured?: boolean }).featured && (
                        <div className="absolute top-3 right-3">
                          <span className="font-body font-semibold text-charcoal" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "3px 8px", background: "#9BFF3C" }}>★ FEATURED</span>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <span
                          className="font-body font-semibold text-charcoal bg-neon-green"
                          style={{ fontSize: "0.62rem", letterSpacing: "0.06em", padding: "3px 8px" }}
                          title={diff?.desc}
                        >
                          {difficultyLabel(e.difficulty)}
                        </span>
                        {e.status && (
                          <span className="font-body font-semibold" style={{ fontSize: "0.62rem", letterSpacing: "0.06em", padding: "3px 8px", background: e.status === "ongoing" ? "#FF6B1A" : e.status === "completed" ? "#4A3B2A" : "rgba(240,237,234,0.15)", color: "#F0EDEA" }}>
                            {(e.status as string).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <h2 className="font-display font-bold uppercase text-off-white leading-tight group-hover:text-neon-green transition-colors duration-150" style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.3rem)", letterSpacing: "-0.01em", marginBottom: "4px" }}>
                        {e.name}
                      </h2>
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem", marginBottom: "10px" }}>{e.location}</p>
                      {rating && rating.review_count > 0 && (
                        <div style={{ marginBottom: "12px" }}>
                          <StarRating avg={Number(rating.avg_rating)} count={rating.review_count} />
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(74,59,42,0.4)", paddingTop: "14px" }}>
                        <div>
                          <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}>{formatDate(e.date_start, e.date_end)}</p>
                          <p className="font-body font-semibold text-off-white" style={{ fontSize: "0.9rem", marginTop: "2px" }}>{e.price}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}>{t(locale, "quota")}</p>
                          <p className="font-body font-semibold" style={{ fontSize: "0.9rem", marginTop: "2px", color: full ? "#FF6B1A" : "#9BFF3C" }}>
                            {full ? t(locale, "full") : `${memberCount} / ${e.quota_max}`}
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
              <Link href={`/expeditions?${difficulty ? `difficulty=${encodeURIComponent(difficulty)}&` : ""}${status ? `status=${status}&` : ""}page=${page - 1}`}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 16px", border: "1px solid rgba(74,59,42,0.4)" }}>
                ← PREV
              </Link>
            )}
            <span className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.1em", padding: "8px 12px" }}>
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`/expeditions?${difficulty ? `difficulty=${encodeURIComponent(difficulty)}&` : ""}${status ? `status=${status}&` : ""}page=${page + 1}`}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 16px", border: "1px solid rgba(74,59,42,0.4)" }}>
                NEXT →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
