import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Bookmarks — VAKANSISME" };

const FALLBACK = "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("expedition_id, created_at, expeditions(id, name, location, difficulty, date_start, image_url, status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "12px" }}>
          BOOKMARKS
        </h1>
        <p className="font-body text-muted-ink mb-12" style={{ fontSize: "0.88rem" }}>
          {bookmarks?.length ?? 0} saved expedition{bookmarks?.length !== 1 ? "s" : ""}.
        </p>

        {!bookmarks?.length && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p className="font-display font-black uppercase text-muted-ink" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", marginBottom: "16px" }}>NOTHING SAVED</p>
            <Link href="/expeditions" className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150" style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "12px 28px" }}>
              BROWSE EXPEDITIONS →
            </Link>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {(bookmarks ?? []).map((b) => {
            const exp = (Array.isArray(b.expeditions) ? b.expeditions[0] : b.expeditions) as { id: string; name: string; location: string; difficulty: string; date_start: string; image_url: string | null; status: string | null } | null;
            if (!exp) return null;
            return (
              <Link key={b.expedition_id} href={`/expeditions/${exp.id}`} className="group block">
                <article style={{ display: "flex", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", overflow: "hidden" }}>
                  <div className="relative flex-shrink-0" style={{ width: "100px" }}>
                    <Image src={exp.image_url ?? FALLBACK} alt={exp.name} fill sizes="100px" className="object-cover transition-transform duration-500 group-hover:scale-105" style={{ filter: "grayscale(20%) brightness(0.75)" }} />
                  </div>
                  <div style={{ flex: 1, padding: "16px 20px" }}>
                    <p className="font-body font-semibold text-neon-green uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: "6px" }}>{exp.difficulty}</p>
                    <h2 className="font-display font-black uppercase text-off-white group-hover:text-neon-green transition-colors duration-150" style={{ fontSize: "clamp(0.9rem, 2vw, 1.2rem)", letterSpacing: "-0.02em", lineHeight: 0.92, marginBottom: "6px" }}>{exp.name}</h2>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}>{exp.location}</p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", marginTop: "8px" }}>
                      {new Date(exp.date_start).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
