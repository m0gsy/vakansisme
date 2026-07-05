import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resolveSlugOrRedirect } from "@/lib/resolve";
import { absoluteUrl, buildEntityMetadata } from "@/lib/seo";
import { difficultyLabel } from "@/lib/difficulty";

type Params = Promise<{ slug: string }>;

const BASE_PATH = "/categories";
const FALLBACK = "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80";

type Activity = { id: string; name: string; slug: string; archived: boolean };

type ExpeditionRow = {
  id: string;
  slug: string;
  name: string;
  location: string;
  difficulty: string;
  price: string;
  date_start: string;
  date_end: string;
  status: string;
  image_url: string | null;
};

function formatDate(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const mo = s.toLocaleString("en", { month: "short" });
  return `${s.getDate()}–${e.getDate()} ${mo} ${s.getFullYear()}`;
}

// ponytail: cache()-wrapped so generateMetadata and the page body share one fetch per request.
const getCategoryData = cache(async (param: string) => {
  const supabase = await createClient();

  const activity = await resolveSlugOrRedirect<Activity>({
    supabase,
    table: "activities",
    entityType: "activity",
    param,
    basePath: BASE_PATH,
    select: "id, name, slug, archived",
    filter: [{ column: "archived", value: false }],
  });

  const { data: expeditions } = await supabase
    .from("expeditions")
    .select("id, slug, name, location, difficulty, price, date_start, date_end, status, image_url")
    .eq("activity_category", activity.name)
    .order("date_start", { ascending: true })
    .limit(24);

  return { activity, expeditions: (expeditions ?? []) as ExpeditionRow[] };
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { activity, expeditions } = await getCategoryData(slug);
  return buildEntityMetadata({
    title: `${activity.name} — VAKANSISME`,
    description: `Explore ${activity.name} expeditions with Vakansisme.`,
    path: `${BASE_PATH}/${activity.slug}`,
    noindex: expeditions.length < 2,
  });
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { activity, expeditions } = await getCategoryData(slug);

  const url = absoluteUrl(`${BASE_PATH}/${activity.slug}`);
  const crumbs: { name: string; href?: string }[] = [
    { name: "HOME", href: "/" },
    { name: "EXPEDITIONS", href: "/expeditions" },
    { name: activity.name },
  ];

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: activity.name,
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
      <div className="max-w-7xl mx-auto px-6">
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

        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(2rem, 6vw, 4rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "12px", textWrap: "balance" }}
        >
          {activity.name}
        </h1>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "48px" }}>
          {expeditions.length} {expeditions.length === 1 ? "expedition" : "expeditions"}
        </p>

        {!expeditions.length ? (
          <p className="font-story text-muted-ink" style={{ fontSize: "1rem" }}>
            No {activity.name} expeditions yet.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {expeditions.map((e) => (
              <Link key={e.id} href={`/expeditions/${e.slug}`} className="group block">
                <article style={{ background: "#1F3B2C", border: "1px solid rgba(74,59,42,0.4)" }}>
                  <div className="relative overflow-hidden" style={{ height: "200px" }}>
                    <Image
                      src={e.image_url ?? FALLBACK}
                      alt={e.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ filter: "grayscale(15%)" }}
                    />
                    <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(31,59,44,0.7) 0%, transparent 50%)" }} />
                    <div className="absolute bottom-3 left-3" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <span className="font-body font-semibold text-charcoal bg-neon-green" style={{ fontSize: "0.62rem", letterSpacing: "0.06em", padding: "3px 8px" }}>
                        {difficultyLabel(e.difficulty)}
                      </span>
                      {e.status && (
                        <span
                          className="font-body font-semibold"
                          style={{
                            fontSize: "0.62rem", letterSpacing: "0.06em", padding: "3px 8px",
                            background: e.status === "ongoing" ? "#FF6B1A" : e.status === "completed" ? "#4A3B2A" : "rgba(240,237,234,0.15)",
                            color: "#F0EDEA",
                          }}
                        >
                          {e.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <h2
                      className="font-display font-bold uppercase text-off-white leading-tight group-hover:text-neon-green transition-colors duration-150"
                      style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.3rem)", letterSpacing: "-0.01em", marginBottom: "4px" }}
                    >
                      {e.name}
                    </h2>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem", marginBottom: "10px" }}>{e.location}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(74,59,42,0.4)", paddingTop: "14px" }}>
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}>{formatDate(e.date_start, e.date_end)}</p>
                      <p className="font-body font-semibold text-off-white" style={{ fontSize: "0.9rem" }}>{e.price}</p>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
