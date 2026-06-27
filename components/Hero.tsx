"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ height: "100dvh", minHeight: "600px" }}
      aria-label="Basecamp — hero section"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85"
          alt="Mountain landscape — Vakansisme outdoor culture"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          style={{ filter: "grayscale(15%) brightness(0.75)" }}
        />
      </div>

      {/* Cinematic gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(17,17,17,0.55) 0%, rgba(17,17,17,0.15) 35%, rgba(17,17,17,0.6) 72%, rgba(17,17,17,1) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Grain texture */}
      <div className="grain z-[2]" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-[3] text-center px-6 max-w-5xl mx-auto w-full">
        {/* Platform tag */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease }}
          className="font-body font-semibold text-neon-green uppercase"
          style={{ fontSize: "0.7rem", letterSpacing: "0.28em", marginBottom: "20px" }}
        >
          Outdoor Culture Platform
        </motion.p>

        {/* Main wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.3, ease }}
          style={{ marginBottom: "28px", display: "flex", justifyContent: "center" }}
        >
          <Image
            src="/logo.png"
            alt="VAKANSISME"
            width={1376}
            height={446}
            priority
            style={{ width: "clamp(280px, 62vw, 780px)", height: "auto" }}
          />
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease }}
          className="font-body text-off-white/75"
          style={{
            fontSize: "clamp(0.95rem, 2.2vw, 1.2rem)",
            marginBottom: "44px",
            maxWidth: "52ch",
            marginInline: "auto",
            textWrap: "pretty",
          }}
        >
          You'll be exhausted, freezing cold, but somehow you'll want to come back for more.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.82, ease }}
          style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}
        >
          <a
            href="#expeditions"
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
            style={{ fontSize: "0.75rem", letterSpacing: "0.14em", padding: "13px 32px" }}
          >
            JOIN TRIP
          </a>
          <a
            href="#journal"
            className="font-body font-semibold text-off-white hover:text-charcoal hover:bg-off-white transition-all duration-200"
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.14em",
              padding: "12px 32px",
              border: "1px solid rgba(240,237,234,0.35)",
            }}
          >
            EXPLORE STORIES
          </a>
          <a
            href="/crew"
            className="font-body font-semibold text-off-white hover:text-charcoal hover:bg-off-white transition-all duration-200"
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.14em",
              padding: "12px 32px",
              border: "1px solid rgba(240,237,234,0.35)",
            }}
          >
            JOIN COMMUNITY
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[3] flex flex-col items-center gap-3"
        aria-hidden="true"
      >
        <span
          className="font-body text-off-white/30 uppercase"
          style={{ fontSize: "0.62rem", letterSpacing: "0.22em" }}
        >
          Scroll
        </span>
        <motion.div
          animate={{ scaleY: [1, 0.4, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="bg-off-white/30 origin-top"
          style={{ width: "1px", height: "36px" }}
        />
      </motion.div>
    </section>
  );
}
