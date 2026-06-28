import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Story Series — VAKANSISME" };

export default async function SeriesPage() {
  const supabase = await createClient();
  const locale = await getLocale();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: seriesList } = await supabase
    .from("story_series")
    .select("id, title, description, cover_image, created_at, author_id, profiles(username)")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "48px" }}>
          <div>
            <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.62rem", letterSpacing: "0.16em", marginBottom: "8px" }}>
              {t(locale, "series")}
            </p>
            <h1
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
            >
              KOLEKSI CERITA
            </h1>
          </div>
          {user && (
            <Link
              href="/series/new"
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
              style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "11px 22px" }}
            >
              + BUAT SERI
            </Link>
          )}
        </div>

        {!seriesList?.length ? (
          <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>
            Belum ada seri cerita.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2px" }}>
            {seriesList.map((s) => {
              const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles as { username: string } | null;
              return (
                <Link
                  key={s.id}
                  href={`/series/${s.id}`}
                  className="group"
                  style={{ display: "block", background: "#141414", border: "1px solid rgba(74,59,42,0.25)", overflow: "hidden" }}
                >
                  {s.cover_image ? (
                    <div style={{ position: "relative", height: "180px" }}>
                      <Image
                        src={s.cover_image}
                        alt={s.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                        style={{ filter: "brightness(0.7) grayscale(10%)", transition: "filter 0.3s" }}
                      />
                    </div>
                  ) : (
                    <div style={{ height: "180px", background: "repeating-linear-gradient(135deg, #1a1a1a 0px, #1a1a1a 20px, #111 20px, #111 40px)" }} />
                  )}
                  <div style={{ padding: "20px 22px" }}>
                    <h2
                      className="font-display font-black uppercase text-off-white group-hover:text-neon-green transition-colors duration-200"
                      style={{ fontSize: "1.1rem", letterSpacing: "-0.015em", lineHeight: 1.1, marginBottom: "8px" }}
                    >
                      {s.title}
                    </h2>
                    {s.description && (
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.8rem", lineHeight: 1.6, marginBottom: "12px" }}>
                        {s.description}
                      </p>
                    )}
                    {profile && (
                      <p className="font-body font-semibold text-muted-ink" style={{ fontSize: "0.62rem", letterSpacing: "0.08em" }}>
                        @{profile.username}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
