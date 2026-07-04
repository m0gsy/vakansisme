"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { Story } from "@/types/story";
import type { Locale } from "@/lib/i18n";
import { dict } from "@/lib/i18n";

const ease = [0.16, 1, 0.3, 1] as const;

const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80";

export default function Stories({ stories, locale = "id" }: { stories: Story[]; locale?: Locale }) {
  const d = dict[locale];
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  if (stories.length === 0) return null;

  const featured = stories[0];
  const rest = stories.slice(1, 4);

  return (
    <section
      id="journal"
      style={{ background: "#1F3B2C", paddingBlock: "96px" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease }}
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          <h2
            className="font-display font-black uppercase text-off-white"
            style={{
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              letterSpacing: "-0.025em",
              lineHeight: 0.88,
            }}
          >
            {d.page_stories}
          </h2>
          <Link
            href="/stories"
            className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-200"
            style={{ fontSize: "0.7rem", letterSpacing: "0.12em" }}
          >
            {d.explore_stories}
          </Link>
        </motion.div>

        {/* Layout: large card left + small cards right */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {/* Featured card */}
          <Link
            href={`/stories/${featured.slug}`}
            className="group"
            style={{
              position: "relative",
              overflow: "hidden",
              flex: "2 1 340px",
              minHeight: "420px",
              display: "block",
            }}
          >
          <motion.article
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1, ease }}
            className="cursor-pointer"
            style={{
              position: "absolute",
              inset: 0,
            }}
          >
            <Image
              src={featured.image_url ?? FALLBACK_IMAGE}
              alt={featured.title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ filter: "grayscale(20%) brightness(0.85)" }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: grain,
                backgroundSize: "180px 180px",
                opacity: 0.1,
                mixBlendMode: "overlay",
                pointerEvents: "none",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(17,17,17,0.95) 0%, rgba(17,17,17,0.3) 55%, transparent 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "28px",
              }}
            >
              <span
                className="font-body font-semibold text-neon-green uppercase"
                style={{ fontSize: "0.65rem", letterSpacing: "0.14em", display: "block", marginBottom: "10px" }}
              >
                {featured.type}
              </span>
              <h3
                className="font-display font-bold uppercase text-off-white leading-tight"
                style={{ fontSize: "clamp(1.3rem, 2.8vw, 1.9rem)", letterSpacing: "-0.015em", marginBottom: "10px", textWrap: "balance" }}
              >
                {featured.title}
              </h3>
              <p
                className="font-body text-off-white/65"
                style={{ fontSize: "0.875rem", marginBottom: "12px", maxWidth: "46ch" }}
              >
                {featured.excerpt}
              </p>
              <p className="font-body text-muted-ink" style={{ fontSize: "0.75rem" }}>
                {featured.author_handle}
              </p>
            </div>
          </motion.article>
          </Link>

          {/* Small cards column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              flex: "1 1 260px",
            }}
          >
            {rest.map((story, i) => (
              <Link
                key={story.id}
                href={`/stories/${story.slug}`}
                className="group"
                style={{
                  position: "relative",
                  overflow: "hidden",
                  flex: "1 0 120px",
                  minHeight: "130px",
                  display: "block",
                }}
              >
              <motion.article
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, delay: 0.18 + i * 0.1, ease }}
                className="cursor-pointer"
                style={{
                  position: "absolute",
                  inset: 0,
                }}
              >
                <Image
                  src={story.image_url ?? FALLBACK_IMAGE}
                  alt={story.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 30vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ filter: "grayscale(25%) brightness(0.8)" }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(17,17,17,0.92) 0%, rgba(17,17,17,0.25) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "16px 18px",
                  }}
                >
                  <span
                    className="font-body font-semibold text-neon-green uppercase"
                    style={{ fontSize: "0.6rem", letterSpacing: "0.12em", display: "block", marginBottom: "5px" }}
                  >
                    {story.type}
                  </span>
                  <h3
                    className="font-display font-bold uppercase text-off-white leading-tight"
                    style={{ fontSize: "clamp(0.85rem, 1.8vw, 1.05rem)", letterSpacing: "-0.01em", marginBottom: "4px" }}
                  >
                    {story.title}
                  </h3>
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.7rem" }}>
                    {story.author_handle}
                  </p>
                </div>
              </motion.article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
