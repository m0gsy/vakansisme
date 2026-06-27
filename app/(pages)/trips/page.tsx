import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "My Trips — VAKANSISME" };

const FALLBACK = "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80";

export default async function MyTripsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("expedition_members")
    .select("expedition_id, joined_at, expeditions(id, name, location, difficulty, date_start, date_end, image_url, status)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const now = new Date();
  const upcoming: typeof memberships = [];
  const past: typeof memberships = [];

  for (const m of memberships ?? []) {
    const exp = Array.isArray(m.expeditions) ? m.expeditions[0] : m.expeditions as { date_end: string } | null;
    if (!exp) continue;
    if (new Date(exp.date_end) >= now) upcoming.push(m);
    else past.push(m);
  }

  function ExpCard({ m }: { m: NonNullable<typeof memberships>[number] }) {
    const exp = (Array.isArray(m.expeditions) ? m.expeditions[0] : m.expeditions) as {
      id: string; name: string; location: string; difficulty: string;
      date_start: string; date_end: string; image_url: string | null; status: string | null;
    } | null;
    if (!exp) return null;
    const dateStr = new Date(exp.date_start).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
    const dateEndStr = new Date(exp.date_end).toLocaleDateString("en", { day: "numeric", month: "short" });
    const statusColors: Record<string, string> = { upcoming: "#9BFF3C", ongoing: "#FF6B1A", completed: "#8B7355", cancelled: "#7A2E12" };
    const statusColor = statusColors[exp.status ?? "upcoming"] ?? "#8B7355";
    return (
      <Link href={`/expeditions/${exp.id}`} className="group block">
        <article
          style={{
            display: "flex",
            gap: "0",
            background: "#1a1a1a",
            border: "1px solid rgba(74,59,42,0.35)",
            overflow: "hidden",
          }}
        >
          <div className="relative flex-shrink-0" style={{ width: "120px" }}>
            <Image
              src={exp.image_url ?? FALLBACK}
              alt={exp.name}
              fill
              sizes="120px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ filter: "grayscale(20%) brightness(0.75)" }}
            />
          </div>
          <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span
                  className="font-body font-semibold uppercase"
                  style={{ fontSize: "0.58rem", letterSpacing: "0.12em", color: statusColor }}
                >
                  {exp.status ?? "upcoming"}
                </span>
                <span className="font-body text-muted-ink" style={{ fontSize: "0.62rem" }}>·</span>
                <span className="font-body text-muted-ink" style={{ fontSize: "0.62rem" }}>{exp.difficulty}</span>
              </div>
              <h2
                className="font-display font-black uppercase text-off-white group-hover:text-neon-green transition-colors duration-150"
                style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", lineHeight: 0.92, marginBottom: "8px" }}
              >
                {exp.name}
              </h2>
              <p className="font-body text-muted-ink" style={{ fontSize: "0.75rem" }}>{exp.location}</p>
            </div>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.7rem", marginTop: "12px" }}>
              {dateStr} – {dateEndStr}
            </p>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-3xl mx-auto px-6">
        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "12px" }}
        >
          MY TRIPS
        </h1>
        <p className="font-body text-muted-ink mb-12" style={{ fontSize: "0.88rem" }}>
          {(memberships?.length ?? 0)} expedition{memberships?.length !== 1 ? "s" : ""} total.
        </p>

        {!memberships?.length && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p className="font-display font-black uppercase text-muted-ink" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              NO TRIPS YET
            </p>
            <Link
              href="/expeditions"
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
              style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "12px 28px" }}
            >
              FIND AN EXPEDITION →
            </Link>
          </div>
        )}

        {!!upcoming.length && (
          <section style={{ marginBottom: "56px" }}>
            <h2
              className="font-display font-black uppercase"
              style={{ fontSize: "1rem", letterSpacing: "0.08em", color: "#9BFF3C", marginBottom: "20px" }}
            >
              UPCOMING & ONGOING ({upcoming.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {upcoming.map((m) => <ExpCard key={m.expedition_id} m={m} />)}
            </div>
          </section>
        )}

        {!!past.length && (
          <section>
            <h2
              className="font-display font-black uppercase"
              style={{ fontSize: "1rem", letterSpacing: "0.08em", color: "#8B7355", marginBottom: "20px" }}
            >
              PAST TRIPS ({past.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {past.map((m) => <ExpCard key={m.expedition_id} m={m} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
