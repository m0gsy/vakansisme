import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import ChaosSubmitButton from "@/components/ChaosSubmitButton";
import ChaosReact from "@/components/ChaosReact";
import { CHAOS_TYPES } from "@/types/chaos";

export const metadata = { title: "Chaos Wall — VAKANSISME" };

const PAGE_SIZE = 12;

type SearchParams = Promise<{ type?: string; page?: string }>;

export default async function ChaosPage({ searchParams }: { searchParams: SearchParams }) {
  const { type, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("chaos_submissions")
    .select("id, author_handle, type, caption, image_url, rotation, accent_color", { count: "exact" })
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);

  const { data: cards, count } = await query.range(from, to);
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Fetch reactions for this page
  const cardIds = (cards ?? []).map((c) => c.id);
  const { data: reactionRows } = cardIds.length
    ? await supabase.from("chaos_reactions").select("chaos_id, user_id").in("chaos_id", cardIds)
    : { data: [] };

  const reactionCounts = Object.fromEntries(
    cardIds.map((id) => [id, (reactionRows ?? []).filter((r) => r.chaos_id === id).length])
  );
  const userReacted = new Set(
    (reactionRows ?? []).filter((r) => r.user_id === user?.id).map((r) => r.chaos_id)
  );

  const pillHref = (t?: string) => (t ? `/chaos?type=${encodeURIComponent(t)}` : "/chaos");
  const pageHref = (p: number) => `/chaos?${type ? `type=${encodeURIComponent(type)}&` : ""}page=${p}`;

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(3rem, 8vw, 6rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
          >
            CHAOS WALL
          </h1>
          <p className="font-body text-muted-ink mt-3" style={{ fontSize: "0.9rem", maxWidth: "50ch" }}>
            No curation. No filters. The unedited truth from the field.
          </p>
        </div>

        {/* Type filter pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "48px" }}>
          <Link
            href={pillHref()}
            className="font-body font-semibold transition-all duration-150"
            style={{
              fontSize: "0.66rem",
              letterSpacing: "0.1em",
              padding: "7px 14px",
              border: "1px solid",
              background: !type ? "#9BFF3C" : "transparent",
              color: !type ? "#111111" : "#8B7355",
              borderColor: !type ? "#9BFF3C" : "rgba(74,59,42,0.5)",
            }}
          >
            ALL
          </Link>
          {CHAOS_TYPES.map((t) => {
            const active = type === t;
            return (
              <Link
                key={t}
                href={pillHref(t)}
                className="font-body font-semibold transition-all duration-150"
                style={{
                  fontSize: "0.66rem",
                  letterSpacing: "0.08em",
                  padding: "7px 14px",
                  border: "1px solid",
                  background: active ? "#9BFF3C" : "transparent",
                  color: active ? "#111111" : "#8B7355",
                  borderColor: active ? "#9BFF3C" : "rgba(74,59,42,0.5)",
                }}
              >
                {t}
              </Link>
            );
          })}
        </div>

        {/* Grid */}
        {!cards?.length ? (
          <p className="font-story text-muted-ink" style={{ fontSize: "1rem" }}>
            Nothing here{type ? ` tagged "${type}"` : ""} yet.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {cards.map((card, i) => (
              <div
                key={card.id}
                style={{
                  background: i % 3 === 0 ? "#1F3B2C" : i % 3 === 1 ? "#111111" : "#4A3B2A",
                  border: "1px solid rgba(74,59,42,0.35)",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "180px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {card.image_url && (
                  <div className="relative" style={{ height: "160px" }}>
                    <Image
                      src={card.image_url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      style={{ filter: "grayscale(15%)" }}
                    />
                  </div>
                )}
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                  <span
                    className="font-body font-semibold uppercase"
                    style={{ fontSize: "0.62rem", letterSpacing: "0.14em", color: card.accent_color }}
                  >
                    {card.type}
                  </span>
                  <p className="font-story text-off-white" style={{ fontSize: "0.88rem", lineHeight: 1.7, marginTop: "12px", marginBottom: "12px" }}>
                    {card.caption}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.04em" }}>
                      {card.author_handle}
                    </p>
                    <ChaosReact
                      chaosId={card.id}
                      initialCount={reactionCounts[card.id] ?? 0}
                      initialReacted={userReacted.has(card.id)}
                      currentUserId={user?.id ?? null}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "56px", alignItems: "center" }}>
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 16px", border: "1px solid rgba(74,59,42,0.4)" }}
              >
                ← PREV
              </Link>
            )}
            <span className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.1em", padding: "8px 12px" }}>
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 16px", border: "1px solid rgba(74,59,42,0.4)" }}
              >
                NEXT →
              </Link>
            )}
          </div>
        )}

        {/* Submit CTA */}
        <div style={{ textAlign: "center", marginTop: "64px", paddingTop: "48px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
          <p className="font-body text-muted-ink" style={{ fontSize: "0.85rem", marginBottom: "20px" }}>
            Got your own chaos to share?
          </p>
          <ChaosSubmitButton variant="orange" />
        </div>
      </div>
    </div>
  );
}
