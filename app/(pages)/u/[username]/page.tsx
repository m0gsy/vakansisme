import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import FollowButton from "@/components/FollowButton";

type Params = Promise<{ username: string }>;

const FALLBACK = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80";

export default async function ProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, bio, avatar_url, instagram_handle, strava_url, follows!follows_following_id_fkey(count)")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const followerCount = (profile.follows as { count: number }[])[0]?.count ?? 0;
  const isSelf = currentUser?.id === profile.id;

  let isFollowing = false;
  if (currentUser && !isSelf) {
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    isFollowing = !!data;
  }

  const [{ data: stories }, { data: expeditions }, { data: chaos }, { count: storyCount }, { count: tripCount }] = await Promise.all([
    supabase
      .from("stories")
      .select("id, type, title, excerpt, image_url, created_at")
      .eq("author_id", profile.id)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("expedition_members")
      .select("expedition_id, expeditions(id, name, location, date_start, image_url)")
      .eq("user_id", profile.id)
      .limit(4),
    supabase
      .from("chaos_submissions")
      .select("id, type, caption, accent_color")
      .eq("author_id", profile.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("stories")
      .select("*", { count: "exact", head: true })
      .eq("author_id", profile.id)
      .eq("published", true),
    supabase
      .from("expedition_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id),
  ]);

  let drafts: Array<{ id: string; type: string; title: string; created_at: string; status: string }> = [];
  if (isSelf) {
    const { data: draftData } = await supabase
      .from("stories")
      .select("id, type, title, created_at, status")
      .eq("author_id", profile.id)
      .eq("published", false)
      .order("created_at", { ascending: false })
      .limit(10);
    drafts = draftData ?? [];
  }

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-5xl mx-auto px-6">

        {/* Profile header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "28px",
            flexWrap: "wrap",
            marginBottom: "64px",
            paddingBottom: "48px",
            borderBottom: "1px solid rgba(74,59,42,0.3)",
          }}
        >
          {/* Avatar */}
          <div
            className="bg-forest-dark flex-shrink-0"
            style={{ width: "80px", height: "80px", position: "relative", overflow: "hidden" }}
          >
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="font-display font-black text-neon-green" style={{ fontSize: "2rem" }}>
                  {profile.username[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: "1 1 240px" }}>
            <h1
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", letterSpacing: "-0.02em", lineHeight: 0.9, marginBottom: "8px" }}
            >
              @{profile.username}
            </h1>
            {profile.bio && (
              <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem", marginBottom: "12px", maxWidth: "48ch" }}>
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div style={{ display: "flex", gap: "24px", marginBottom: "16px", flexWrap: "wrap" }}>
              {[
                { label: "TRIPS", value: tripCount ?? 0 },
                { label: "STORIES", value: storyCount ?? 0 },
                { label: "FOLLOWERS", value: followerCount },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="font-display font-black text-off-white" style={{ fontSize: "1.2rem", letterSpacing: "-0.02em", lineHeight: 1 }}>
                    {value}
                  </p>
                  <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.14em", marginTop: "2px" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Social links */}
            {(profile.instagram_handle || profile.strava_url) && (
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                {profile.instagram_handle && (
                  <a
                    href={`https://instagram.com/${profile.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.08em", border: "1px solid rgba(74,59,42,0.4)", padding: "6px 14px", textDecoration: "none" }}
                  >
                    IG @{profile.instagram_handle}
                  </a>
                )}
                {profile.strava_url && (
                  <a
                    href={profile.strava_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.08em", border: "1px solid rgba(74,59,42,0.4)", padding: "6px 14px", textDecoration: "none" }}
                  >
                    STRAVA ↗
                  </a>
                )}
              </div>
            )}

            {isSelf ? (
              <Link
                href="/settings"
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150 inline-block"
                style={{ fontSize: "0.68rem", letterSpacing: "0.1em", border: "1px solid rgba(74,59,42,0.5)", padding: "8px 18px" }}
              >
                EDIT PROFILE
              </Link>
            ) : (
              <FollowButton
                targetId={profile.id}
                initialFollowing={isFollowing}
                initialCount={followerCount}
                currentUserId={currentUser?.id ?? null}
              />
            )}
          </div>
        </div>

        {/* Drafts & submissions — only visible to self */}
        {isSelf && !!drafts.length && (
          <section style={{ marginBottom: "56px" }}>
            <h2
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", letterSpacing: "-0.02em", marginBottom: "8px" }}
            >
              DRAFTS &amp; SUBMISSIONS
            </h2>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem", marginBottom: "20px" }}>
              Only visible to you. Pending stories go live once an admin approves them.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {drafts.map((d) => {
                const badge =
                  d.status === "pending"
                    ? { text: "PENDING", bg: "#FF6B1A", fg: "#111111" }
                    : d.status === "rejected"
                    ? { text: "REJECTED", bg: "#7A2E12", fg: "#F0EDEA" }
                    : { text: "DRAFT", bg: "#4A3B2A", fg: "#F0EDEA" };
                return (
                  <Link
                    key={d.id}
                    href={`/stories/${d.id}/edit`}
                    className="group"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "#1a1a1a",
                      border: "1px solid rgba(74,59,42,0.3)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        className="font-body font-semibold"
                        style={{ fontSize: "0.58rem", letterSpacing: "0.1em", background: badge.bg, color: badge.fg, padding: "2px 7px", textTransform: "uppercase" }}
                      >
                        {badge.text}
                      </span>
                      <span
                        className="font-display font-bold uppercase text-off-white group-hover:text-neon-green transition-colors duration-150"
                        style={{ fontSize: "0.88rem", letterSpacing: "-0.01em" }}
                      >
                        {d.title}
                      </span>
                    </div>
                    <span className="font-body text-muted-ink" style={{ fontSize: "0.7rem" }}>
                      EDIT →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Stories */}
        {!!stories?.length && (
          <section style={{ marginBottom: "56px" }}>
            <h2
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", letterSpacing: "-0.02em", marginBottom: "24px" }}
            >
              STORIES
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
              {stories.map((s) => (
                <Link key={s.id} href={`/stories/${s.id}`} className="group block">
                  <article style={{ background: "#1F3B2C", border: "1px solid rgba(74,59,42,0.4)" }}>
                    <div className="relative overflow-hidden" style={{ height: "140px" }}>
                      <Image
                        src={s.image_url ?? FALLBACK}
                        alt={s.title}
                        fill
                        sizes="33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ filter: "grayscale(20%) brightness(0.8)" }}
                      />
                      <span
                        className="font-body font-semibold text-neon-green uppercase absolute bottom-3 left-3"
                        style={{ fontSize: "0.58rem", letterSpacing: "0.14em" }}
                      >
                        {s.type}
                      </span>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <h3
                        className="font-display font-bold uppercase text-off-white leading-tight"
                        style={{ fontSize: "0.9rem", letterSpacing: "-0.01em" }}
                      >
                        {s.title}
                      </h3>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Expeditions */}
        {!!expeditions?.length && (
          <section style={{ marginBottom: "56px" }}>
            <h2
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", letterSpacing: "-0.02em", marginBottom: "24px" }}
            >
              EXPEDITIONS
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {expeditions.map((em) => {
                const exp = (Array.isArray(em.expeditions) ? em.expeditions[0] : em.expeditions) as { id: string; name: string; location: string; date_start: string; image_url: string | null } | null;
                if (!exp) return null;
                return (
                  <div
                    key={em.expedition_id}
                    style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "16px 20px", flex: "1 1 200px" }}
                  >
                    <p className="font-body font-semibold text-neon-green uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: "6px" }}>
                      {new Date(exp.date_start).toLocaleDateString("en", { month: "short", year: "numeric" })}
                    </p>
                    <p className="font-display font-bold uppercase text-off-white" style={{ fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
                      {exp.name}
                    </p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.75rem", marginTop: "4px" }}>
                      {exp.location}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Chaos */}
        {!!chaos?.length && (
          <section>
            <h2
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", letterSpacing: "-0.02em", marginBottom: "24px" }}
            >
              CHAOS
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {chaos.map((c) => (
                <div
                  key={c.id}
                  style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "20px", flex: "1 1 220px" }}
                >
                  <p className="font-body font-semibold uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", color: c.accent_color, marginBottom: "10px" }}>
                    {c.type}
                  </p>
                  <p className="font-story text-off-white/80" style={{ fontSize: "0.85rem", lineHeight: 1.65 }}>
                    {c.caption}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
