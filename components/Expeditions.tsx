"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Trip } from "@/types/expedition";
import { difficultyLabel } from "@/lib/difficulty";
import type { Locale } from "@/lib/i18n";
import { dict } from "@/lib/i18n";

const ease = [0.16, 1, 0.3, 1] as const;

function formatDate(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const mo = s.toLocaleString("en", { month: "short" });
  return `${s.getDate()}–${e.getDate()} ${mo} ${s.getFullYear()}`;
}

export default function Expeditions({ trips, joinedIds = [], locale = "id" }: { trips: Trip[]; joinedIds?: string[]; locale?: Locale }) {
  const router = useRouter();
  const d = dict[locale];
  const headerRef = useRef(null);
  const isInView = useInView(headerRef, { once: true, margin: "-80px" });
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(trips.map((t) => [t.id, t.member_count]))
  );
  const [joining, setJoining] = useState<string | null>(null);
  const [joined, setJoined] = useState<Set<string>>(new Set(joinedIds));

  async function handleJoin(tripId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    setJoining(tripId);
    const res = await fetch(`/api/expeditions/${tripId}/join`, { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      setJoined((prev) => new Set([...prev, tripId]));
      setCounts((prev) => ({ ...prev, [tripId]: json.member_count }));
    }
    setJoining(null);
  }

  return (
    <section id="expeditions" className="bg-charcoal" style={{ paddingBlock: "96px 80px" }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-12" ref={headerRef}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease }}
          style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}
        >
          <div>
            <h2
              className="font-display font-black uppercase text-off-white"
              style={{
                fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
                letterSpacing: "-0.025em",
                lineHeight: 0.88,
              }}
            >
              {d.page_expeditions}
            </h2>
            <p
              className="font-body text-muted-ink mt-3"
              style={{ fontSize: "0.9rem", maxWidth: "44ch" }}
            >
              {d.expedition_subtitle}
            </p>
          </div>
          <Link
            href="/expeditions"
            className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-200"
            style={{ fontSize: "0.7rem", letterSpacing: "0.12em" }}
          >
            {d.see_all_expeditions}
          </Link>
        </motion.div>
      </div>

      {/* Card strip — horizontal scroll on mobile, 3-col on desktop */}
      <div
        className="max-w-7xl mx-auto px-6"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {trips.map((trip, i) => (
          <motion.article
            key={trip.id}
            initial={{ opacity: 0, y: 48 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1 + i * 0.12, ease }}
            className="group cursor-pointer"
            style={{ background: "#1F3B2C", border: "1px solid rgba(74,59,42,0.4)", position: "relative" }}
          >
            <Link href={`/expeditions/${trip.slug}`} className="absolute inset-0 z-10" aria-label={`View ${trip.name}`} />
            {/* Photo */}
            <div className="relative overflow-hidden" style={{ height: "220px" }}>
              <Image
                src={trip.image_url}
                alt={`Trip: ${trip.name}`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ filter: "grayscale(15%)" }}
              />
              {/* Photo grain */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
                  backgroundSize: "180px 180px",
                  opacity: 0.1,
                }}
              />
              {/* Gradient */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(31,59,44,0.7) 0%, transparent 50%)",
                }}
              />
              {/* Difficulty tag */}
              <div className="absolute bottom-3 left-3" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span
                  className="font-body font-semibold text-charcoal bg-neon-green"
                  style={{ fontSize: "0.65rem", letterSpacing: "0.08em", padding: "3px 8px" }}
                >
                  {difficultyLabel(trip.difficulty)}
                </span>
                {trip.status && (
                  <span
                    className="font-body font-semibold"
                    style={{
                      fontSize: "0.62rem",
                      letterSpacing: "0.08em",
                      padding: "3px 8px",
                      background:
                        trip.status === "ongoing" ? "#FF6B1A" :
                        trip.status === "completed" ? "#4A3B2A" :
                        "rgba(240,237,234,0.15)",
                      color: "#F0EDEA",
                    }}
                  >
                    {trip.status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Card body */}
            <div className="p-5">
              <h3
                className="font-display font-bold uppercase text-off-white leading-tight"
                style={{
                  fontSize: "clamp(1.05rem, 2.2vw, 1.3rem)",
                  letterSpacing: "-0.01em",
                  marginBottom: "6px",
                }}
              >
                {trip.name}
              </h3>
              <p
                className="font-body text-muted-ink"
                style={{ fontSize: "0.82rem", marginBottom: "18px" }}
              >
                {trip.location}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid rgba(74,59,42,0.4)",
                  paddingTop: "14px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <p
                    className="font-body text-muted-ink"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}
                  >
                    {formatDate(trip.date_start, trip.date_end)}
                  </p>
                  <p
                    className="font-body font-semibold text-off-white"
                    style={{ fontSize: "0.9rem", marginTop: "2px" }}
                  >
                    {trip.price}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    className="font-body text-muted-ink"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}
                  >
                    {d.quota}
                  </p>
                  <p
                    className="font-body font-semibold text-neon-green"
                    style={{ fontSize: "0.9rem", marginTop: "2px" }}
                  >
                    {counts[trip.id]} / {trip.quota_max}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleJoin(trip.id)}
                disabled={joining === trip.id || joined.has(trip.id) || counts[trip.id] >= trip.quota_max}
                className="font-body font-semibold transition-all duration-200"
                style={{ position: "relative", zIndex: 20,
                  width: "100%",
                  fontSize: "0.68rem",
                  letterSpacing: "0.14em",
                  padding: "10px",
                  border: "1px solid rgba(240,237,234,0.25)",
                  cursor: (joining === trip.id || joined.has(trip.id) || counts[trip.id] >= trip.quota_max) ? "not-allowed" : "pointer",
                  background: joined.has(trip.id) ? "#9BFF3C" : "transparent",
                  color: joined.has(trip.id) ? "#111111" : "#F0EDEA",
                  opacity: counts[trip.id] >= trip.quota_max ? 0.4 : 1,
                }}
              >
                {joining === trip.id
                  ? d.joining
                  : joined.has(trip.id)
                  ? d.joined
                  : counts[trip.id] >= trip.quota_max
                  ? d.full
                  : d.join}
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
