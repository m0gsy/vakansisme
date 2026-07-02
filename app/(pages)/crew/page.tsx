import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import CrewGrid from "@/components/CrewGrid";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export const metadata = {
  title: "Crew — Komunitas Pendaki & Petualang",
  description: "Temukan pendaki, fotografer, dan petualang lain di komunitas Vakansisme. Ikuti, kirim pesan, dan bergabung ekspedisi bersama.",
  openGraph: {
    title: "Crew — Vakansisme",
    description: "Komunitas outdoor Indonesia. Temukan pendaki dan petualang.",
  },
  twitter: { card: "summary" as const, title: "Crew — Vakansisme" },
};

const PAGE_SIZE = 24;

type SearchParams = Promise<{ page?: string }>;

export default async function CrewPage({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const locale = await getLocale();
  const { data: { user } } = await supabase.auth.getUser();

  let blockedIds: string[] = [];
  const followingSet = new Set<string>();
  if (user) {
    const [{ data: following }, { data: blocks }] = await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
      supabase.from("user_blocks").select("blocked_id").eq("blocker_id", user.id),
    ]);
    following?.forEach((f) => followingSet.add(f.following_id));
    blockedIds = (blocks ?? []).map((b) => b.blocked_id);
  }

  let profilesQuery = supabase
    .from("profiles")
    .select("id, username, bio, avatar_url, follows!follows_following_id_fkey(count)", { count: "exact" })
    .order("created_at")
    .range(from, to);

  if (blockedIds.length) {
    profilesQuery = profilesQuery.not("id", "in", `(${blockedIds.join(",")})`);
  }

  const { data: profiles, count } = await profilesQuery;

  const members = (profiles ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    bio: p.bio as string | null,
    avatar_url: p.avatar_url as string | null,
    follower_count: (p.follows as { count: number }[])[0]?.count ?? 0,
    is_following: followingSet.has(p.id),
    is_self: user?.id === p.id,
  }));

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-7xl mx-auto px-6">
        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(3rem, 8vw, 6rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "16px" }}
        >
          {t(locale, "page_crew")}
        </h1>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "56px" }}>
          {count ?? 0} {locale === "id" ? "anggota." : "members."} {t(locale, "crew_subtitle")}
        </p>

        <CrewGrid members={members} currentUserId={user?.id ?? null} blockedIds={blockedIds} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "56px", alignItems: "center" }}
          >
            {page > 1 && (
              <Link
                href={`/crew?page=${page - 1}`}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 16px", border: "1px solid rgba(74,59,42,0.4)" }}
              >
                ← PREV
              </Link>
            )}
            <span
              className="font-body text-muted-ink"
              style={{ fontSize: "0.68rem", letterSpacing: "0.1em", padding: "8px 12px" }}
            >
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/crew?page=${page + 1}`}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "8px 16px", border: "1px solid rgba(74,59,42,0.4)" }}
              >
                NEXT →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
