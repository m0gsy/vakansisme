import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl, buildEntityMetadata } from "@/lib/seo";

type ProvinceRow = { id: string; name: string; slug: string };
type DestRow = { id: string; name: string; slug: string; kind: "mountain" | "trail" | "national_park" };

const KIND_BASE_PATH: Record<DestRow["kind"], string> = {
  mountain: "/mountain",
  trail: "/trail",
  national_park: "/national-park",
};

const KIND_HEADING: Record<DestRow["kind"], string> = {
  mountain: "MOUNTAINS",
  trail: "TRAILS",
  national_park: "NATIONAL PARKS",
};

const getExploreData = cache(async () => {
  const supabase = await createClient();
  const [{ data: provinces }, { data: destinations }] = await Promise.all([
    supabase.from("locations").select("id, name, slug").eq("type", "province").order("name", { ascending: true }),
    supabase.from("destinations").select("id, name, slug, kind").order("name", { ascending: true }),
  ]);

  const byKind: Record<DestRow["kind"], DestRow[]> = { mountain: [], trail: [], national_park: [] };
  for (const d of (destinations ?? []) as DestRow[]) byKind[d.kind].push(d);

  return {
    provinces: (provinces ?? []) as ProvinceRow[],
    byKind,
    hasContent: (destinations ?? []).length > 0,
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const { hasContent } = await getExploreData();
  return buildEntityMetadata({
    title: "Explore — VAKANSISME",
    description: "Explore mountains, trails, national parks, and regions across Indonesia with Vakansisme.",
    path: "/explore",
    noindex: !hasContent,
  });
}

export default async function ExplorePage() {
  const { provinces, byKind } = await getExploreData();

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Explore — Vakansisme",
    url: absoluteUrl("/explore"),
    isPartOf: { "@id": `${absoluteUrl("")}/#website` },
  };

  const kinds: DestRow["kind"][] = ["mountain", "trail", "national_park"];

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <div className="max-w-5xl mx-auto px-6">
        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(3rem, 8vw, 6rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "48px" }}
        >
          EXPLORE
        </h1>

        {provinces.length > 0 && (
          <section style={{ marginBottom: "48px" }}>
            <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              REGIONS
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {provinces.map((p) => (
                <Link
                  key={p.id}
                  href={`/location/${p.slug}`}
                  className="font-body font-semibold text-off-white hover:text-neon-green transition-colors duration-150"
                  style={{ fontSize: "0.78rem", padding: "8px 14px", border: "1px solid rgba(74,59,42,0.4)" }}
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {kinds.every((k) => byKind[k].length === 0) && provinces.length === 0 && (
          <p className="font-story text-muted-ink" style={{ fontSize: "1rem" }}>Nothing to explore yet.</p>
        )}

        {kinds.map((k) =>
          byKind[k].length === 0 ? null : (
            <section key={k} style={{ marginBottom: "48px" }}>
              <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
                {KIND_HEADING[k]}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {byKind[k].map((d) => (
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
            </section>
          )
        )}
      </div>
    </div>
  );
}
