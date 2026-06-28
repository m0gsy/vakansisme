import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Feed — VAKANSISME" };

const FALLBACK = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: follows }, { data: blocks }] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", user.id),
    supabase.from("user_blocks").select("blocked_id").eq("blocker_id", user.id),
  ]);

  const followingIds = (follows ?? []).map((f) => f.following_id);
  const blockedIds = (blocks ?? []).map((b) => b.blocked_id);

  if (!followingIds.length) {
    return (
      <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
        <div className="max-w-2xl mx-auto px-6" style={{ textAlign: "center", paddingTop: "80px" }}>
          <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2rem, 6vw, 4rem)", letterSpacing: "-0.025em", marginBottom: "16px" }}>
            YOUR FEED
          </h1>
          <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "32px" }}>
            Follow crew members to see their activity here.
          </p>
          <Link href="/crew" className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150" style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "12px 28px" }}>
            FIND CREW →
          </Link>
        </div>
      </div>
    );
  }

  let storiesQuery = supabase
    .from("stories")
    .select("id, title, type, image_url, created_at, author_handle, author_id")
    .eq("published", true)
    .in("author_id", followingIds)
    .order("created_at", { ascending: false })
    .limit(20);
  if (blockedIds.length) storiesQuery = storiesQuery.not("author_id", "in", `(${blockedIds.join(",")})`);

  const [{ data: stories }, { data: joins }] = await Promise.all([
    storiesQuery,
    supabase
      .from("expedition_members")
      .select("user_id, joined_at, expedition_id, profiles(username), expeditions(id, name, location)")
      .in("user_id", followingIds)
      .order("joined_at", { ascending: false })
      .limit(20),
  ]);

  type FeedItem =
    | { kind: "story"; id: string; title: string; type: string; image_url: string | null; created_at: string; author_handle: string }
    | { kind: "join"; username: string; expedition_id: string; expedition_name: string; expedition_location: string; joined_at: string };

  const items: FeedItem[] = [
    ...(stories ?? []).map((s) => ({ kind: "story" as const, id: s.id, title: s.title, type: s.type, image_url: s.image_url, created_at: s.created_at, author_handle: s.author_handle })),
    ...(joins ?? []).map((j) => {
      const p = Array.isArray(j.profiles) ? j.profiles[0] : j.profiles as { username: string } | null;
      const e = Array.isArray(j.expeditions) ? j.expeditions[0] : j.expeditions as { id: string; name: string; location: string } | null;
      return { kind: "join" as const, username: p?.username ?? "", expedition_id: e?.id ?? j.expedition_id, expedition_name: e?.name ?? "", expedition_location: e?.location ?? "", joined_at: j.joined_at };
    }),
  ].sort((a, b) => {
    const aDate = a.kind === "story" ? a.created_at : a.joined_at;
    const bDate = b.kind === "story" ? b.created_at : b.joined_at;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "12px" }}>
          YOUR FEED
        </h1>
        <p className="font-body text-muted-ink mb-12" style={{ fontSize: "0.88rem" }}>
          Activity from {followingIds.length} crew you follow.
        </p>

        {!items.length && (
          <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem" }}>Nothing yet — your crew is quiet.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {items.map((item, i) => (
            item.kind === "story" ? (
              <Link key={`s-${item.id}`} href={`/stories/${item.id}`} className="group">
                <div style={{ display: "flex", gap: "0", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)", overflow: "hidden" }}>
                  <div className="relative flex-shrink-0" style={{ width: "80px" }}>
                    <Image src={item.image_url ?? FALLBACK} alt={item.title} fill sizes="80px" className="object-cover" style={{ filter: "grayscale(20%)" }} />
                  </div>
                  <div style={{ padding: "16px 20px", flex: 1 }}>
                    <p className="font-body font-semibold text-neon-green uppercase" style={{ fontSize: "0.58rem", letterSpacing: "0.14em", marginBottom: "4px" }}>
                      {item.author_handle} wrote a {item.type}
                    </p>
                    <p className="font-display font-bold uppercase text-off-white group-hover:text-neon-green transition-colors duration-150" style={{ fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
                      {item.title}
                    </p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", marginTop: "6px" }}>
                      {new Date(item.created_at).toLocaleDateString("en", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <Link key={`j-${i}`} href={`/expeditions/${item.expedition_id}`} className="group">
                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)" }}>
                  <span className="font-display font-black text-muted-ink" style={{ fontSize: "1rem" }}>↗</span>
                  <div style={{ flex: 1 }}>
                    <p className="font-body font-semibold text-muted-ink" style={{ fontSize: "0.72rem" }}>
                      <span className="text-off-white">@{item.username}</span> joined a trip
                    </p>
                    <p className="font-display font-bold uppercase text-off-white group-hover:text-neon-green transition-colors duration-150" style={{ fontSize: "0.88rem", letterSpacing: "-0.01em" }}>
                      {item.expedition_name}
                    </p>
                  </div>
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem" }}>
                    {new Date(item.joined_at).toLocaleDateString("en", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </Link>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
