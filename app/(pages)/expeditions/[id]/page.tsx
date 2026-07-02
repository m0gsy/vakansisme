import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JoinButton from "@/components/JoinButton";
import RealtimeQuota from "@/components/RealtimeQuota";
import { difficultyLabel, getDifficulty } from "@/lib/difficulty";
import ExpeditionGallery from "@/components/ExpeditionGallery";
import ExpeditionComments from "@/components/ExpeditionComments";
import ExpeditionUpdates from "@/components/ExpeditionUpdates";
import ShareButtons from "@/components/ShareButtons";
import BookmarkButton from "@/components/BookmarkButton";
import PackingList from "@/components/PackingList";
import ExpeditionReviews from "@/components/ExpeditionReviews";
import ExpeditionMapClient from "@/components/ExpeditionMapClient";
import PayButton from "@/components/PayButton";
import CancelReservationButton from "@/components/CancelReservationButton";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("expeditions")
    .select("name, location, difficulty, image_url")
    .eq("id", id)
    .single();
  if (!data) return { title: "Expedition — VAKANSISME" };
  const desc = `${data.difficulty} expedition to ${data.location}. Join the crew.`;
  return {
    title: `${data.name} — VAKANSISME`,
    description: desc,
    openGraph: {
      title: data.name,
      description: desc,
      type: "website",
      ...(data.image_url ? { images: [{ url: data.image_url, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: data.name,
      description: desc,
      ...(data.image_url ? { images: [data.image_url] } : {}),
    },
  };
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function ExpeditionPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const locale = await getLocale();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from("expeditions")
    .select("*, application_prompt, requires_approval, profiles!leader_id(username, avatar_url)")
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const priceAmount = parseInt(((trip as { price?: string }).price ?? "").replace(/\D/g, ""), 10) || 0;
  const tripLeaderId = (trip as { leader_id?: string }).leader_id;

  const [
    { count: memberCount },
    { data: members }, { data: gallery }, { data: membership }, { data: comments },
    { data: waitlistRow }, { count: waitlistCount }, { data: updates }, { data: packingItems },
    { data: userChecks }, { data: reviews }, { data: bookmarkRow },
    { data: similar }, { data: paidRow }, { data: callerProfile },
  ] = await Promise.all([
    supabase.from("expedition_members").select("*", { count: "exact", head: true }).eq("expedition_id", id).eq("status", "approved"),
    supabase.from("expedition_members").select("user_id, status, profiles(username, avatar_url)").eq("expedition_id", id).neq("status", "rejected").limit(30),
    supabase.from("expedition_gallery").select("id, uploader_id, uploader_handle, image_url, caption, created_at").eq("expedition_id", id).order("created_at", { ascending: true }).limit(50),
    user
      ? supabase.from("expedition_members").select("user_id, status, payment_due_at").eq("expedition_id", id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("expedition_comments").select("id, author_id, author_handle, content, created_at").eq("expedition_id", id).order("created_at", { ascending: true }).limit(100),
    user
      ? supabase.from("expedition_waitlist").select("user_id").eq("expedition_id", id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("expedition_waitlist").select("*", { count: "exact", head: true }).eq("expedition_id", id),
    supabase.from("expedition_updates").select("id, author_id, content, created_at, profiles(username)").eq("expedition_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("expedition_packing_items").select("id, label, category, quantity").eq("expedition_id", id).order("created_at", { ascending: true }).limit(200),
    user ? supabase.from("packing_checks").select("item_id").eq("user_id", user.id) : Promise.resolve({ data: null }),
    supabase.from("expedition_reviews").select("id, reviewer_id, rating, content, created_at, profiles(username, avatar_url)").eq("expedition_id", id).order("created_at", { ascending: false }).limit(50),
    user
      ? supabase.from("bookmarks").select("user_id").eq("expedition_id", id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("expeditions").select("id, name, location, date_start, status, difficulty").neq("id", id).ilike("location", `%${trip.location.split(",")[0].trim()}%`).limit(3),
    user && priceAmount > 0
      ? supabase.from("expedition_payments").select("status").eq("user_id", user.id).eq("expedition_id", id).eq("status", "paid").maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from("profiles").select("username, is_admin").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const isPaid = !!paidRow;

  const membershipRow = membership as { status?: string; payment_due_at?: string | null } | null;
  const membershipStatus = membershipRow?.status;
  const userJoined = membershipStatus === "approved";
  const userPending = membershipStatus === "pending";
  const userPendingPayment = membershipStatus === "pending_payment";
  const paymentDueAt = membershipRow?.payment_due_at ?? null;
  const onWaitlist = !!waitlistRow;

  // Leader sees pending members for approval
  const approvedMembers = (members ?? []).filter((m) => (m as { status?: string }).status !== "pending");
  const pendingMembers = (members ?? []).filter((m) => (m as { status?: string }).status === "pending");
  const isBookmarked = !!bookmarkRow;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vakansisme.club";
  const isLeader = !!(callerProfile && (user?.id === tripLeaderId || callerProfile.is_admin));

  const days = daysUntil(trip.date_start);
  const dateStr = new Date(trip.date_start).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
  const dateEndStr = new Date(trip.date_end).toLocaleDateString("en", { day: "numeric", month: "long" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: trip.name,
    description: trip.description ?? undefined,
    startDate: trip.date_start,
    endDate: trip.date_end,
    location: { "@type": "Place", name: trip.location },
    ...(trip.image_url ? { image: trip.image_url } : {}),
    url: `${siteUrl}/expeditions/${id}`,
    organizer: { "@type": "Organization", name: "Vakansisme", url: siteUrl },
    eventStatus: trip.status === "cancelled"
      ? "https://schema.org/EventCancelled"
      : trip.status === "ongoing" || trip.status === "completed"
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventScheduled",
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Vakansisme", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Expeditions", item: `${siteUrl}/expeditions` },
      { "@type": "ListItem", position: 3, name: trip.name, item: `${siteUrl}/expeditions/${id}` },
    ],
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {/* Hero */}
      <div
        className="relative w-full"
        style={{
          height: "clamp(300px, 50vw, 560px)",
          background: trip.image_url ? undefined : "repeating-linear-gradient(135deg, #1a1a1a 0px, #1a1a1a 20px, #111111 20px, #111111 40px)",
        }}
      >
        {trip.image_url && (
          <Image
            src={trip.image_url}
            alt={trip.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ filter: "grayscale(15%) brightness(0.65)" }}
          />
        )}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(17,17,17,0.3) 0%, rgba(17,17,17,1) 100%)",
          }}
        />
        {/* Countdown badge */}
        {days > 0 && (
          <div
            className="absolute top-6 right-6"
            style={{ background: "#9BFF3C", padding: "10px 18px", textAlign: "center" }}
          >
            <p className="font-display font-black text-charcoal" style={{ fontSize: "2rem", lineHeight: 1 }}>
              {days}
            </p>
            <p className="font-body font-semibold text-charcoal uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}>
              {t(locale, "days_left")}
            </p>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6" style={{ paddingTop: "40px", paddingBottom: "80px" }}>
        <Link
          href="/expeditions"
          className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-8"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
        >
          {t(locale, "back_to_expeditions")}
        </Link>

        <div style={{ display: "flex", gap: "56px", flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Main info */}
          <div style={{ flex: "2 1 320px" }}>
            {/* Status + Difficulty tags */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
              <span
                className="font-body font-semibold text-charcoal bg-neon-green inline-block"
                style={{ fontSize: "0.65rem", letterSpacing: "0.1em", padding: "4px 10px" }}
              >
                {difficultyLabel(trip.difficulty)}
              </span>
              {trip.status && trip.status !== "upcoming" && (
                <span
                  className="font-body font-semibold inline-block"
                  style={{
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                    padding: "4px 10px",
                    background: trip.status === "ongoing" ? "#FF6B1A" : trip.status === "completed" ? "#4A3B2A" : "#7A2E12",
                    color: "#F0EDEA",
                  }}
                >
                  {(trip.status as string).toUpperCase()}
                </span>
              )}
            </div>

            <h1
              className="font-display font-black uppercase text-off-white"
              style={{
                fontSize: "clamp(2rem, 6vw, 4rem)",
                letterSpacing: "-0.025em",
                lineHeight: 0.88,
                marginBottom: "24px",
                textWrap: "balance",
              }}
            >
              {trip.name}
            </h1>

            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem", marginBottom: trip.description ? "24px" : "40px" }}>
              {trip.location}
            </p>

            {/* Description */}
            {trip.description && (
              <p
                className="font-story text-off-white/80"
                style={{ fontSize: "1rem", lineHeight: 1.75, marginBottom: "32px", whiteSpace: "pre-wrap", maxWidth: "62ch" }}
              >
                {trip.description}
              </p>
            )}

            {/* Difficulty meaning */}
            {getDifficulty(trip.difficulty) && (
              <div
                style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "16px 20px", marginBottom: "40px" }}
              >
                <p
                  className="font-body font-semibold uppercase"
                  style={{ fontSize: "0.6rem", letterSpacing: "0.14em", color: "#9BFF3C", marginBottom: "6px" }}
                >
                  {difficultyLabel(trip.difficulty)} · Level {getDifficulty(trip.difficulty)!.level} of 7
                </p>
                <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem", lineHeight: 1.6 }}>
                  {getDifficulty(trip.difficulty)!.desc}
                </p>
              </div>
            )}

            {/* Share + Bookmark */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "20px" }}>
              <ShareButtons title={trip.name} url={`${siteUrl}/expeditions/${id}`} />
              <BookmarkButton
                expeditionId={id}
                initialBookmarked={isBookmarked}
                currentUserId={user?.id ?? null}
              />
            </div>

            {/* Join / Pay */}
            <div style={{ marginBottom: "48px" }}>
              {priceAmount > 0 && userPendingPayment && !isLeader ? (
                <>
                  <PayButton
                    expeditionId={trip.id}
                    priceAmount={priceAmount}
                    currentUserId={user?.id ?? null}
                    alreadyPaid={isPaid}
                    paymentDueAt={paymentDueAt}
                  />
                  <CancelReservationButton tripId={trip.id} />
                </>
              ) : !isLeader ? (
                <JoinButton
                  tripId={trip.id}
                  initialCount={memberCount ?? 0}
                  quotaMax={trip.quota_max}
                  currentUserId={user?.id ?? null}
                  initialJoined={userJoined}
                  initialOnWaitlist={onWaitlist}
                  initialWaitlistCount={waitlistCount ?? 0}
                  tripStatus={trip.status}
                  applicationPrompt={trip.application_prompt ?? null}
                  initialPending={userPending}
                  locale={locale}
                  isLeader={isLeader}
                />
              ) : null}
            </div>

            {/* Members */}
            {/* Pending members — leader only */}
            {isLeader && pendingMembers.length > 0 && (
              <div style={{ marginBottom: "32px", padding: "16px 20px", background: "#1a1a1a", border: "1px solid rgba(155,255,60,0.2)" }}>
                <p className="font-body font-semibold text-neon-green uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "12px" }}>
                  {t(locale, "pending_members")} ({pendingMembers.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {pendingMembers.map((m) => {
                    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles as { username: string } | null;
                    if (!profile) return null;
                    return (
                      <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span className="font-body font-semibold text-off-white" style={{ fontSize: "0.78rem", letterSpacing: "0.04em", flex: 1 }}>
                          @{profile.username}
                        </span>
                        <button
                          onClick={async () => {
                            await fetch(`/api/expeditions/${id}/members/${m.user_id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve" }) });
                            window.location.reload();
                          }}
                          className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
                          style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "5px 12px", border: "none", cursor: "pointer" }}
                        >
                          {t(locale, "approve")}
                        </button>
                        <button
                          onClick={async () => {
                            await fetch(`/api/expeditions/${id}/members/${m.user_id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject" }) });
                            window.location.reload();
                          }}
                          className="font-body font-semibold text-off-white hover:text-chaos-orange transition-colors duration-150"
                          style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "5px 12px", border: "1px solid rgba(255,107,26,0.4)", background: "transparent", cursor: "pointer" }}
                        >
                          {t(locale, "reject")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!!approvedMembers.length && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px", flexWrap: "wrap" }}>
                  <p
                    className="font-body font-semibold text-muted-ink uppercase"
                    style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
                  >
                    {t(locale, "crew")} ({memberCount ?? 0})
                  </p>
                  {isLeader && (
                    <a
                      href={`/api/expeditions/${id}/export`}
                      download
                      className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-150"
                      style={{ fontSize: "0.58rem", letterSpacing: "0.1em", border: "1px solid rgba(74,59,42,0.4)", padding: "4px 10px", textDecoration: "none" }}
                    >
                      {t(locale, "export_csv")}
                    </a>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {approvedMembers.map((m) => {
                    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles as { username: string; avatar_url: string | null } | null;
                    if (!profile) return null;
                    return (
                      <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Link
                          href={`/u/${profile.username}`}
                          className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                          style={{ fontSize: "0.72rem", letterSpacing: "0.06em", padding: "6px 12px", border: "1px solid rgba(74,59,42,0.4)", background: "#1a1a1a" }}
                        >
                          @{profile.username}
                        </Link>
                        {isLeader && m.user_id !== user?.id && (
                          <form action={`/api/expeditions/${id}/members/${m.user_id}`} method="DELETE">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm(`Remove @${profile.username}?`)) return;
                                await fetch(`/api/expeditions/${id}/members/${m.user_id}`, { method: "DELETE" });
                                window.location.reload();
                              }}
                              className="font-body text-muted-ink hover:text-chaos-orange transition-colors duration-150"
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.6rem", padding: "4px 6px" }}
                              title="Remove member"
                            >
                              ✕
                            </button>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div
            style={{
              flex: "1 1 220px",
              background: "#1a1a1a",
              border: "1px solid rgba(74,59,42,0.35)",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {[
              { label: t(locale, "date"), value: `${dateStr} – ${dateEndStr}` },
              { label: t(locale, "price"), value: trip.price },
              { label: t(locale, "leader"), value: (() => { const lp = Array.isArray(trip.profiles) ? trip.profiles[0] : (trip.profiles as { username: string } | null); return lp?.username ? `@${lp.username}` : "—"; })() },
            ].map(({ label, value }) => (
              <div key={label}>
                <p
                  className="font-body font-semibold text-muted-ink uppercase"
                  style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "4px" }}
                >
                  {label}
                </p>
                <p className="font-body text-off-white" style={{ fontSize: "0.9rem" }}>
                  {value}
                </p>
              </div>
            ))}
            <RealtimeQuota
              expeditionId={trip.id}
              initialCount={memberCount ?? 0}
              quotaMax={trip.quota_max}
            />
            <div>
              <p
                className="font-body font-semibold text-muted-ink uppercase"
                style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "10px" }}
              >
                {t(locale, "location")}
              </p>
              <ExpeditionMapClient location={trip.location} />
            </div>
          </div>
        </div>
        <ExpeditionGallery
          expeditionId={id}
          initialPhotos={gallery ?? []}
          isMember={userJoined}
          isLeader={isLeader}
          currentUserId={user?.id ?? null}
          tripStatus={trip.status}
        />
        <ExpeditionUpdates
          expeditionId={id}
          initialUpdates={(updates ?? []) as Parameters<typeof ExpeditionUpdates>[0]["initialUpdates"]}
          currentUserId={user?.id ?? null}
          isLeader={isLeader}
        />
        <PackingList
          expeditionId={id}
          initialItems={(() => {
            const checkedSet = new Set((userChecks ?? []).map((c: { item_id: string }) => c.item_id));
            return (packingItems ?? []).map((i) => ({
              ...i,
              category: (i as { category?: string }).category ?? "general",
              quantity: (i as { quantity?: number }).quantity ?? 1,
              checked: checkedSet.has(i.id),
            }));
          })()}
          isLeader={isLeader}
          isMember={userJoined}
        />
        <ExpeditionReviews
          expeditionId={id}
          initialReviews={(reviews ?? []) as Parameters<typeof ExpeditionReviews>[0]["initialReviews"]}
          isMember={userJoined}
          currentUserId={user?.id ?? null}
          tripStatus={trip.status}
        />
        <ExpeditionComments
          expeditionId={id}
          initialComments={comments ?? []}
          currentUserId={user?.id ?? null}
        />

        {similar && similar.length > 0 && (
          <section style={{ marginTop: "64px", paddingTop: "40px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
            <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              {t(locale, "nearby")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {similar.map((s) => (
                <Link
                  key={s.id}
                  href={`/expeditions/${s.id}`}
                  className="group"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)" }}
                >
                  <div>
                    <p className="font-display font-bold uppercase text-off-white group-hover:text-neon-green transition-colors duration-150" style={{ fontSize: "0.9rem", letterSpacing: "-0.01em" }}>
                      {s.name}
                    </p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginTop: "2px" }}>{s.location}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {s.status && s.status !== "upcoming" && (
                      <span className="font-body font-semibold" style={{ fontSize: "0.58rem", letterSpacing: "0.08em", padding: "2px 7px", background: s.status === "ongoing" ? "#FF6B1A" : "#4A3B2A", color: "#F0EDEA" }}>
                        {(s.status as string).toUpperCase()}
                      </span>
                    )}
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.7rem", marginTop: "4px" }}>
                      {new Date(s.date_start).toLocaleDateString("en", { month: "short", year: "numeric" })}
                    </p>
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
