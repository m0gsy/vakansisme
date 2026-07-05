import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl, buildEntityMetadata } from "@/lib/seo";
import { destBasePath, kindLabel } from "@/lib/related";

type ProvinceRow = { id: string; name: string; slug: string };
type DestRow = { id: string; name: string; slug: string; kind: string };

const getExploreData = cache(async () => {
  const supabase = await createClient();
  const [{ data: provinces }, { data: destinations }] = await Promise.all([
    supabase.from("locations").select("id, name, slug").eq("type", "province").order("name", { ascending: true }),
    supabase.from("destinations").select("id, name, slug, kind").order("name", { ascending: true }),
  ]);

  // Group dynamically — kinds are admin-defined (destination_kinds table), not a fixed set.
  const byKind = new Map<string, DestRow[]>();
  for (const d of (destinations ?? []) as DestRow[]) {
    if (!byKind.has(d.kind)) byKind.set(d.kind, []);
    byKind.get(d.kind)!.push(d);
  }

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

  const kinds = [...byKind.keys()].sort();

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

        {kinds.length === 0 && provinces.length === 0 && (
          <p className="font-story text-muted-ink" style={{ fontSize: "1rem" }}>Nothing to explore yet.</p>
        )}

        {kinds.map((k) => (
          <section key={k} style={{ marginBottom: "48px" }}>
            <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              {kindLabel(k)}S
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(byKind.get(k) ?? []).map((d) => (
                <Link
                  key={d.id}
                  href={`${destBasePath(d.kind)}/${d.slug}`}
                  className="font-body font-semibold text-off-white hover:text-neon-green transition-colors duration-150"
                  style={{ fontSize: "0.78rem", padding: "8px 14px", border: "1px solid rgba(74,59,42,0.4)" }}
                >
                  {d.name}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
