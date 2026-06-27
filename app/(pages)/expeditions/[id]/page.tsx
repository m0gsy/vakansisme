import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JoinButton from "@/components/JoinButton";
import RealtimeQuota from "@/components/RealtimeQuota";
import { difficultyLabel, getDifficulty } from "@/lib/difficulty";
import ExpeditionGallery from "@/components/ExpeditionGallery";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("expeditions")
    .select("name, location, difficulty")
    .eq("id", id)
    .single();
  if (!data) return { title: "Expedition — VAKANSISME" };
  return {
    title: `${data.name} — VAKANSISME`,
    description: `${data.difficulty} expedition to ${data.location}. Join the crew.`,
  };
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function ExpeditionPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from("expeditions")
    .select("*, expedition_members(count)")
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const memberCount = (trip.expedition_members as { count: number }[])[0]?.count ?? 0;

  const [{ data: members }, { data: gallery }, { data: membership }] = await Promise.all([
    supabase.from("expedition_members").select("user_id, profiles(username, avatar_url)").eq("expedition_id", id).limit(20),
    supabase.from("expedition_gallery").select("id, uploader_id, uploader_handle, image_url, caption, created_at").eq("expedition_id", id).order("created_at", { ascending: true }),
    user
      ? supabase.from("expedition_members").select("user_id").eq("expedition_id", id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const userJoined = !!membership;

  const days = daysUntil(trip.date_start);
  const dateStr = new Date(trip.date_start).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
  const dateEndStr = new Date(trip.date_end).toLocaleDateString("en", { day: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-charcoal">
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
              days left
            </p>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6" style={{ paddingTop: "40px", paddingBottom: "80px" }}>
        <Link
          href="/#expeditions"
          className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-8"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
        >
          ← EXPEDITIONS
        </Link>

        <div style={{ display: "flex", gap: "56px", flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Main info */}
          <div style={{ flex: "2 1 320px" }}>
            {/* Difficulty tag */}
            <span
              className="font-body font-semibold text-charcoal bg-neon-green inline-block"
              style={{ fontSize: "0.65rem", letterSpacing: "0.1em", padding: "4px 10px", marginBottom: "16px" }}
            >
              {difficultyLabel(trip.difficulty)}
            </span>

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

            {/* Join */}
            <div style={{ marginBottom: "48px" }}>
              <JoinButton
                tripId={trip.id}
                initialCount={memberCount}
                quotaMax={trip.quota_max}
                currentUserId={user?.id ?? null}
                initialJoined={userJoined}
              />
            </div>

            {/* Members */}
            {!!members?.length && (
              <div>
                <p
                  className="font-body font-semibold text-muted-ink uppercase"
                  style={{ fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "14px" }}
                >
                  Crew ({memberCount})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {members.map((m) => {
                    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles as { username: string; avatar_url: string | null } | null;
                    if (!profile) return null;
                    return (
                      <Link
                        key={m.user_id}
                        href={`/u/${profile.username}`}
                        className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                        style={{
                          fontSize: "0.72rem",
                          letterSpacing: "0.06em",
                          padding: "6px 12px",
                          border: "1px solid rgba(74,59,42,0.4)",
                          background: "#1a1a1a",
                        }}
                      >
                        @{profile.username}
                      </Link>
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
              { label: "DATE", value: `${dateStr} – ${dateEndStr}` },
              { label: "PRICE", value: trip.price },
              { label: "LEADER", value: trip.leader_handle },
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
              initialCount={memberCount}
              quotaMax={trip.quota_max}
            />
          </div>
        </div>
        <ExpeditionGallery
          expeditionId={id}
          initialPhotos={gallery ?? []}
          isMember={userJoined}
          currentUserId={user?.id ?? null}
        />
      </div>
    </div>
  );
}
