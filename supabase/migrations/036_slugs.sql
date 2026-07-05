-- SEO slugs: slugify(), slug columns + backfill, auto-slug trigger, slug_redirects (301 history)

-- WITH SCHEMA public: on Supabase, extensions default to the `extensions` schema, where an
-- unqualified unaccent() call would not resolve for roles whose search_path lacks it (the
-- set_slug trigger runs as authenticated/anon at INSERT time). If unaccent is ALREADY installed
-- in `extensions` on this project, IF NOT EXISTS makes this a no-op — run
-- `ALTER EXTENSION unaccent SET SCHEMA public;` first, or the backfill below fails.
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

-- Must match lib/seo.ts slugify() byte-for-byte for Latin input.
-- TS: lowercase -> NFKD normalize -> strip combining marks -> non [a-z0-9] runs -> '-' -> trim '-'.
-- SQL: lower -> unaccent (maps common Latin diacritics to base letters, not a full NFKD
-- decomposition) -> same non [a-z0-9] collapse -> trim. Diverges only for non-Latin scripts
-- (e.g. Japanese/Korean/Cyrillic), which both sides reduce to '' the same way anyway since
-- neither TS nor unaccent() touches those code points and the regexp strips them all.
CREATE OR REPLACE FUNCTION public.slugify(input text) RETURNS text
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT trim(BOTH '-' FROM regexp_replace(lower(public.unaccent(coalesce(input,''))), '[^a-z0-9]+', '-', 'g'))
$$;

-- 1. Nullable slug columns
ALTER TABLE stories ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE story_series ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS slug text;

-- 2. Backfill with dedupe. Partition key MUST match the slug expression exactly (including the
-- empty-title -> id-prefix fallback), otherwise two empty-title rows collide on '' before the
-- fallback is applied and get the same rn=1.
WITH ranked AS (
  SELECT id,
         CASE WHEN slugify(title) = '' THEN left(id::text, 8) ELSE slugify(title) END AS base,
         row_number() OVER (
           PARTITION BY (CASE WHEN slugify(title) = '' THEN left(id::text, 8) ELSE slugify(title) END)
           ORDER BY created_at, id
         ) AS rn
  FROM stories
)
UPDATE stories s SET slug = CASE WHEN r.rn = 1 THEN r.base ELSE r.base || '-' || r.rn END
FROM ranked r WHERE s.id = r.id AND s.slug IS NULL;

WITH ranked AS (
  SELECT id,
         CASE WHEN slugify(name) = '' THEN left(id::text, 8) ELSE slugify(name) END AS base,
         row_number() OVER (
           PARTITION BY (CASE WHEN slugify(name) = '' THEN left(id::text, 8) ELSE slugify(name) END)
           ORDER BY created_at, id
         ) AS rn
  FROM expeditions
)
UPDATE expeditions e SET slug = CASE WHEN r.rn = 1 THEN r.base ELSE r.base || '-' || r.rn END
FROM ranked r WHERE e.id = r.id AND e.slug IS NULL;

WITH ranked AS (
  SELECT id,
         CASE WHEN slugify(title) = '' THEN left(id::text, 8) ELSE slugify(title) END AS base,
         row_number() OVER (
           PARTITION BY (CASE WHEN slugify(title) = '' THEN left(id::text, 8) ELSE slugify(title) END)
           ORDER BY created_at, id
         ) AS rn
  FROM story_series
)
UPDATE story_series ss SET slug = CASE WHEN r.rn = 1 THEN r.base ELSE r.base || '-' || r.rn END
FROM ranked r WHERE ss.id = r.id AND ss.slug IS NULL;

WITH ranked AS (
  SELECT id,
         CASE WHEN slugify(name) = '' THEN left(id::text, 8) ELSE slugify(name) END AS base,
         row_number() OVER (
           PARTITION BY (CASE WHEN slugify(name) = '' THEN left(id::text, 8) ELSE slugify(name) END)
           ORDER BY created_at, id
         ) AS rn
  FROM activities
)
UPDATE activities a SET slug = CASE WHEN r.rn = 1 THEN r.base ELSE r.base || '-' || r.rn END
FROM ranked r WHERE a.id = r.id AND a.slug IS NULL;

-- 3. NOT NULL + unique index
ALTER TABLE stories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE expeditions ALTER COLUMN slug SET NOT NULL;
ALTER TABLE story_series ALTER COLUMN slug SET NOT NULL;
ALTER TABLE activities ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stories_slug_key ON stories (slug);
CREATE UNIQUE INDEX IF NOT EXISTS expeditions_slug_key ON expeditions (slug);
CREATE UNIQUE INDEX IF NOT EXISTS story_series_slug_key ON story_series (slug);
CREATE UNIQUE INDEX IF NOT EXISTS activities_slug_key ON activities (slug);

-- 4. Auto-slug on insert. Generic over TG_ARGV[0] = source column name so one function
-- serves all 4 tables. FOUND is not reliable after EXECUTE ... INTO, so collision checks
-- use EXISTS(...) INTO a boolean explicitly instead.
CREATE OR REPLACE FUNCTION public.set_slug() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  src text;
  base text;
  candidate text;
  taken boolean;
  suffix integer := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;

  EXECUTE format('SELECT ($1).%I::text', TG_ARGV[0]) INTO src USING NEW;

  base := public.slugify(src);
  IF base = '' THEN
    base := left(NEW.id::text, 8);
  END IF;

  candidate := base;
  LOOP
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE slug = $1)', TG_TABLE_NAME) INTO taken USING candidate;
    EXIT WHEN NOT taken;
    suffix := suffix + 1;
    candidate := base || '-' || suffix;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER stories_set_slug BEFORE INSERT ON stories
  FOR EACH ROW EXECUTE FUNCTION public.set_slug('title');
CREATE OR REPLACE TRIGGER expeditions_set_slug BEFORE INSERT ON expeditions
  FOR EACH ROW EXECUTE FUNCTION public.set_slug('name');
CREATE OR REPLACE TRIGGER story_series_set_slug BEFORE INSERT ON story_series
  FOR EACH ROW EXECUTE FUNCTION public.set_slug('title');
CREATE OR REPLACE TRIGGER activities_set_slug BEFORE INSERT ON activities
  FOR EACH ROW EXECUTE FUNCTION public.set_slug('name');

-- 5. Redirect history for changed slugs, so old URLs 301 instead of 404.
CREATE TABLE IF NOT EXISTS slug_redirects (
  entity_type text NOT NULL CHECK (entity_type IN ('story','expedition','series','destination','activity','location')),
  old_slug    text NOT NULL,
  entity_id   uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, old_slug)
);

ALTER TABLE slug_redirects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slug_redirects public read" ON slug_redirects;
CREATE POLICY "slug_redirects public read"
  ON slug_redirects FOR SELECT USING (true);

-- No write policies: rows are only ever written by record_slug_change() below, which is
-- SECURITY DEFINER and bypasses RLS.

-- 6. Record old slug on change, and clear any redirect that pointed at the slug being
-- reclaimed (prevents A->B->A redirect loops).
CREATE OR REPLACE FUNCTION public.record_slug_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    INSERT INTO slug_redirects (entity_type, old_slug, entity_id)
    VALUES (TG_ARGV[0], OLD.slug, NEW.id)
    ON CONFLICT (entity_type, old_slug) DO UPDATE SET entity_id = EXCLUDED.entity_id;

    DELETE FROM slug_redirects
    WHERE entity_type = TG_ARGV[0] AND old_slug = NEW.slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER stories_record_slug_change AFTER UPDATE OF slug ON stories
  FOR EACH ROW EXECUTE FUNCTION public.record_slug_change('story');
CREATE OR REPLACE TRIGGER expeditions_record_slug_change AFTER UPDATE OF slug ON expeditions
  FOR EACH ROW EXECUTE FUNCTION public.record_slug_change('expedition');
CREATE OR REPLACE TRIGGER story_series_record_slug_change AFTER UPDATE OF slug ON story_series
  FOR EACH ROW EXECUTE FUNCTION public.record_slug_change('series');
CREATE OR REPLACE TRIGGER activities_record_slug_change AFTER UPDATE OF slug ON activities
  FOR EACH ROW EXECUTE FUNCTION public.record_slug_change('activity');
