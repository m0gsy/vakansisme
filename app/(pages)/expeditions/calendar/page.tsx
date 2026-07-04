import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Expedition Calendar — VAKANSISME" };

type SearchParams = Promise<{ year?: string; month?: string }>;

const MONTH_NAMES_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const STATUS_COLOR: Record<string, string> = {
  upcoming: "#9BFF3C",
  ongoing: "#FF6B1A",
  completed: "#4A3B2A",
};

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const now = new Date();
  const year = parseInt(sp.year ?? String(now.getFullYear()), 10);
  const month = parseInt(sp.month ?? String(now.getMonth() + 1), 10) - 1; // 0-indexed

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const supabase = await createClient();
  const { data: expeditions } = await supabase
    .from("expeditions")
    .select("id, slug, name, date_start, date_end, status, location")
    .gte("date_start", firstDay.toISOString().slice(0, 10))
    .lte("date_start", lastDay.toISOString().slice(0, 10))
    .order("date_start", { ascending: true });

  // Group expeditions by day-of-month
  const byDay = new Map<number, typeof expeditions>();
  for (const exp of expeditions ?? []) {
    const d = new Date(exp.date_start).getUTCDate();
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(exp);
  }

  // Build calendar grid (pad start + end)
  const startPad = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();
  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = month === 0 ? { year: year - 1, month: 12 } : { year, month };
  const nextMonth = month === 11 ? { year: year + 1, month: 1 } : { year, month: month + 2 };
  const monthNames = locale === "id" ? MONTH_NAMES_ID : MONTH_NAMES_EN;
  const todayDay = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null;

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.62rem", letterSpacing: "0.16em", marginBottom: "8px" }}>
            {t(locale, "calendar")}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
            <h1
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(2rem, 6vw, 4rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
            >
              {monthNames[month]} {year}
            </h1>
            <div style={{ display: "flex", gap: "4px" }}>
              <Link
                href={`/expeditions/calendar?year=${prevMonth.year}&month=${prevMonth.month}`}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                style={{ fontSize: "0.68rem", letterSpacing: "0.1em", padding: "7px 14px", border: "1px solid rgba(74,59,42,0.4)", background: "transparent" }}
              >
                ←
              </Link>
              <Link
                href={`/expeditions/calendar?year=${nextMonth.year}&month=${nextMonth.month}`}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                style={{ fontSize: "0.68rem", letterSpacing: "0.1em", padding: "7px 14px", border: "1px solid rgba(74,59,42,0.4)", background: "transparent" }}
              >
                →
              </Link>
              <Link
                href={`/expeditions/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`}
                className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-150"
                style={{ fontSize: "0.62rem", letterSpacing: "0.1em", padding: "7px 14px", border: "1px solid rgba(74,59,42,0.4)", background: "transparent" }}
              >
                HARI INI
              </Link>
            </div>
          </div>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "2px" }}>
          {DAY_NAMES.map((d) => (
            <div key={d} style={{ padding: "8px 10px" }}>
              <span className="font-body font-semibold text-muted-ink" style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {cells.map((day, idx) => {
            const exps = day ? (byDay.get(day) ?? []) : [];
            const isToday = day === todayDay;
            return (
              <div
                key={idx}
                style={{
                  minHeight: "96px",
                  background: day ? "#141414" : "transparent",
                  border: day ? `1px solid ${isToday ? "rgba(155,255,60,0.4)" : "rgba(74,59,42,0.25)"}` : "none",
                  padding: day ? "8px" : "0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                }}
              >
                {day && (
                  <>
                    <span
                      className="font-body font-semibold"
                      style={{
                        fontSize: "0.7rem",
                        letterSpacing: "0.04em",
                        color: isToday ? "#9BFF3C" : "#4A3B2A",
                        marginBottom: "4px",
                      }}
                    >
                      {day}
                    </span>
                    {exps.map((exp) => (
                      <Link
                        key={exp.id}
                        href={`/expeditions/${exp.slug}`}
                        style={{
                          display: "block",
                          background: STATUS_COLOR[exp.status ?? "upcoming"] ?? "#9BFF3C",
                          padding: "2px 5px",
                          overflow: "hidden",
                        }}
                        title={`${exp.name} — ${exp.location}`}
                      >
                        <span
                          className="font-body font-semibold"
                          style={{
                            fontSize: "0.56rem",
                            letterSpacing: "0.04em",
                            color: exp.status === "upcoming" ? "#111111" : "#F0EDEA",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "block",
                          }}
                        >
                          {exp.name}
                        </span>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop: "28px", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
          {[
            { status: "upcoming", label: locale === "id" ? "Akan Datang" : "Upcoming" },
            { status: "ongoing", label: locale === "id" ? "Sedang Berjalan" : "Ongoing" },
            { status: "completed", label: locale === "id" ? "Selesai" : "Completed" },
          ].map(({ status, label }) => (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "10px", height: "10px", background: STATUS_COLOR[status] }} />
              <span className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.06em" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* List below calendar */}
        {expeditions && expeditions.length > 0 && (
          <div style={{ marginTop: "48px", paddingTop: "32px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
            <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.62rem", letterSpacing: "0.14em", marginBottom: "16px" }}>
              {expeditions.length} {locale === "id" ? "ekspedisi bulan ini" : "expeditions this month"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {expeditions.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/expeditions/${exp.slug}`}
                  className="group"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#141414", border: "1px solid rgba(74,59,42,0.25)" }}
                >
                  <div>
                    <p className="font-display font-bold uppercase text-off-white group-hover:text-neon-green transition-colors duration-150" style={{ fontSize: "0.9rem", letterSpacing: "-0.01em" }}>
                      {exp.name}
                    </p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.7rem", marginTop: "2px" }}>{exp.location}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ width: "8px", height: "8px", background: STATUS_COLOR[exp.status ?? "upcoming"], marginLeft: "auto", marginBottom: "4px" }} />
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem" }}>
                      {new Date(exp.date_start).toLocaleDateString(locale === "id" ? "id-ID" : "en", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
