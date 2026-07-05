"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { Locale } from "@/lib/i18n";
import { dict } from "@/lib/i18n";

function getNavLinks(locale: Locale) {
  const d = dict[locale];
  return [
    { href: "/expeditions", label: d.nav_expeditions },
    { href: "/explore", label: d.nav_explore },
    { href: "/stories", label: d.nav_journal },
    { href: "/crew", label: d.nav_crew },
    { href: "/chaos", label: d.nav_chaos },
    { href: "/leaderboard", label: d.nav_leaderboard },
  ];
}

const linkStyle = {
  fontSize: "0.7rem",
  letterSpacing: "0.1em",
} as React.CSSProperties;

export default function Nav({ initialLocale = "id" }: { initialLocale?: Locale }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [dmUnread, setDmUnread] = useState(0);
  const profileRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user) return;
      supabase.from("profiles").select("is_admin").eq("id", data.user.id).single()
        .then(({ data: profile }) => setIsAdmin(!!profile?.is_admin));
      // Load DM unread count
      fetch("/api/dm")
        .then((r) => r.json())
        .then((d: Array<{ unread: number }>) => setDmUnread(Array.isArray(d) ? d.reduce((s, c) => s + c.unread, 0) : 0))
        .catch(() => {});
      // Realtime DM unread badge
      const channel = supabase
        .channel("nav-dm")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${data.user.id}` },
          () => setDmUnread((n) => n + 1)
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close profile dropdown on outside click or Escape
  useEffect(() => {
    if (!profileOpen) return;
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [profileOpen]);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [menuOpen]);

  // Sync locale when prop changes (after router.refresh())
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocale(initialLocale);
  }, [initialLocale]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  const username = user?.user_metadata?.username ?? user?.email?.split("@")[0];
  const d = dict[locale];
  const links = getNavLinks(locale);

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
                style={linkStyle}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {user ? (
            <>
              <li>
                <Link
                  href="/messages"
                  aria-label="Messages"
                  onClick={() => setDmUnread(0)}
                  style={{ position: "relative", display: "flex", alignItems: "center", color: "#8B7355", padding: "4px" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {dmUnread > 0 && (
                    <span style={{ position: "absolute", top: 0, right: 0, background: "#FF6B1A", color: "#111", fontSize: "0.5rem", fontWeight: 800, lineHeight: 1, padding: "2px 4px", minWidth: "14px", textAlign: "center" }}>
                      {dmUnread > 9 ? "9+" : dmUnread}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <NotificationBell />
              </li>
              {/* Profile dropdown */}
              <li
                ref={profileRef}
                style={{ position: "relative" }}
                onKeyDown={(e) => { if (e.key === "Escape") setProfileOpen(false); }}
              >
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200"
                  style={{ ...linkStyle, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}
                >
                  @{username}
                  <span style={{ fontSize: "0.55rem", opacity: 0.6, marginTop: "1px" }}>▾</span>
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: "absolute",
                        top: "calc(100% + 12px)",
                        right: 0,
                        background: "rgba(17,17,17,0.98)",
                        border: "1px solid rgba(74,59,42,0.4)",
                        backdropFilter: "blur(14px)",
                        minWidth: "160px",
                        padding: "8px 0",
                        zIndex: 100,
                      }}
                    >
                      {[
                        { href: `/u/${username}`, label: d.nav_profile },
                        { href: "/stories/mine", label: d.nav_my_stories },
                        { href: "/trips", label: d.nav_my_trips },
                        { href: "/feed", label: d.nav_feed },
                        { href: "/bookmarks", label: d.nav_saved },
                        ...(isAdmin ? [{ href: "/admin", label: "ADMIN" }] : []),
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                          className="font-body font-semibold text-off-white/60 hover:text-off-white hover:bg-white/5 transition-colors duration-150"
                          style={{ display: "block", fontSize: "0.68rem", letterSpacing: "0.1em", padding: "9px 18px" }}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <div style={{ borderTop: "1px solid rgba(74,59,42,0.3)", margin: "6px 0" }} />
                      <button
                        role="menuitem"
                        onClick={() => { setProfileOpen(false); handleSignOut(); }}
                        className="font-body font-semibold text-off-white/60 hover:text-chaos-orange hover:bg-white/5 transition-colors duration-150"
                        style={{ display: "block", width: "100%", textAlign: "left", fontSize: "0.68rem", letterSpacing: "0.1em", padding: "9px 18px", background: "none", border: "none", cursor: "pointer" }}
                      >
                        {d.nav_sign_out}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  href="/login"
                  className="font-body font-semibold text-off-white/60 hover:text-off-white transition-colors duration-200"
                  style={linkStyle}
                >
                  {d.nav_sign_in}
                </Link>
              </li>
              <li>
                <Link
                  href="/expeditions"
                  className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
                  style={{ fontSize: "0.7rem", letterSpacing: "0.12em", padding: "9px 20px" }}
                >
                  {d.nav_join_trip}
                </Link>
              </li>
            </>
          )}
          <li>
            <LanguageSwitcher current={locale} />
          </li>
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
            style={{ width: "24px", transform: menuOpen ? "rotate(45deg) translateY(6px)" : "none" }}
          />
          <span
            className="block h-px bg-off-white transition-all duration-300"
            style={{ width: "24px", opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="block h-px bg-off-white transition-all duration-300"
            style={{ width: menuOpen ? "24px" : "16px", transform: menuOpen ? "rotate(-45deg) translateY(-6px) translateX(8px)" : "none" }}
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
            style={{ background: "rgba(17,17,17,0.97)", borderTop: "1px solid rgba(74,59,42,0.3)" }}
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
                  <Link href={`/u/${username}`} onClick={() => setMenuOpen(false)} className="font-body font-semibold text-muted-ink" style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                    @{username}
                  </Link>
                  <Link href="/stories/mine" onClick={() => setMenuOpen(false)} className="font-body font-semibold text-off-white/60" style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                    {d.nav_my_stories}
                  </Link>
                  <Link href="/trips" onClick={() => setMenuOpen(false)} className="font-body font-semibold text-off-white/60" style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                    {d.nav_my_trips}
                  </Link>
                  <Link href="/feed" onClick={() => setMenuOpen(false)} className="font-body font-semibold text-off-white/60" style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                    {d.nav_feed}
                  </Link>
                  <Link href="/bookmarks" onClick={() => setMenuOpen(false)} className="font-body font-semibold text-off-white/60" style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                    {d.nav_saved}
                  </Link>
                  <Link href="/messages" onClick={() => { setMenuOpen(false); setDmUnread(0); }} className="font-body font-semibold text-off-white/60" style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                    {d.nav_messages}{dmUnread > 0 ? ` (${dmUnread})` : ""}
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="font-body font-semibold text-off-white/60" style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                      ADMIN
                    </Link>
                  )}
                  <LanguageSwitcher current={locale} />
                  <button
                    onClick={() => { setMenuOpen(false); handleSignOut(); }}
                    className="inline-block font-body font-semibold text-charcoal bg-chaos-orange"
                    style={{ fontSize: "0.75rem", letterSpacing: "0.12em", padding: "12px 28px", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    {d.nav_sign_out}
                  </button>
                </li>
              ) : (
                <li style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="inline-block font-body font-semibold text-charcoal bg-neon-green" style={{ fontSize: "0.75rem", letterSpacing: "0.12em", padding: "12px 28px" }}>
                    {d.nav_sign_in}
                  </Link>
                  <Link href="/expeditions" onClick={() => setMenuOpen(false)} className="font-body font-semibold text-off-white/60" style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                    {d.nav_join_trip} →
                  </Link>
                  <LanguageSwitcher current={locale} />
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
