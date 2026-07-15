import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resolveSlugOrRedirect } from "@/lib/resolve";
import { absoluteUrl } from "@/lib/seo";
import { kindLabel } from "@/lib/related";

// Kinds are admin-defined (destination_kinds table) — not a fixed union anymore.
// The 3 original kinds keep dedicated routes/behavior below; any other kind renders
// generically via the /destination/[slug] route.
export type DestKind = string;

type DestinationMetadata = {
  water_sources?: string[];
  camps?: string[];
  basecamps?: string[];
  simaksi_link?: string | null;
  pvmbg_status?: string;
  best_season?: string;
  difficulty?: string;
  flora_fauna?: string[];
  emergency_contacts?: string[];
  latitude?: number;
  longitude?: number;
};

type Destination = {
  id: string;
  kind: DestKind;
  name: string;
  slug: string;
  parent_id: string | null;
  location_id: string | null;
  elevation_m: number | null;
  description: string | null;
  image_url: string | null;
  metadata?: DestinationMetadata | null;
};

type ExpeditionRow = {
  id: string;
  slug: string;
  name: string;
  location: string;
  difficulty: string;
  price: string;
  date_start: string;
  date_end: string;
  image_url: string | null;
};

type StoryRow = {
  id: string;
  slug: string;
  title: string;
  type: string;
  image_url: string | null;
  author_handle: string;
};

type RelatedDest = { id: string; name: string; slug: string };
type LocationRow = { id: string; name: string; slug: string; type: "province" | "city"; parent_id: string | null };

const FALLBACK = "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80";

// ponytail: cache()-wrapped with positional args so React dedupes by value
// (object literals always fail cache dedup). generateMetadata and the page body
// call with the same values and share one fetch per request.
export const getDestinationData = cache(
  async (kind: DestKind | null, param: string, basePath: string) => {
    const supabase = await createClient();

    const dest = await resolveSlugOrRedirect<Destination>({
      supabase,
      table: "destinations",
      entityType: "destination",
      param,
      basePath,
      select: "id, kind, name, slug, parent_id, location_id, elevation_m, description, image_url, metadata",
      filter: kind ? [{ column: "kind", value: kind }] : [],
    });

    const [{ data: expeditions }, { data: stories }, parentMountain, childTrails, locationChain] =
      await Promise.all([
        supabase
          .from("expeditions")
          .select("id, slug, name, location, difficulty, price, date_start, date_end, image_url")
          .eq("destination_id", dest.id)
          .order("date_start", { ascending: true })
          .limit(12),
        supabase
          .from("stories")
          .select("id, slug, title, type, image_url, author_handle")
          .eq("destination_id", dest.id)
          .eq("published", true)
          .limit(12),
        dest.kind === "trail" && dest.parent_id
          ? supabase
              .from("destinations")
              .select("id, name, slug")
              .eq("id", dest.parent_id)
              .maybeSingle()
              .then((r) => (r.data as RelatedDest | null))
          : Promise.resolve(null as RelatedDest | null),
        dest.kind === "mountain"
          ? supabase
              .from("destinations")
              .select("id, name, slug")
              .eq("parent_id", dest.id)
              .eq("kind", "trail")
              .order("name", { ascending: true })
              .then((r) => (r.data ?? []) as RelatedDest[])
          : Promise.resolve([] as RelatedDest[]),
        dest.location_id
          ? supabase
              .from("locations")
              .select("id, name, slug, type, parent_id")
              .eq("id", dest.location_id)
              .maybeSingle()
              .then(async (r) => {
                const loc = r.data as LocationRow | null;
                if (!loc) return { location: null, province: null };
                if (loc.type === "province") return { location: null, province: loc };
                if (loc.parent_id) {
                  const { data: prov } = await supabase
                    .from("locations")
                    .select("id, name, slug, type, parent_id")
                    .eq("id", loc.parent_id)
                    .maybeSingle();
                  return { location: loc, province: prov as LocationRow | null };
                }
                return { location: loc, province: null };
              })
          : Promise.resolve({ location: null as LocationRow | null, province: null as LocationRow | null }),
      ]);

    const hasContent = !!dest.description || (expeditions?.length ?? 0) + (stories?.length ?? 0) > 0;

    return {
      dest,
      expeditions: (expeditions ?? []) as ExpeditionRow[],
      stories: (stories ?? []) as StoryRow[],
      parentMountain,
      childTrails,
      location: locationChain.location,
      province: locationChain.province,
      hasContent,
    };
  }
);

function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const mo = s.toLocaleString("en", { month: "short" });
  return `${s.getDate()}–${e.getDate()} ${mo} ${s.getFullYear()}`;
}

export default async function DestinationPage({
  kind,
  basePath,
  param,
}: {
  kind: DestKind | null;
  basePath: string;
  param: string;
}) {
  const { dest, expeditions, stories, parentMountain, childTrails, location, province, hasContent } =
    await getDestinationData(kind, param, basePath);

  const crumbs: { name: string; href?: string }[] = [{ name: "EXPLORE", href: "/explore" }];
  if (province) crumbs.push({ name: province.name, href: `/location/${province.slug}` });
  if (location) crumbs.push({ name: location.name, href: `/location/${location.slug}` });
  if (parentMountain) crumbs.push({ name: parentMountain.name, href: `/mountain/${parentMountain.slug}` });
  crumbs.push({ name: dest.name });

  const url = absoluteUrl(`${basePath}/${dest.slug}`);

  const placeLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: dest.name,
    url,
    ...(dest.description ? { description: dest.description } : {}),
    ...(dest.elevation_m
      ? {
          additionalProperty: {
            "@type": "PropertyValue",
            name: "Elevation",
            value: dest.elevation_m,
            unitCode: "MTR",
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.href ? absoluteUrl(c.href) : url,
    })),
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {dest.image_url && (
        <div className="relative w-full" style={{ height: "clamp(260px, 45vw, 520px)" }}>
          <Image
            src={dest.image_url}
            alt={dest.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ filter: "grayscale(15%) brightness(0.7)" }}
          />
          <div
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, #111111 100%)" }}
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6" style={{ paddingTop: dest.image_url ? "40px" : "120px", paddingBottom: "80px" }}>
        {/* Breadcrumb */}
        <nav
          className="font-body font-semibold text-muted-ink"
          style={{ fontSize: "0.7rem", letterSpacing: "0.08em", marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "6px" }}
        >
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {c.href ? (
                <Link href={c.href} className="hover:text-off-white transition-colors duration-150">
                  {c.name}
                </Link>
              ) : (
                <span className="text-off-white">{c.name}</span>
              )}
              {i < crumbs.length - 1 && <span>→</span>}
            </span>
          ))}
        </nav>

        {/* Badges */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span
            className="font-body font-semibold text-charcoal bg-neon-green"
            style={{ fontSize: "0.62rem", letterSpacing: "0.08em", padding: "4px 10px" }}
          >
            {kindLabel(dest.kind)}
          </span>
          {!!dest.elevation_m && (
            <span
              className="font-body font-semibold"
              style={{ fontSize: "0.62rem", letterSpacing: "0.08em", padding: "4px 10px", background: "#1a1a1a", color: "#F0EDEA", border: "1px solid rgba(74,59,42,0.4)" }}
            >
              {dest.elevation_m.toLocaleString("en")} MDPL
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(2rem, 6vw, 4rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "20px", textWrap: "balance" }}
        >
          {dest.name}
        </h1>

        {dest.description ? (
          <p className="font-story text-off-white/80" style={{ fontSize: "1rem", lineHeight: 1.7, maxWidth: "70ch", marginBottom: "32px" }}>
            {dest.description}
          </p>
        ) : (
          <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "32px" }}>
            No description yet.
          </p>
        )}

        {/* Mountain Details Grid */}
        {dest.metadata && (
          <section
            style={{
              marginBottom: "56px",
              padding: "28px",
              background: "rgba(20,20,20,0.4)",
              border: "1px solid rgba(155,255,60,0.08)",
              borderRadius: "16px",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              gap: "32px",
            }}
          >
            {/* Header: Alert & SIMAKSI Booking */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                borderBottom: "1px solid rgba(74,59,42,0.25)",
                paddingBottom: "20px",
              }}
            >
              <div>
                <p className="font-body text-muted-ink" style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px" }}>
                  Status Keaktifan & Perizinan
                </p>
                {dest.metadata.pvmbg_status && (
                  <h3
                    className="font-display font-black"
                    style={{
                      fontSize: "1.2rem",
                      color: dest.metadata.pvmbg_status.includes("Level I") ? "#9BFF3C" : "#FF6B1A",
                      letterSpacing: "-0.01em",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>🌋</span> {dest.metadata.pvmbg_status.toUpperCase()}
                  </h3>
                )}
              </div>
              {dest.metadata.simaksi_link && (
                <a
                  href={dest.metadata.simaksi_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange hover:text-off-white transition-all duration-200"
                  style={{
                    fontSize: "0.75rem",
                    letterSpacing: "0.1em",
                    padding: "12px 24px",
                    borderRadius: "4px",
                    textDecoration: "none",
                    boxShadow: "0 0 15px rgba(155,255,60,0.2)",
                  }}
                >
                  REGISTRASI SIMAKSI ONLINE ↗
                </a>
              )}
            </div>

            {/* Core Specs Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {dest.elevation_m && (
                <div style={{ background: "rgba(31,59,44,0.15)", border: "1px solid rgba(74,59,42,0.3)", borderRadius: "8px", padding: "18px 24px" }}>
                  <span style={{ fontSize: "1.2rem" }}>🏔️</span>
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "8px", marginBottom: "2px" }}>KETINGGIAN</p>
                  <p className="font-display font-black text-neon-green" style={{ fontSize: "1.6rem", lineHeight: 1 }}>{dest.elevation_m.toLocaleString("en")} <span style={{ fontSize: "0.8rem", color: "#F0EDEA" }}>MDPL</span></p>
                </div>
              )}
              {dest.metadata.difficulty && (
                <div style={{ background: "rgba(31,59,44,0.15)", border: "1px solid rgba(74,59,42,0.3)", borderRadius: "8px", padding: "18px 24px" }}>
                  <span style={{ fontSize: "1.2rem" }}>🧗</span>
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "8px", marginBottom: "2px" }}>TINGKAT KESULITAN</p>
                  <p className="font-display font-black text-off-white" style={{ fontSize: "1.6rem", lineHeight: 1 }}>{dest.metadata.difficulty.toUpperCase()}</p>
                </div>
              )}
              {dest.metadata.best_season && (
                <div style={{ background: "rgba(31,59,44,0.15)", border: "1px solid rgba(74,59,42,0.3)", borderRadius: "8px", padding: "18px 24px" }}>
                  <span style={{ fontSize: "1.2rem" }}>☀️</span>
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "8px", marginBottom: "2px" }}>WAKTU TERBAIK</p>
                  <p className="font-display font-black text-off-white" style={{ fontSize: "1.6rem", lineHeight: 1 }}>{dest.metadata.best_season.toUpperCase()}</p>
                </div>
              )}
            </div>

            {/* Path & Camp Timeline Section */}
            {dest.metadata.camps && dest.metadata.camps.length > 0 ? (
              <div style={{ background: "rgba(10,10,10,0.3)", border: "1px solid rgba(74,59,42,0.2)", borderRadius: "10px", padding: "24px" }}>
                <p className="font-body text-muted-ink" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "20px" }}>
                  ⛺ JALUR PENDAKIAN & ESTIMASI POS CAMP
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0px", position: "relative" }}>
                  {dest.metadata.camps.map((c, i) => {
                    const isLast = i === dest.metadata!.camps!.length - 1;
                    const hasWater = dest.metadata!.water_sources?.some(w => c.toLowerCase().includes(w.toLowerCase()) || w.toLowerCase().includes(c.toLowerCase())) || c.toLowerCase().includes("air") || c.toLowerCase().includes("spring");
                    return (
                      <div key={i} style={{ display: "flex", gap: "20px", alignItems: "flex-start", position: "relative" }}>
                        {/* Dot & Line Connector */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "16px" }}>
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              background: isLast ? "#9BFF3C" : "transparent",
                              border: `2px solid ${isLast ? "#9BFF3C" : "rgba(155,255,60,0.5)"}`,
                              boxShadow: isLast ? "0 0 10px #9BFF3C" : "none",
                              zIndex: 2,
                              marginTop: "4px",
                            }}
                          />
                          {!isLast && (
                            <div
                              style={{
                                width: "2px",
                                height: "40px",
                                background: "linear-gradient(to bottom, rgba(155,255,60,0.5), rgba(155,255,60,0.15))",
                                zIndex: 1,
                                }}
                            />
                          )}
                        </div>
                        {/* Camp Text & Details */}
                        <div style={{ paddingBottom: isLast ? "0px" : "24px", marginTop: "1px" }}>
                          <span className="font-display font-bold text-off-white" style={{ fontSize: "0.9rem" }}>
                            {c}
                          </span>
                          {hasWater && (
                            <span
                              className="font-body font-semibold"
                              style={{
                                marginLeft: "10px",
                                fontSize: "0.6rem",
                                color: "#9BFF3C",
                                background: "rgba(155,255,60,0.08)",
                                border: "1px solid rgba(155,255,60,0.2)",
                                padding: "2px 6px",
                                borderRadius: "3px",
                              }}
                            >
                              💧 SUMBER AIR BERSIH
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ background: "rgba(10,10,10,0.2)", border: "1px dashed rgba(74,59,42,0.25)", borderRadius: "10px", padding: "32px 24px", textAlign: "center" }}>
                <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem", margin: 0 }}>
                  📍 Detail pos jalur pendakian belum tersedia untuk gunung ini.
                </p>
              </div>
            )}

            {/* Basecamps, Flora & Emergency details split */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {/* Basecamp list */}
              {dest.metadata.basecamps && dest.metadata.basecamps.length > 0 && (
                <div style={{ background: "rgba(20,20,20,0.3)", border: "1px solid rgba(74,59,42,0.2)", borderRadius: "8px", padding: "20px" }}>
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>📍 JALUR BASECAMP REGISTRASI</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {dest.metadata.basecamps.map((b, i) => (
                      <span key={i} className="font-body font-semibold text-off-white" style={{ fontSize: "0.72rem", background: "rgba(31,59,44,0.1)", border: "1px solid rgba(74,59,42,0.4)", padding: "6px 12px", borderRadius: "4px" }}>
                        via {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Flora Fauna */}
              {dest.metadata.flora_fauna && dest.metadata.flora_fauna.length > 0 && (
                <div style={{ background: "rgba(20,20,20,0.3)", border: "1px solid rgba(74,59,42,0.2)", borderRadius: "8px", padding: "20px" }}>
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>🌿 KEANEKARAGAMAN HAYATI (FLORA/FAUNA)</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {dest.metadata.flora_fauna.map((f, i) => (
                      <span key={i} className="font-body" style={{ fontSize: "0.7rem", color: "#8B7355", background: "rgba(74,59,42,0.06)", border: "1px solid rgba(74,59,42,0.2)", padding: "4px 10px", borderRadius: "4px" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Emergency Contacts */}
            {dest.metadata.emergency_contacts && dest.metadata.emergency_contacts.length > 0 && (
              <div style={{ background: "rgba(255,107,26,0.02)", border: "1px solid rgba(255,107,26,0.15)", borderRadius: "8px", padding: "18px 24px" }}>
                <p className="font-body text-chaos-orange" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px", fontWeight: 700 }}>🚨 KONTAK DARURAT RANGER & POS SAR</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                  {dest.metadata.emergency_contacts.map((contact, i) => (
                    <span key={i} className="font-body font-semibold text-off-white" style={{ fontSize: "0.72rem" }}>
                      📞 {contact}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Child trails */}
        {dest.kind === "mountain" && childTrails.length > 0 && (
          <section style={{ marginBottom: "48px" }}>
            <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              TRAILS
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {childTrails.map((tr) => (
                <Link
                  key={tr.id}
                  href={`/trail/${tr.slug}`}
                  className="font-body font-semibold text-off-white hover:text-neon-green transition-colors duration-150"
                  style={{ fontSize: "0.78rem", padding: "8px 14px", border: "1px solid rgba(74,59,42,0.4)" }}
                >
                  {tr.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Expeditions */}
        <section style={{ marginBottom: "48px" }}>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
            EXPEDITIONS HERE
          </h2>
          {!expeditions.length ? (
            <p className="font-story text-muted-ink" style={{ fontSize: "0.9rem" }}>No expeditions here yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
              {expeditions.map((e) => (
                <Link key={e.id} href={`/expeditions/${e.slug}`} className="group block">
                  <article style={{ background: "#1F3B2C", border: "1px solid rgba(74,59,42,0.4)" }}>
                    <div className="relative overflow-hidden" style={{ height: "140px" }}>
                      <Image
                        src={e.image_url ?? FALLBACK}
                        alt={e.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ filter: "grayscale(15%)" }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-display font-bold uppercase text-off-white group-hover:text-neon-green transition-colors duration-150" style={{ fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
                        {e.name}
                      </h3>
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.7rem", marginTop: "6px" }}>
                        {formatRange(e.date_start, e.date_end)}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Stories */}
        <section>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
            STORIES FROM HERE
          </h2>
          {!stories.length ? (
            <p className="font-story text-muted-ink" style={{ fontSize: "0.9rem" }}>No stories from here yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {stories.map((s) => (
                <Link
                  key={s.id}
                  href={`/stories/${s.slug}`}
                  className="group"
                  style={{ display: "flex", gap: "14px", alignItems: "center", padding: "12px 14px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)" }}
                >
                  {s.image_url && (
                    <div className="relative flex-shrink-0" style={{ width: "56px", height: "40px" }}>
                      <Image src={s.image_url} alt={s.title} fill sizes="56px" className="object-cover" style={{ filter: "grayscale(20%)" }} />
                    </div>
                  )}
                  <div>
                    <p className="font-display font-bold uppercase text-off-white group-hover:text-neon-green transition-colors duration-150" style={{ fontSize: "0.85rem", letterSpacing: "-0.01em" }}>
                      {s.title}
                    </p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", marginTop: "2px" }}>
                      {s.author_handle}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
