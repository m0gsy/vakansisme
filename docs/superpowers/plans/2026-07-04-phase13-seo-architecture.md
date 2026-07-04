# Phase 13 — Enterprise SEO Architecture: Slugs, Redirects, Programmatic Discoverability

## Context

All public entity URLs currently expose UUIDs (`/stories/76aff0fe-...`), which is poor for SEO, CTR, and Google Discover. Phase 13 migrates the app to slug-based URLs with full backward compatibility (UUID → 301 → slug), adds segmented sitemaps, canonical URLs everywhere, new destination/location entities with geographic hierarchy, tag/category hub pages, and a related-content engine.

**User decisions (binding):**
1. Full scope — including NEW entity tables (destinations: mountain/trail/national-park, locations: province/city) with noindex-when-thin guards
2. Slugs editable + `slug_redirects` history table (301, auto-flattened chains)
3. UUID stays PK forever; public URLs expose slugs only; never break existing URLs

**Verified current state:**
- UUID routes: `stories/[id]`, `expeditions/[id]`, `series/[id]` (+ edit, opengraph-image files)
- `/u/[username]` already human-readable (`profiles.username` UNIQUE) — stays canonical, NO `/author/` alias (would duplicate content)
- No slugify util, no middleware, no redirects config, zero "slug" matches in repo
- `SITE_URL` re-declared inline in ~7 files
- Latest migration: 035. Tables existing: stories, expeditions, story_series, profiles, activities (+social tables). NOT existing: mountains/trails/locations/tags-table/categories
- ~25 files build `/stories/${id}` / `/expeditions/${id}` links inline
- Inserts: `app/api/stories/route.ts:51`, `app/api/series/route.ts:23`, `app/api/admin/expeditions/proposals/[id]/route.ts:37`, `app/api/admin/expeditions/route.ts`

## Key design decisions

1. **No middleware** — in-page resolution: UUID-regex detect → DB lookup → `permanentRedirect()`. Zero edge cost.
2. **`slug_redirects` points at `entity_id`** (not target slug) → chains flatten automatically, loops impossible. `PK (entity_type, old_slug)`.
3. **SQL trigger = source of truth for slug generation** (`BEFORE INSERT`, per-table via `TG_ARGV`), covers all insert paths with zero app changes. TS `slugify` mirror in `lib/seo.ts` for validation/tag-derivation. Both must byte-match.
4. **ONE `destinations` table** (`kind: mountain|trail|national_park`, trail→mountain via `parent_id` self-FK) + ONE `locations` table (`type: province|city`, adjacency). One CRUD, one RLS set. Splittable later.
5. **Linking:** nullable `destination_id` FK on expeditions + stories. No join table (YAGNI).
6. **Sitemaps:** Next.js `generateSitemaps` segments; robots.ts lists all segment URLs (substitute for index file, Google accepts multiple Sitemap lines). Images inline via `images` field.
7. Slug edit: admin PATCH validates `slugify(input)===input`, DB unique constraint → 409 on collision; redirect row written by DB trigger (SECURITY DEFINER), no app bookkeeping.

## Tasks (12, ordered, subagent-driven)

### Task 1 — `lib/seo.ts` (NEW)
`SITE_URL`, `absoluteUrl()`, `UUID_RE`, `slugify()` (lowercase, NFKD, strip diacritics/emoji/punct, hyphens, trim), `buildEntityMetadata({title, description, path, image, type, noindex}): Metadata` (canonical+OG+twitter in one call). Test fixture: `"Gunung Rinjani 🏔️ — 3,726m!"` → `"gunung-rinjani-3-726m"`.

### Task 2 — Migration `036_slugs.sql` (NEW)
- `CREATE EXTENSION unaccent`; SQL `slugify(text)` function matching TS version
- `ADD COLUMN slug text` on stories, expeditions, story_series, activities
- Backfill with dedupe (`row_number() OVER (PARTITION BY slugify(src))` → suffix `-2`, `-3`); empty slug → `left(id::text,8)`
- `SET NOT NULL` + UNIQUE index per table
- `set_slug()` BEFORE INSERT trigger (collision loop with suffix), per-table with source column arg
- `slug_redirects` table: `(entity_type, old_slug) PK, entity_id uuid` + public-read RLS, writes only via SECURITY DEFINER trigger
- `record_slug_change()` AFTER UPDATE OF slug trigger: insert old slug, delete stale redirect matching new slug (loop prevention)

### Task 3 — `lib/resolve.ts` + `stories/[slug]` migration
- `resolveSlugOrRedirect({supabase, table, entityType, param, basePath, select, extraFilter})`: slug match → return; UUID match → `permanentRedirect` to slug; `slug_redirects` hit → join live row → `permanentRedirect`; else `notFound()`. Wrap in `React.cache()`.
- `git mv app/(pages)/stories/[id] → [slug]` (page, edit/, opengraph-image)
- generateMetadata via `buildEntityMetadata` (canonical missing today — add). JSON-LD Article + Breadcrumb URLs → slug. opengraph-image: slug first, id fallback, no redirect.

### Task 4 — `expeditions/[slug]` + `series/[slug]`
Same pattern. Event/Place JSON-LD → slug URLs. Series canonical (currently UUID) → slug. Expeditions gain missing canonical.

### Task 5 — Internal link sweep + API responses
- grep `/stories/${`, `/expeditions/${` → ~25 files (components/Stories.tsx, Expeditions.tsx, search, feed, bookmarks, trips, leaderboard, calendar, series, admin) → switch to `slug`, add `slug` to each `.select()`
- API create responses (`stories`, `series`, admin expeditions) return `slug` for client redirects. No insert changes (trigger fills slug).

### Task 6 — Segmented sitemaps + robots
- `app/sitemap.ts` → `generateSitemaps()`: static, stories, expeditions, profiles, series, destinations, hubs. Slug URLs, real `lastModified`, `images` inline.
- `app/robots.ts` → sitemap array of all `/sitemap/<id>.xml`. destinations/hubs return `[]` until Tasks 7-10.

### Task 7 — Migration `037_destinations.sql` (NEW)
- `locations` (type province|city, name, slug, parent_id self-FK, CHECK hierarchy)
- `destinations` (kind mountain|trail|national_park, name, slug UNIQUE, parent_id self-FK trail→mountain, location_id FK, elevation_m, description, image_url; CHECK trail has parent)
- set_slug + record_slug_change triggers on both
- `ADD COLUMN destination_id` FK on expeditions + stories, indexes
- RLS: public SELECT, admin ALL (mirror activities 034 pattern)

### Task 8 — Destination + location public pages
- `app/(pages)/mountain/[slug]`, `trail/[slug]`, `national-park/[slug]` → thin wrappers over shared `components/DestinationPage.tsx` (kind + basePath params)
- `app/(pages)/location/[slug]` (province lists cities+destinations; city lists destinations), `app/(pages)/explore` hub (Indonesia → provinces)
- **Thin guard:** no description AND zero linked content → `noindex: true` via buildEntityMetadata
- JSON-LD: Place (mountains), CollectionPage + BreadcrumbList (Indonesia → province → city → mountain → trail)

### Task 9 — Admin CRUD destinations + locations
- `app/api/admin/destinations/route.ts` + `[id]/route.ts` (PATCH incl. slug edit → validate slugify-idempotent, 23505 → 409), same for locations
- `app/(pages)/admin/destinations/page.tsx` following existing admin style; link from main admin page
- Destination `<select>` on admin expedition form + story edit (nullable `destination_id`)

### Task 10 — Tag & category hubs
- `app/(pages)/tag/[slug]`: reverse-map slugified tag from distinct `stories.tags`, query `tags @> [tag]`. Thin guard <2 stories → noindex.
- `app/(pages)/categories/[slug]`: resolve `activities.slug`, list expeditions by `activity_category`. Same guard.
- Sitemap hubs segment: only entries passing thin threshold. Tag chips on story pages become links.

### Task 11 — Related-content engine
- Stories + expeditions detail: scored related block — same `destination_id` first, tag `overlaps`, same type/activity, freshness order, dedupe, limit 6. 2-3 parallel selects merged in TS (no RPC).
- Expedition page links up to mountain/location; bidirectional with Task 8's downward links.

### Task 12 — Validation pass
1. `npx tsc --noEmit` + `npm run build` clean
2. Dup slug SQL check per table → zero
3. Rename slug twice → curl old slug → exactly ONE hop (Next emits 308 — acceptable)
4. `curl -sI /stories/<uuid>` → Location: slug URL (repeat expeditions, series)
5. UUID leak grep on rendered HTML of key pages + sitemaps → empty
6. Fetch every `/sitemap/<id>.xml`, valid XML, slug-only, images present; robots lists all
7. Rich Results Test: Article, Event, Place, ProfilePage
8. Thin guard: empty mountain → noindex in HTML; add description → indexable
9. opengraph-image 1200×630 responds on slug URLs

## Risks

- **Backfill:** one transaction, brief lock — run at low traffic. `SET NOT NULL` fails-safe inside same transaction.
- **301 browser caching:** only redirect when target row exists (by construction, OK)
- **set_slug race:** simultaneous same-title inserts can hit unique violation — acceptable, client retries
- **GSC:** UUID URLs show "Page with redirect" for weeks — expected, keep fallback forever
- **Ordering:** Tasks 1–5 critical path before 6; 7–11 independent; Vercel deploys atomic
- Migrations 036 + 037 must be applied to production Supabase manually (like 034/035)

## Execution

Subagent-driven development (same flow as previous phase): fresh implementer per task, reviewer per task, fix loop, ledger at `.superpowers/sdd/progress.md`, final whole-branch review.
