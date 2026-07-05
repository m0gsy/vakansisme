import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resolveSlugOrRedirect } from "@/lib/resolve";
import { absoluteUrl, buildEntityMetadata } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

const BASE_PATH = "/location";

type LocationRow = {
  id: string;
  type: "province" | "city";
  name: string;
  slug: string;
  parent_id: string | null;
};

type DestRow = { id: string; name: string; slug: string; kind: "mountain" | "trail" | "national_park" };
type CityRow = { id: string; name: string; slug: string };

const KIND_BASE_PATH: Record<DestRow["kind"], string> = {
  mountain: "/mountain",
  trail: "/trail",
  national_park: "/national-park",
};

// ponytail: cache()-wrapped so generateMetadata and the page body share one fetch per request.
const getLocationData = cache(async (param: string) => {
  const supabase = await createClient();

  const location = await resolveSlugOrRedirect<LocationRow>({
    supabase,
    table: "locations",
    entityType: "location",
    param,
    basePath: BASE_PATH,
    select: "id, type, name, slug, parent_id",
  });

  let province: LocationRow | null = null;
  let cities: CityRow[] = [];
  let destinations: DestRow[] = [];

  if (location.type === "province") {
    const { data: cityRows } = await supabase
      .from("locations")
      .select("id, name, slug")
      .eq("parent_id", location.id)
      .eq("type", "city")
      .order("name", { ascending: true });
    cities = cityRows ?? [];
    const locationIds = [location.id, ...cities.map((c) => c.id)];
    const { data: destRows } = await supabase
      .from("destinations")
      .select("id, name, slug, kind")
      .in("location_id", locationIds)
      .order("name", { ascending: true });
    destinations = destRows ?? [];
  } else {
    if (location.parent_id) {
      const { data: prov } = await supabase.from("locations").select("id, type, name, slug, parent_id").eq("id", location.parent_id).maybeSingle();
      province = prov as LocationRow | null;
    }
    const { data: destRows } = await supabase
      .from("destinations")
      .select("id, name, slug, kind")
      .eq("location_id", location.id)
      .order("name", { ascending: true });
    destinations = destRows ?? [];
  }

  const hasContent = destinations.length > 0;

  return { location, province, cities, destinations, hasContent };
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { location, hasContent } = await getLocationData(slug);
  return buildEntityMetadata({
    title: `${location.name} — VAKANSISME`,
    description: `Explore destinations in ${location.name} with Vakansisme.`,
    path: `${BASE_PATH}/${location.slug}`,
    noindex: !hasContent,
  });
}

export default async function LocationPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { location, province, cities, destinations } = await getLocationData(slug);

  const crumbs: { name: string; href?: string }[] = [{ name: "EXPLORE", href: "/explore" }];
  if (province) crumbs.push({ name: province.name, href: `/location/${province.slug}` });
  crumbs.push({ name: location.name });

  const url = absoluteUrl(`${BASE_PATH}/${location.slug}`);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: location.name,
    url,
    isPartOf: { "@id": `${absoluteUrl("")}/#website` },
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
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="max-w-5xl mx-auto px-6">
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

        <span
          className="font-body font-semibold text-charcoal bg-neon-green inline-block"
          style={{ fontSize: "0.62rem", letterSpacing: "0.08em", padding: "4px 10px", marginBottom: "16px" }}
        >
          {location.type.toUpperCase()}
        </span>

        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(2rem, 6vw, 4rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "48px", textWrap: "balance" }}
        >
          {location.name}
        </h1>

        {location.type === "province" && cities.length > 0 && (
          <section style={{ marginBottom: "48px" }}>
            <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              CITIES
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {cities.map((c) => (
                <Link
                  key={c.id}
                  href={`/location/${c.slug}`}
                  className="font-body font-semibold text-off-white hover:text-neon-green transition-colors duration-150"
                  style={{ fontSize: "0.78rem", padding: "8px 14px", border: "1px solid rgba(74,59,42,0.4)" }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
            DESTINATIONS
          </h2>
          {!destinations.length ? (
            <p className="font-story text-muted-ink" style={{ fontSize: "0.9rem" }}>No destinations here yet.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {destinations.map((d) => (
                <Link
                  key={d.id}
                  href={`${KIND_BASE_PATH[d.kind]}/${d.slug}`}
                  className="font-body font-semibold text-off-white hover:text-neon-green transition-colors duration-150"
                  style={{ fontSize: "0.78rem", padding: "8px 14px", border: "1px solid rgba(74,59,42,0.4)" }}
                >
                  {d.name}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
