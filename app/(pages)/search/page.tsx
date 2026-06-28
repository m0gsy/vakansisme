import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

const FALLBACK = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80";

type SearchParams = Promise<{ q?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let blockedIds: string[] = [];
  if (user) {
    const { data: blocks } = await supabase.from("user_blocks").select("blocked_id").eq("blocker_id", user.id);
    blockedIds = (blocks ?? []).map((b) => b.blocked_id);
  }

  const ftsQuery = query.trim().split(/\s+/).filter(Boolean).map((w) => `${w}:*`).join(" & ");

  const [{ data: expeditions }, { data: stories }, { data: profiles }] = query
    ? await Promise.all([
        supabase
          .from("expeditions")
          .select("id, name, location, difficulty, image_url, date_start")
          .textSearch("fts", ftsQuery, { type: "websearch", config: "english" })
          .limit(6)
          .then(async (r) => r.error
            ? supabase.from("expeditions").select("id, name, location, difficulty, image_url, date_start").or(`name.ilike.%${query}%,location.ilike.%${query}%`).limit(6)
            : r
          ),
        supabase
          .from("stories")
          .select("id, type, title, excerpt, image_url, author_handle, author_id")
          .eq("published", true)
          .textSearch("fts", ftsQuery, { type: "websearch", config: "english" })
          .limit(6)
          .then(async (r) => {
            const base = r.error
              ? await supabase.from("stories").select("id, type, title, excerpt, image_url, author_handle, author_id").eq("published", true).or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`).limit(6)
              : r;
            if (blockedIds.length && base.data) {
              return { ...base, data: base.data.filter((s) => !blockedIds.includes(s.author_id)) };
            }
            return base;
          }),
        supabase
          .from("profiles")
          .select("id, username, bio, avatar_url")
          .ilike("username", `%${query}%`)
          .limit(5)
          .then((r) => {
            if (blockedIds.length && r.data) {
              return { ...r, data: r.data.filter((p) => !blockedIds.includes(p.id)) };
            }
            return r;
          }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const hasResults = (expeditions?.length ?? 0) + (stories?.length ?? 0) + (profiles?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-5xl mx-auto px-6">

        {/* Search input */}
        <form action="/search" method="GET" style={{ marginBottom: "56px" }}>
          <label
            htmlFor="q"
            className="font-display font-black uppercase text-off-white block"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "24px" }}
          >
            SEARCH
          </label>
          <div style={{ display: "flex", gap: "0", borderBottom: "2px solid #4A3B2A" }}>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              autoFocus
              placeholder="expedition, story, crew..."
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none flex-1"
              style={{ background: "transparent", border: "none", padding: "12px 0", fontSize: "1.1rem" }}
            />
            <button
              type="submit"
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
              style={{ fontSize: "0.7rem", letterSpacing: "0.14em", padding: "12px 24px", border: "none", cursor: "pointer" }}
            >
              GO
            </button>
          </div>
        </form>

        {/* No query */}
        {!query && (
          <p className="font-story text-muted-ink" style={{ fontSize: "0.95rem" }}>
            Type something above to search expeditions, stories, and crew.
          </p>
        )}

        {/* No results */}
        {query && !hasResults && (
          <p className="font-story text-muted-ink" style={{ fontSize: "0.95rem" }}>
            Nothing found for &ldquo;{query}&rdquo;. Try different words.
          </p>
        )}

        {/* Expeditions */}
        {!!expeditions?.length && (
          <section style={{ marginBottom: "48px" }}>
            <h2
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}
            >
              EXPEDITIONS
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {expeditions.map((e) => (
                <Link key={e.id} href={`/expeditions/${e.id}`} className="group block">
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: "#1a1a1a",
                      border: "1px solid rgba(74,59,42,0.35)",
                    }}
                  >
                    {e.image_url && (
                      <div className="relative flex-shrink-0" style={{ width: "60px", height: "60px" }}>
                        <Image
                          src={e.image_url}
                          alt={e.name}
                          fill
                          sizes="60px"
                          className="object-cover"
                          style={{ filter: "grayscale(20%)" }}
                        />
                      </div>
                    )}
                    <div>
                      <p
                        className="font-display font-bold uppercase text-off-white group-hover:text-neon-green transition-colors duration-150"
                        style={{ fontSize: "0.95rem", letterSpacing: "-0.01em" }}
                      >
                        {e.name}
                      </p>
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.75rem" }}>
                        {e.location} · {new Date(e.date_start).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Stories */}
        {!!stories?.length && (
          <section style={{ marginBottom: "48px" }}>
            <h2
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}
            >
              STORIES
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {stories.map((s) => (
                <Link key={s.id} href={`/stories/${s.id}`} className="group block">
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: "#1F3B2C",
                      border: "1px solid rgba(74,59,42,0.35)",
                    }}
                  >
                    <div className="relative flex-shrink-0" style={{ width: "60px", height: "60px" }}>
                      <Image
                        src={s.image_url ?? FALLBACK}
                        alt={s.title}
                        fill
                        sizes="60px"
                        className="object-cover"
                        style={{ filter: "grayscale(20%)" }}
                      />
                    </div>
                    <div>
                      <p
                        className="font-body font-semibold text-neon-green uppercase"
                        style={{ fontSize: "0.58rem", letterSpacing: "0.14em", marginBottom: "4px" }}
                      >
                        {s.type}
                      </p>
                      <p
                        className="font-display font-bold uppercase text-off-white group-hover:text-neon-green transition-colors duration-150"
                        style={{ fontSize: "0.95rem", letterSpacing: "-0.01em" }}
                      >
                        {s.title}
                      </p>
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.75rem" }}>
                        {s.author_handle}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* People */}
        {!!profiles?.length && (
          <section>
            <h2
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}
            >
              CREW
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {profiles.map((p) => (
                <Link key={p.id} href={`/u/${p.username}`} className="group">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      background: "#1a1a1a",
                      border: "1px solid rgba(74,59,42,0.35)",
                    }}
                  >
                    <div
                      className="bg-forest-dark flex-shrink-0 flex items-center justify-center"
                      style={{ width: "36px", height: "36px" }}
                    >
                      {p.avatar_url ? (
                        <div style={{ position: "relative", width: "36px", height: "36px" }}>
                          <Image src={p.avatar_url} alt={p.username} fill className="object-cover" />
                        </div>
                      ) : (
                        <span className="font-display font-black text-neon-green" style={{ fontSize: "0.9rem" }}>
                          {p.username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p
                        className="font-body font-semibold text-off-white group-hover:text-neon-green transition-colors duration-150"
                        style={{ fontSize: "0.82rem" }}
                      >
                        @{p.username}
                      </p>
                      {p.bio && (
                        <p className="font-body text-muted-ink" style={{ fontSize: "0.7rem", maxWidth: "24ch" }}>
                          {p.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
