import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { resolveSlugOrRedirect } from "@/lib/resolve";
import { absoluteUrl, buildEntityMetadata } from "@/lib/seo";
import { destBasePath, mergeScored } from "@/lib/related";
import type { DestKind } from "@/components/DestinationPage";
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
import MemberManagement from "@/components/MemberManagement";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

type Params = Promise<{ slug: string }>;

type Expedition = {
  id: string;
  slug: string;
  name: string;
  location: string;
  difficulty: string;
  image_url: string | null;
  description: string | null;
  date_start: string;
  date_end: string;
  status: string;
  quota_max: number;
  price: string;
  leader_id: string;
  application_prompt: string | null;
  requires_approval: boolean;
  activity_category: string;
  destination_id: string | null;
  refund_policy: string | null;
  cancellation_policy: string | null;
  profiles: { username: string; avatar_url: string | null } | { username: string; avatar_url: string | null }[] | null;
};

type SimilarExpedition = {
  id: string;
  slug: string;
  name: string;
  location: string;
  date_start: string;
  status: string;
  difficulty: string;
};

type TripStory = {
  id: string;
  slug: string;
  title: string;
  image_url: string | null;
  author_handle: string;
  created_at: string;
};

const getExpedition = cache(async (param: string) => {
  const supabase = await createClient();
  return resolveSlugOrRedirect<Expedition>({
    supabase,
    table: "expeditions",
    entityType: "expedition",
    param,
    basePath: "/expeditions",
    select: "*, application_prompt, requires_approval, profiles!leader_id(username, avatar_url)",
  });
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getExpedition(slug);
  const desc = `${trip.difficulty} expedition to ${trip.location}. Join the crew.`;
  return buildEntityMetadata({
    title: `${trip.name} — VAKANSISME`,
    description: desc,
    path: `/expeditions/${trip.slug}`,
    image: trip.image_url,
    type: "website",
  });
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function ExpeditionPage({ params }: { params: Params }) {
  const { slug } = await params;
  const trip = await getExpedition(slug);
  const id = trip.id;
  const supabase = await createClient();
  const locale = await getLocale();

  const { data: { user } } = await supabase.auth.getUser();

  const priceAmount = parseInt(((trip as { price?: string }).price ?? "").replace(/\D/g, ""), 10) || 0;
  const tripLeaderId = (trip as { leader_id?: string }).leader_id;
  const acceptedPaymentMethods = ((trip as Record<string, unknown>).accepted_payment_methods as string[]) ?? ["bank_transfer", "qris"];

  const similarSelect = "id, slug, name, location, date_start, status, difficulty";
  const storySelect = "id, slug, title, image_url, author_handle, created_at";

  const [
    { count: memberCount },
    { data: members }, { data: gallery }, { data: membership }, { data: comments },
    { data: waitlistRow }, { count: waitlistCount }, { data: updates }, { data: packingItems },
    { data: userChecks }, { data: reviews }, { data: bookmarkRow },
    { data: sameDestExp }, { data: sameActivityExp }, { data: sameLocationExp },
    { data: tripStories }, { data: destStories }, { data: destRow },
    { data: paidRow }, { data: callerProfile },
  ] = await Promise.all([
    supabase.from("expedition_members").select("*", { count: "exact", head: true }).eq("expedition_id", id).eq("status", "approved"),
    supabase.from("expedition_members").select("user_id, status, profiles(username, avatar_url)").eq("expedition_id", id).neq("status", "rejected").limit(30),
    supabase.from("expedition_gallery").select("id, uploader_id, uploader_handle, image_url, caption, created_at").eq("expedition_id", id).order("created_at", { ascending: true }).limit(50),
    user
      ? supabase.from("expedition_members").select("id, user_id, status, payment_due_at, expires_at").eq("expedition_id", id).eq("user_id", user.id).maybeSingle()
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
    trip.destination_id
      ? supabase.from("expeditions").select(similarSelect).eq("destination_id", trip.destination_id).neq("id", id).in("status", ["upcoming", "ongoing"]).order("date_start", { ascending: true }).limit(6)
      : Promise.resolve({ data: null }),
    trip.activity_category
      ? supabase.from("expeditions").select(similarSelect).eq("activity_category", trip.activity_category).neq("id", id).in("status", ["upcoming", "ongoing"]).order("date_start", { ascending: true }).limit(6)
      : Promise.resolve({ data: null }),
    supabase.from("expeditions").select(similarSelect).neq("id", id).ilike("location", `%${trip.location.split(",")[0].trim()}%`).in("status", ["upcoming", "ongoing"]).limit(6),
    supabase.from("stories").select(storySelect).eq("published", true).eq("expedition_id", id).order("created_at", { ascending: false }).limit(6),
    trip.destination_id
      ? supabase.from("stories").select(storySelect).eq("published", true).eq("destination_id", trip.destination_id).order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: null }),
    trip.destination_id
      ? supabase.from("destinations").select("kind, name, slug").eq("id", trip.destination_id).maybeSingle()
      : Promise.resolve({ data: null }),
    user && priceAmount > 0
      ? supabase.from("expedition_payments").select("status, payment_status").eq("user_id", user.id).eq("expedition_id", id).in("payment_status", ["paid"]).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from("profiles").select("username, is_admin").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  // Activity name -> slug lookup: activities.slug is immutable, so a renamed category
  // (e.g. "Hiking" -> "Trekking") no longer matches its old slug. Look up by current name.
  const { data: activityRow } = trip.activity_category
    ? await supabase.from("activities").select("slug").eq("name", trip.activity_category).maybeSingle()
    : { data: null };

  const similar = mergeScored<SimilarExpedition>(
    { rows: (sameDestExp as SimilarExpedition[] | null) ?? [], weight: 3 },
    { rows: (sameActivityExp as SimilarExpedition[] | null) ?? [], weight: 2 },
    { rows: (sameLocationExp as SimilarExpedition[] | null) ?? [], weight: 1 },
  ).slice(0, 6);

  const tripStoriesMerged = mergeScored<TripStory>(
    { rows: (tripStories as TripStory[] | null) ?? [], weight: 1 },
    { rows: (destStories as TripStory[] | null) ?? [], weight: 1 },
  ).slice(0, 4);

  const destination = destRow as { kind: DestKind; name: string; slug: string } | null;

  const isPaid = !!paidRow;

  const membershipRow = membership as { id?: string; status?: string; payment_due_at?: string | null; expires_at?: string | null } | null;
  const membershipStatus = membershipRow?.status;
  const userJoined = membershipStatus === "approved";
  const userPending = membershipStatus === "pending";
  const userPendingPayment = membershipStatus === "pending_payment";
  const paymentDueAt = membershipRow?.payment_due_at ?? null;
  const bookingId = membershipRow?.id ?? null;
  const onWaitlist = !!waitlistRow;

  // Leader sees pending members for approval
  const approvedMembers = (members ?? []).filter((m) => (m as { status?: string }).status !== "pending");
  const pendingMembers = (members ?? []).filter((m) => (m as { status?: string }).status === "pending");
  const isBookmarked = !!bookmarkRow;
  const isActualLeader = user?.id === tripLeaderId;
  const isLeader = !!(callerProfile && (isActualLeader || callerProfile.is_admin));

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
    url: absoluteUrl(`/expeditions/${trip.slug}`),
    organizer: { "@type": "Organization", name: "Vakansisme", url: absoluteUrl("") },
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
      { "@type": "ListItem", position: 1, name: "Vakansisme", item: absoluteUrl("") },
      { "@type": "ListItem", position: 2, name: "Expeditions", item: absoluteUrl("/expeditions") },
      { "@type": "ListItem", position: 3, name: trip.name, item: absoluteUrl(`/expeditions/${trip.slug}`) },
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
              {trip.activity_category && (
                activityRow?.slug ? (
                  <Link
                    href={`/categories/${activityRow.slug}`}
                    className="font-body font-semibold inline-block hover:text-neon-green transition-colors duration-150"
                    style={{ fontSize: "0.65rem", letterSpacing: "0.1em", padding: "4px 10px", border: "1px solid rgba(74,59,42,0.5)", color: "#8B7355" }}
                  >
                    {trip.activity_category.toUpperCase()}
                  </Link>
                ) : (
                  <span
                    className="font-body font-semibold inline-block"
                    style={{ fontSize: "0.65rem", letterSpacing: "0.1em", padding: "4px 10px", border: "1px solid rgba(74,59,42,0.5)", color: "#8B7355" }}
                  >
                    {trip.activity_category.toUpperCase()}
                  </span>
                )
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
              {destination && (
                <>
                  {" · "}
                  <Link
                    href={`${destBasePath(destination.kind)}/${destination.slug}`}
                    className="font-body font-semibold hover:text-neon-green transition-colors duration-150"
                    style={{ color: "#8B7355" }}
                  >
                    📍 {destination.name}
                  </Link>
                </>
              )}
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
              <ShareButtons title={trip.name} url={absoluteUrl(`/expeditions/${trip.slug}`)} />
              <BookmarkButton
                expeditionId={id}
                initialBookmarked={isBookmarked}
                currentUserId={user?.id ?? null}
              />
            </div>

            {/* Join / Pay */}
            <div style={{ marginBottom: "48px" }}>
              {priceAmount > 0 && userPendingPayment && !isActualLeader ? (
                <>
                  <PayButton
                    bookingId={bookingId ?? undefined}
                    expeditionId={trip.id}
                    priceAmount={priceAmount}
                    currentUserId={user?.id ?? null}
                    alreadyPaid={isPaid}
                    paymentDueAt={paymentDueAt}
                    acceptedPaymentMethods={acceptedPaymentMethods}
                  />
                  <CancelReservationButton tripId={trip.id} />
                </>
              ) : !isActualLeader ? (
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
                  alreadyPaid={isPaid}
                  locale={locale}
                  isLeader={isActualLeader}
                />
              ) : null}
            </div>

            {/* Members */}
            {isLeader && (
              <div style={{ marginBottom: "14px" }}>
                <a
                  href={`/api/expeditions/${id}/export`}
                  download
                  className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-150"
                  style={{ fontSize: "0.58rem", letterSpacing: "0.1em", border: "1px solid rgba(74,59,42,0.4)", padding: "4px 10px", textDecoration: "none" }}
                >
                  {t(locale, "export_csv")}
                </a>
              </div>
            )}
            {isLeader ? (
              <MemberManagement
                expeditionId={id}
                currentUserId={user?.id ?? null}
                initialPending={pendingMembers.map((m) => ({
                  user_id: m.user_id,
                  profiles: Array.isArray(m.profiles) ? m.profiles[0] ?? null : m.profiles as { username: string } | null,
                }))}
                initialApproved={approvedMembers.map((m) => ({
                  user_id: m.user_id,
                  profiles: Array.isArray(m.profiles) ? m.profiles[0] ?? null : m.profiles as { username: string; avatar_url: string | null } | null,
                }))}
                locale={locale}
              />
            ) : approvedMembers.length > 0 ? (
              <div>
                <p
                  className="font-body font-semibold text-muted-ink uppercase"
                  style={{ fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "14px" }}
                >
                  {t(locale, "crew")} ({memberCount ?? 0})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {approvedMembers.map((m) => {
                    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles as { username: string; avatar_url: string | null } | null;
                    if (!profile) return null;
                    return (
                      <Link
                        key={m.user_id}
                        href={`/u/${profile.username}`}
                        className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                        style={{ fontSize: "0.72rem", letterSpacing: "0.06em", padding: "6px 12px", border: "1px solid rgba(74,59,42,0.4)", background: "#1a1a1a" }}
                      >
                        @{profile.username}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
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
            {(trip as Expedition).cancellation_policy && (
              <div>
                <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "4px" }}>CANCELLATION POLICY</p>
                <p className="font-body text-off-white" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>{(trip as Expedition).cancellation_policy}</p>
              </div>
            )}
            {(trip as Expedition).refund_policy && (
              <div>
                <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "4px" }}>REFUND</p>
                <p className="font-body text-off-white" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>{(trip as Expedition).refund_policy}</p>
              </div>
            )}
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
                  href={`/expeditions/${s.slug}`}
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

        {tripStoriesMerged.length > 0 && (
          <section style={{ marginTop: "64px", paddingTop: "40px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
            <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              STORIES FROM THIS TRIP
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tripStoriesMerged.map((s) => (
                <Link
                  key={s.id}
                  href={`/stories/${s.slug}`}
                  className="group"
                  style={{ display: "flex", gap: "14px", alignItems: "center", padding: "12px 14px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)" }}
                >
                  {s.image_url && (
                    <div className="relative flex-shrink-0" style={{ width: "56px", height: "40px" }}>
                      <Image src={s.image_url} alt={s.title} fill sizes="56px" className="object-cover" style={{ filter: "grayscale(20%)" }} />
                    </div>
                  )}
                  <div>
                    <p className="font-display font-bold uppercase text-off-white group-hover:text-neon-green transition-colors duration-150" style={{ fontSize: "0.85rem", letterSpacing: "-0.01em" }}>
                      {s.title}
                    </p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", marginTop: "2px" }}>
                      {s.author_handle}
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
