import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChaosActions, ExpeditionActions, AdminExpeditionForm, StoryModerationActions, GalleryModerationActions, AdminExportButtons, AdminAutoStatusButton, AdminRemindersButton, AdminUsersSection, AdminReportsSection, AdminProposalsSection, AdminActivitiesSection } from "@/components/AdminActions";
import NewsletterForm from "@/components/NewsletterForm";

export const metadata = { title: "Admin — VAKANSISME" };

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: "56px" }}>
      <h2
        className="font-display font-black uppercase text-off-white"
        style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Cell({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td
      className={muted ? "font-body text-muted-ink" : "font-body text-off-white"}
      style={{ fontSize: "0.82rem", padding: "12px 16px", verticalAlign: "middle" }}
    >
      {children}
    </td>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="font-body font-semibold text-muted-ink uppercase"
      style={{ fontSize: "0.6rem", letterSpacing: "0.12em", padding: "10px 16px", textAlign: "left" }}
    >
      {children}
    </th>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  const [{ data: chaos }, { data: expeditions }, { data: pendingStories }, { data: allStories }, { count: subscriberCount }, { data: pendingGallery }] = await Promise.all([
    supabase
      .from("chaos_submissions")
      .select("id, author_handle, type, caption, image_url, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("expeditions")
      .select("id, name, location, difficulty, price, date_start, date_end, quota_max, leader_id, profiles!leader_id(username), image_url, description, requires_approval, application_prompt, featured, expedition_members(count)")
      .order("date_start", { ascending: true })
      .limit(50),
    supabase
      .from("stories")
      .select("id, author_handle, type, title, excerpt, created_at, featured")
      .eq("published", false)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("stories")
      .select("id, author_handle, type, title, status, created_at, featured")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
    supabase
      .from("expedition_gallery")
      .select("id, expedition_id, uploader_handle, image_url, caption, status, created_at, expeditions(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    background: "#1a1a1a",
    border: "1px solid rgba(74,59,42,0.35)",
  };

  const rowStyle: React.CSSProperties = {
    borderBottom: "1px solid rgba(74,59,42,0.2)",
  };

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <p
            className="font-body font-semibold text-chaos-orange uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.14em", marginBottom: "8px" }}
          >
            ADMIN
          </p>
          <h1
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
          >
            CONTROL PANEL
          </h1>
        </div>

        {/* Section nav */}
        <nav style={{ position: "sticky", top: "64px", zIndex: 10, background: "#111111", borderBottom: "1px solid rgba(74,59,42,0.3)", marginBottom: "32px", overflowX: "auto", whiteSpace: "nowrap", padding: "10px 0" }}>
          {[
            { id: "gallery-section", label: "GALLERY" },
            { id: "stories-section", label: "STORIES" },
            { id: "expeditions-section", label: "EXPEDITIONS" },
            { id: "users-section", label: "USERS" },
            { id: "proposals-section", label: "PROPOSALS" },
            { id: "activities-section", label: "ACTIVITIES" },
            { id: "reminders-section", label: "REMINDERS" },
          ].map(({ id, label }) => (
            <a key={id} href={`#${id}`} className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-150"
              style={{ fontSize: "0.58rem", letterSpacing: "0.12em", padding: "4px 16px", textDecoration: "none", display: "inline-block" }}>
              {label}
            </a>
          ))}
        </nav>

        {/* Gallery pending */}
        <Section id="gallery-section" title={`GALLERY PENDING (${pendingGallery?.length ?? 0})`}>
          {!pendingGallery?.length ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>No photos awaiting review.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {pendingGallery.map((p) => {
                const trip = Array.isArray(p.expeditions) ? p.expeditions[0] : p.expeditions as { name: string } | null;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start",
                      background: "#1a1a1a",
                      border: "1px solid rgba(74,59,42,0.35)",
                      padding: "12px",
                    }}
                  >
                    <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0, overflow: "hidden" }}>
                      <Image src={p.image_url} alt={p.caption ?? ""} fill sizes="80px" className="object-cover" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="font-body font-semibold text-off-white" style={{ fontSize: "0.75rem", marginBottom: "2px" }}>
                        @{p.uploader_handle}
                      </p>
                      <p className="font-body text-neon-green" style={{ fontSize: "0.65rem", letterSpacing: "0.04em", marginBottom: "4px" }}>
                        {trip?.name ?? "—"}
                      </p>
                      {p.caption && (
                        <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", lineHeight: 1.4, marginBottom: "8px" }}>
                          {p.caption}
                        </p>
                      )}
                      <GalleryModerationActions id={p.id} initialStatus={p.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Stories pending review */}
        <Section id="stories-section" title={`STORIES PENDING (${pendingStories?.length ?? 0})`}>
          {!pendingStories?.length ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>No stories awaiting review.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead style={{ borderBottom: "1px solid rgba(74,59,42,0.4)" }}>
                  <tr>
                    <TH>Title</TH>
                    <TH>Author</TH>
                    <TH>Type</TH>
                    <TH>Date</TH>
                    <TH>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {pendingStories.map((s) => (
                    <tr key={s.id} style={rowStyle}>
                      <Cell>
                        <Link
                          href={`/stories/${s.id}/edit`}
                          className="hover:text-neon-green transition-colors duration-150"
                        >
                          {s.title}
                        </Link>
                        {s.excerpt && (
                          <span className="font-body text-muted-ink block" style={{ fontSize: "0.72rem", marginTop: "2px" }}>
                            {s.excerpt.length > 70 ? s.excerpt.slice(0, 70) + "…" : s.excerpt}
                          </span>
                        )}
                      </Cell>
                      <Cell muted>{s.author_handle}</Cell>
                      <Cell muted>{s.type}</Cell>
                      <Cell muted>
                        {new Date(s.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                      </Cell>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <StoryModerationActions id={s.id} initialFeatured={(s as { featured?: boolean }).featured ?? false} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Chaos moderation */}
        <Section title={`CHAOS WALL (${chaos?.length ?? 0})`}>
          {!chaos?.length ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>No submissions.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead style={{ borderBottom: "1px solid rgba(74,59,42,0.4)" }}>
                  <tr>
                    <TH>Image</TH>
                    <TH>Author</TH>
                    <TH>Type</TH>
                    <TH>Caption</TH>
                    <TH>Date</TH>
                    <TH>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {chaos.map((c) => (
                    <tr key={c.id} style={rowStyle}>
                      <Cell>
                        {c.image_url ? (
                          <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                            <Image
                              src={c.image_url}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                              style={{ filter: "grayscale(20%)" }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{ width: 48, height: 48, background: "rgba(74,59,42,0.3)" }}
                          />
                        )}
                      </Cell>
                      <Cell>@{c.author_handle}</Cell>
                      <Cell muted>{c.type}</Cell>
                      <Cell muted>
                        {c.caption
                          ? c.caption.length > 60
                            ? c.caption.slice(0, 60) + "…"
                            : c.caption
                          : "—"}
                      </Cell>
                      <Cell muted>
                        {new Date(c.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                      </Cell>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <ChaosActions id={c.id} initialStatus={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* All stories */}
        <Section title={`ALL STORIES (${allStories?.length ?? 0})`}>
          {!allStories?.length ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>No stories yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead style={{ borderBottom: "1px solid rgba(74,59,42,0.4)" }}>
                  <tr>
                    <TH>Title</TH>
                    <TH>Author</TH>
                    <TH>Type</TH>
                    <TH>Status</TH>
                    <TH>Date</TH>
                    <TH>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {allStories.map((s) => {
                    const badge =
                      s.status === "published"
                        ? { bg: "#9BFF3C", fg: "#111111" }
                        : s.status === "pending"
                        ? { bg: "#FF6B1A", fg: "#111111" }
                        : { bg: "rgba(74,59,42,0.4)", fg: "#8B7355" };
                    return (
                      <tr key={s.id} style={rowStyle}>
                        <Cell>
                          <Link
                            href={s.status === "published" ? `/stories/${s.id}` : `/stories/${s.id}/edit`}
                            className="hover:text-neon-green transition-colors duration-150"
                          >
                            {s.title}
                          </Link>
                        </Cell>
                        <Cell muted>{s.author_handle}</Cell>
                        <Cell muted>{s.type}</Cell>
                        <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <span
                            className="font-body font-semibold"
                            style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "3px 8px", background: badge.bg, color: badge.fg, textTransform: "uppercase" }}
                          >
                            {s.status}
                          </span>
                        </td>
                        <Cell muted>
                          {new Date(s.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                        </Cell>
                        <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <StoryModerationActions id={s.id} initialFeatured={(s as { featured?: boolean }).featured ?? false} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Export */}
        <Section title="EXPORT DATA">
          <AdminExportButtons />
        </Section>

        {/* Newsletter */}
        <Section title={`NEWSLETTER (${subscriberCount ?? 0} subscribers)`}>
          <NewsletterForm subscriberCount={subscriberCount ?? 0} />
        </Section>

        {/* Reminders */}
        <Section id="reminders-section" title="TRIP REMINDERS">
          <AdminRemindersButton />
        </Section>

        {/* Content Reports */}
        <Section id="proposals-section" title="PROPOSALS">
          <AdminProposalsSection />
        </Section>

        <Section title="CONTENT REPORTS">
          <AdminReportsSection />
        </Section>

        {/* Activity Categories */}
        <Section id="activities-section" title="ACTIVITY CATEGORIES">
          <AdminActivitiesSection />
        </Section>

        {/* Users */}
        <Section id="users-section" title="USERS">
          <AdminUsersSection />
        </Section>

        {/* Expeditions */}
        <Section id="expeditions-section" title={`EXPEDITIONS (${expeditions?.length ?? 0})`}>
          <div style={{ marginBottom: "20px" }}>
            <AdminAutoStatusButton />
          </div>
          <AdminExpeditionForm />
          {!expeditions?.length ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>No expeditions.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead style={{ borderBottom: "1px solid rgba(74,59,42,0.4)" }}>
                  <tr>
                    <TH>Name</TH>
                    <TH>Location</TH>
                    <TH>Difficulty</TH>
                    <TH>Date</TH>
                    <TH>Members</TH>
                    <TH>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {expeditions.map((e) => {
                    const count = (e.expedition_members as { count: number }[])[0]?.count ?? 0;
                    return (
                      <tr key={e.id} style={rowStyle}>
                        <Cell>
                          <Link
                            href={`/expeditions/${e.id}`}
                            className="hover:text-neon-green transition-colors duration-150"
                          >
                            {e.name}
                          </Link>
                        </Cell>
                        <Cell muted>{e.location}</Cell>
                        <Cell muted>{e.difficulty}</Cell>
                        <Cell muted>
                          {new Date(e.date_start).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                        </Cell>
                        <Cell muted>
                          {count} / {e.quota_max}
                        </Cell>
                        <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <ExpeditionActions expedition={e as Parameters<typeof ExpeditionActions>[0]["expedition"]} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}
