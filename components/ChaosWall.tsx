"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import type { ChaosCard } from "@/types/chaos";
import ChaosSubmitButton from "@/components/ChaosSubmitButton";

const ease = [0.16, 1, 0.3, 1] as const;

export default function ChaosWall({ initialCards }: { initialCards: ChaosCard[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="chaos-wall" className="bg-charcoal" style={{ paddingBlock: "96px" }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease }}
          style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "56px" }}
        >
          <div>
            <h2
              className="font-display font-black uppercase text-off-white"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
            >
              CHAOS WALL
            </h2>
            <p className="font-body text-muted-ink mt-3" style={{ fontSize: "0.9rem", maxWidth: "46ch" }}>
              Failed shots, shaky footage, absurd quotes, inside jokes. This is what makes Vakansisme different from every other outdoor platform.
            </p>
          </div>
          <Link
            href="/chaos"
            className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-200"
            style={{ fontSize: "0.7rem", letterSpacing: "0.12em" }}
          >
            ENTER THE CHAOS WALL →
          </Link>
        </motion.div>

        {/* Cards grid */}
        {!initialCards.length ? (
          <p className="font-story text-muted-ink" style={{ fontSize: "0.95rem" }}>
            Nothing here yet. Be the first to post some chaos.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, min(340px, 100%)))", gap: "16px" }}>
            {initialCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 56, rotate: 0 }}
                animate={isInView ? { opacity: 1, y: 0, rotate: card.rotation } : {}}
                transition={{ duration: 0.7, delay: i * 0.07, ease }}
                whileHover={{ rotate: 0, scale: 1.03, zIndex: 10, transition: { duration: 0.18, ease: "easeOut" } }}
                style={{
                  background: i % 3 === 0 ? "#1F3B2C" : i % 3 === 1 ? "#111111" : "#4A3B2A",
                  border: "1px solid rgba(74,59,42,0.35)",
                  padding: "24px",
                  minHeight: "172px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "default",
                  position: "relative",
                }}
              >
                <span
                  className="font-body font-semibold uppercase"
                  style={{ fontSize: "0.62rem", letterSpacing: "0.14em", color: card.accent_color }}
                >
                  {card.type}
                </span>
                <p className="font-story text-off-white" style={{ fontSize: "0.88rem", lineHeight: 1.7, marginTop: "16px" }}>
                  {card.caption}
                </p>
                <div
                  aria-hidden="true"
                  style={{ position: "absolute", bottom: "12px", right: "14px", width: "6px", height: "6px", background: card.accent_color, opacity: 0.5 }}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Submit CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.55, ease }}
          style={{ textAlign: "center", marginTop: "52px" }}
        >
          <ChaosSubmitButton variant="orange" />
        </motion.div>
      </div>
    </section>
  );
}
