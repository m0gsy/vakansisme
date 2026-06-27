"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const links = [
  { href: "/expeditions", label: "EXPEDITIONS" },
  { href: "/stories", label: "JOURNAL" },
  { href: "/crew", label: "CREW" },
  { href: "/chaos", label: "CHAOS WALL" },
];

export default function Nav() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  const username = user?.user_metadata?.username ?? user?.email?.split("@")[0];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(17,17,17,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(74,59,42,0.25)" : "none",
        paddingTop: scrolled ? "12px" : "24px",
        paddingBottom: scrolled ? "12px" : "24px",
      }}
    >
      <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" aria-label="VAKANSISME — home" style={{ display: "block", lineHeight: 0 }}>
          <Image
            src="/logo.png"
            alt="VAKANSISME"
            width={1376}
            height={446}
            priority
            style={{ height: "26px", width: "auto" }}
          />
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-body font-semibold text-off-white/60 hover:text-off-white transition-colors duration-200"
                style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {user ? (
            <>
              <li>
                <Link
                  href="/stories/mine"
                  className="font-body font-semibold text-off-white/60 hover:text-off-white transition-colors duration-200"
                  style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
                >
                  MY STORIES
                </Link>
              </li>
              <li>
                <Link
                  href={`/u/${username}`}
                  className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200"
                  style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}
                >
                  @{username}
                </Link>
              </li>
              <li>
                <button
                  onClick={handleSignOut}
                  className="font-body font-semibold text-off-white/60 hover:text-chaos-orange transition-colors duration-150"
                  style={{ fontSize: "0.7rem", letterSpacing: "0.1em", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  SIGN OUT
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  href="/login"
                  className="font-body font-semibold text-off-white/60 hover:text-off-white transition-colors duration-200"
                  style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
                >
                  SIGN IN
                </Link>
              </li>
              <li>
                <Link
                  href="/expeditions"
                  className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
                  style={{ fontSize: "0.7rem", letterSpacing: "0.12em", padding: "9px 20px" }}
                >
                  JOIN TRIP
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Search */}
        <Link
          href="/search"
          className="hidden md:block font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
          aria-label="Search"
        >
          ⌕
        </Link>

        {/* Mobile toggle */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span
            className="block h-px bg-off-white transition-all duration-300"
            style={{
              width: "24px",
              transform: menuOpen ? "rotate(45deg) translateY(6px)" : "none",
            }}
          />
          <span
            className="block h-px bg-off-white transition-all duration-300"
            style={{
              width: "24px",
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            className="block h-px bg-off-white transition-all duration-300"
            style={{
              width: menuOpen ? "24px" : "16px",
              transform: menuOpen ? "rotate(-45deg) translateY(-6px) translateX(8px)" : "none",
            }}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden"
            style={{
              background: "rgba(17,17,17,0.97)",
              borderTop: "1px solid rgba(74,59,42,0.3)",
            }}
          >
            <ul className="flex flex-col px-6 py-8 gap-6">
              {links.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="font-display font-black uppercase text-off-white"
                    style={{ fontSize: "clamp(2rem, 8vw, 3rem)", letterSpacing: "-0.01em" }}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
              {user ? (
                <li style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Link
                    href="/stories/mine"
                    onClick={() => setMenuOpen(false)}
                    className="font-body font-semibold text-off-white/60"
                    style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}
                  >
                    MY STORIES
                  </Link>
                  <Link
                    href={`/u/${username}`}
                    onClick={() => setMenuOpen(false)}
                    className="font-body font-semibold text-muted-ink"
                    style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}
                  >
                    @{username}
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); handleSignOut(); }}
                    className="inline-block font-body font-semibold text-charcoal bg-chaos-orange"
                    style={{ fontSize: "0.75rem", letterSpacing: "0.12em", padding: "12px 28px", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    SIGN OUT
                  </button>
                </li>
              ) : (
                <li style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="inline-block font-body font-semibold text-charcoal bg-neon-green"
                    style={{ fontSize: "0.75rem", letterSpacing: "0.12em", padding: "12px 28px" }}
                  >
                    SIGN IN
                  </Link>
                  <Link
                    href="/expeditions"
                    onClick={() => setMenuOpen(false)}
                    className="font-body font-semibold text-off-white/60"
                    style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}
                  >
                    JOIN TRIP →
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
