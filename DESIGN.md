<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->

---
name: Vakansisme
description: "Naik gunung, turun jadi cerita."
colors:
  forest-dark: "#1F3B2C"
  charcoal: "#111111"
  earth-brown: "#4A3B2A"
  neon-green: "#9BFF3C"
  chaos-orange: "#FF6B1A"
  off-white: "#F0EDEA"
  muted-ink: "#7A7570"
typography:
  display:
    fontFamily: "'Barlow Condensed', Impact, sans-serif"
    fontSize: "clamp(3.5rem, 9vw, 7rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Barlow Condensed', Impact, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Manrope', system-ui, sans-serif"
    fontSize: "clamp(0.95rem, 1.5vw, 1.05rem)"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "'Manrope', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.04em"
  story:
    fontFamily: "'Special Elite', 'Courier New', monospace"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.8
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "48px"
  xl: "80px"
  xxl: "128px"
---

# Design System: Vakansisme

## 1. Overview

**Creative North Star: "The Chaos Zine"**

Vakansisme is an underground outdoor zine, photocopied at 3am after the crew just got back from a muddy night summit. The grain is real. The blur is on purpose. The layout is almost but not quite aligned — because that's what honesty looks like when you're tired and still grinning. Every surface should feel like something that could be pasted on a warung dinding or stapled into a music venue. Not a brand booklet. Not a product catalog.

The system runs dark — `charcoal (#111111)` as the primary canvas, `forest-dark (#1F3B2C)` as the atmosphere layer. Light only appears where the eye needs to land: the chaos accent pops (neon green `#9BFF3C`, orange `#FF6B1A`), body copy in `off-white (#F0EDEA)` at full legibility. Film grain texture sits as a persistent CSS noise overlay on hero sections — not decorative, part of the identity.

Typography is blunt. `Barlow Condensed` Black/ExtraBold for all headings — condensed, heavy, no apologies — paired with `Manrope` for body (clean, humanist, readable on dark). `Special Elite` for storytelling sections only: the typewriter voice for Journal/chaos copy. No editorial serifs. No magazine-affectation Cormorant.

This system rejects: REI/North Face product-catalog energy, National Geographic prestige editorial, Traveloka transactional cleanliness, motivational hiking accounts with sunrise-serif headers, and any layout that would look at home in a wellness brand.

**Key Characteristics:**
- Dark canvas — charcoal is the default, not a "dark mode" option
- Condensed brutalist headings, not editorial serifs
- Chaos accents (neon green, orange) used sparingly — max 10% surface coverage
- Film grain texture as brand texture layer
- Intentional layout imperfection — asymmetry, slight tilts, overlap

## 2. Colors: The Basecamper's Palette

Dark, saturated, forest-native. Accents appear like sparks — rare, decisive.

### Primary
- **Forest Dark** (`#1F3B2C` / oklch(0.27 0.052 152)): Background for hero sections, elevated cards, nav. The forest at night — dark green with depth, not black. Used on sections where atmosphere matters most.
- **Charcoal** (`#111111` / oklch(0.13 0 0)): Default page background. Anchor of the system. Almost-black with no blue cast.

### Secondary
- **Earth Brown** (`#4A3B2A` / oklch(0.30 0.038 62)): Tertiary surfaces, card borders, section dividers. Soil, not warmth.

### Tertiary — Chaos Accents
- **Neon Green** (`#9BFF3C` / oklch(0.87 0.22 130)): Primary CTA, active states, highlight rolls. The spark in the dark. Used on maximum 2 elements per viewport.
- **Chaos Orange** (`#FF6B1A` / oklch(0.68 0.18 46)): Secondary accent for Chaos Wall, event tags, heat. Never used alongside Neon Green on the same element.

### Neutral
- **Off-White** (`#F0EDEA`): Body text on dark backgrounds. Not pure white — slightly warm to reduce harshness at small sizes.
- **Muted Ink** (`#7A7570`): Secondary text, metadata, timestamps. Must clear 4.5:1 on charcoal background.

### Named Rules
**The Spark Rule.** Neon Green and Chaos Orange are accents, not backgrounds. Combined, they cover ≤10% of any given viewport. Their rarity is the power. If every button is neon green, nothing is.

**The Dark Default Rule.** Every new surface starts dark. Light surfaces are the exception and require an explicit reason. There is no "light version of this component" unless it's a user-uploaded photo or content area.

## 3. Typography: The Zine Stack

**Display Font:** Barlow Condensed (800 Black, ExtraBold) — loaded from Google Fonts
**Body Font:** Manrope (400, 500, 600) — loaded from Google Fonts
**Story/Typewriter Font:** Special Elite (400) — loaded from Google Fonts, used only in Journal/Chaos Wall contexts

**Character:** Barlow Condensed slams text into the grid like a concert poster printed over a map. Manrope keeps prose human and readable at 16px on dark. Special Elite adds the analog grain to storytelling copy — a secondary voice that earns its place only in the right sections.

### Hierarchy
- **Display** (800, `clamp(3.5rem, 9vw, 7rem)`, line-height 0.92): Hero headlines, section-defining statements. `text-wrap: balance`. Letter-spacing -0.02em. Uppercase preferred.
- **Headline** (700, `clamp(2rem, 5vw, 3.5rem)`, line-height 1.0): Trip/event titles, section headers. Uppercase or title case.
- **Title** (700 Manrope, `clamp(1.25rem, 2vw, 1.5rem)`, line-height 1.2): Card titles, crew member names, sub-section labels.
- **Body** (400 Manrope, `clamp(0.95rem, 1.5vw, 1.05rem)`, line-height 1.65): All running prose. Max-width 65ch. Off-white on dark backgrounds.
- **Label** (600 Manrope, `0.75rem`, letter-spacing 0.04em): Tags, difficulty scale, metadata, dates. Never full-page uppercase — labels only.
- **Story** (400 Special Elite, `1rem`, line-height 1.8): Journal entries, Chaos Wall captions only. The typewriter voice.

### Named Rules
**The Condensed-Only Heading Rule.** All headings use Barlow Condensed. No serifs. No Manrope headings. If it needs to feel like a heading, it must be condensed and heavy.

**The Typewriter Gate Rule.** Special Elite appears only in Journal/story content and Chaos Wall copy. Never in navigation, UI, or product sections. It's a storytelling voice, not a branding default.

## 4. Elevation

This system is **flat by default with atmospheric layering** — no floating shadows, no Material-style elevation scales. Depth is created through background color contrast (`charcoal → forest-dark`), grain texture intensity, and opacity rather than box-shadows.

State changes (hover, active) use background shifts and border reveals, not drop shadows. The exception: chaos accent glows — neon green elements may cast a subtle diffuse glow (`box-shadow: 0 0 24px rgba(155, 255, 60, 0.25)`) at hover to reinforce the "spark in the dark" metaphor.

### Shadow Vocabulary
- **Chaos Glow** (`box-shadow: 0 0 24px rgba(155, 255, 60, 0.25)`): Neon green CTA at hover state only. Not used on static elements.
- **No ambient shadow.** Cards do not float. They sit.

### Named Rules
**The No-Float Rule.** Nothing in this system has a drop shadow at rest. Surfaces are grounded. The only glow is the chaos accent, and only on interaction.

## 5. Components

### Buttons
Brutalist, rectangular by default. Shape says "poster" not "app store."
- **Shape:** Sharp corners (0px radius). `rounded: none`.
- **Primary (Join Trip / CTA):** Background `neon-green (#9BFF3C)`, text `charcoal (#111111)`, padding `14px 32px`. All-caps, Manrope 600, letter-spacing 0.08em. Hover: background shifts to `chaos-orange`, transition 150ms ease-out.
- **Secondary (Ghost):** Transparent background, 1px `off-white` border, text `off-white`. Hover: background `off-white` at 10% opacity.
- **Destructive/Chaos:** Background `chaos-orange (#FF6B1A)`, text `charcoal`. Used sparingly (Chaos Wall CTA only).

### Cards — Event/Trip (Expedition Poster)
Treats each trip like a gig flyer, not a product listing.
- **Corner Style:** Sharp (0px radius) or barely-there (4px max).
- **Background:** `forest-dark (#1F3B2C)` with grain overlay at 15% opacity.
- **Border:** 1px solid `earth-brown (#4A3B2A)` at rest; shifts to `neon-green` on hover.
- **Internal Padding:** 24px.
- **Layout:** Full-bleed photo top half, metadata below. Photo has grain CSS filter. Difficulty tag as neon-green label chip.

### Chips / Tags
- **Style:** Background `earth-brown`, text `off-white`, 0px radius (pill is banned — too app-store). 4px radius max.
- **Active/Selected:** Background `neon-green`, text `charcoal`.
- **Difficulty tags:** Custom fun-scale labels ("Level: Santai", "Level: Chaos Banget") in label size.

### Navigation
- **Style:** Fixed, dark (`charcoal` background at 85% opacity with `backdrop-filter: blur(8px)`). Logo left, links right.
- **Typography:** Manrope 600, label size, letter-spacing 0.06em. All-caps navigation items.
- **Active:** Neon green underline (2px), not color swap.
- **Mobile:** Full-screen overlay menu, dark bg, large headline-size links stacked.

### Inputs / Fields
- **Style:** Background transparent, 1px `muted-ink` border bottom only (underline style, not boxed). Text `off-white`.
- **Focus:** Border shifts to `neon-green`, subtle neon glow `0 2px 8px rgba(155,255,60,0.3)`.
- **Error:** Border `chaos-orange`, error text `chaos-orange` Manrope 400 0.85rem.

### Chaos Wall (Signature Component)
Random feed of imperfect content — failed photos, shaky video stills, absurd community quotes.
- **Layout:** Masonry or intentionally unaligned grid. Cards at random slight rotations (-2deg to +3deg).
- **Each card:** Dark bg, no border, grain-heavy. Content inside: full-bleed media + Special Elite caption below.
- **Animation:** On load, cards "drop in" with slight rotation variance. Reduced-motion: instant display.

## 6. Do's and Don'ts

### Do:
- **Do** use `charcoal (#111111)` as the default page background. Every new surface starts dark.
- **Do** apply CSS grain texture (SVG noise or CSS `filter`) to hero and atmospheric sections — grain is brand identity, not decoration.
- **Do** use Barlow Condensed 800 in all-caps for headings. Heavy + condensed = the voice.
- **Do** treat trip listings like event/gig posters: full-bleed photo, bold title, minimal metadata.
- **Do** use neon green (`#9BFF3C`) for the single most important CTA on a page — one per viewport max.
- **Do** let Chaos Wall cards rotate slightly (CSS `rotate: -1deg` to `3deg`). Imperfection is intentional.
- **Do** write body text in `off-white (#F0EDEA)`, always verify 4.5:1 contrast on dark backgrounds.
- **Do** use `Special Elite` typewriter font in Journal/story sections exclusively — it earns its chaos context.
- **Do** include a `@media (prefers-reduced-motion: reduce)` fallback for every Framer Motion animation. Chaotic motion is opt-in, not forced.

### Don't:
- **Don't** use a warm cream, beige, or sand background. This is not a wellness brand.
- **Don't** use editorial serifs (Fraunces, Cormorant, Playfair Display, Newsreader). This is not National Geographic.
- **Don't** use Inter, DM Sans, or Plus Jakarta Sans. They carry SaaS DNA. Wrong register entirely.
- **Don't** write motivational copy. No "Nikmati pengalaman mendaki bersama kami." No sunrise-and-hustle energy.
- **Don't** format trip listings as tables, grids with identical cards, or formal catalog entries. Poster energy only.
- **Don't** use rounded-corner pill buttons or pill chips. Sharp corners or minimal 4px max. Pills are app store.
- **Don't** use gradient text (`background-clip: text`). Forbidden — see shared absolute bans.
- **Don't** add drop shadows to cards at rest. Surfaces sit flat. Only the chaos glow (neon hover) is permitted.
- **Don't** make the neon green or chaos orange appear on more than 10% of any viewport. Their rarity is the power.
- **Don't** use identical-card grids for the Stories/Journal feed. Vary sizes, break rhythm.
- **Don't** style anything to look like Traveloka, Tiket.com, or any transactional travel booking UI. No search bars front-and-center, no property-listing card grids.
- **Don't** use large rounded-corner icons above every heading. No icon-over-heading template components.
