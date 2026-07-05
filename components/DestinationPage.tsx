import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resolveSlugOrRedirect } from "@/lib/resolve";
import { absoluteUrl } from "@/lib/seo";

// Kinds are admin-defined (destination_kinds table) — not a fixed union anymore.
// The 3 original kinds keep dedicated routes/behavior below; any other kind renders
// generically via the /destination/[slug] route.
export type DestKind = string;

function kindLabel(kind: string): string {
  return kind.replace(/_/g, " ").toUpperCase();
}

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
      select: "id, kind, name, slug, parent_id, location_id, elevation_m, description, image_url",
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
          <p className="font-story text-off-white/80" style={{ fontSize: "1rem", lineHeight: 1.7, maxWidth: "70ch", marginBottom: "48px" }}>
            {dest.description}
          </p>
        ) : (
          <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "48px" }}>
            No description yet.
          </p>
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
