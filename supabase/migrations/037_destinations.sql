-- SEO: locations (province/city) + destinations (mountain/trail/national_park) tables,
-- FKs from expeditions/stories, RLS, and slug triggers (mirrors 034/036 patterns).

-- FK delete behavior: parent_id uses RESTRICT, not SET NULL. Both tables' CHECK
-- constraints require non-null parent_id for the child kind (city needs a province,
-- trail needs a mountain). SET NULL on delete would let a parent-delete null out a
-- child's parent_id and violate that CHECK. RESTRICT forces the admin to delete/
-- reparent children first, which is the only behavior consistent with the CHECKs.
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('province','city')),
  name text NOT NULL,
  slug text UNIQUE,
  parent_id uuid REFERENCES locations(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((type = 'province' AND parent_id IS NULL) OR (type = 'city' AND parent_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('mountain','trail','national_park')),
  name text NOT NULL,
  slug text UNIQUE,
  parent_id uuid REFERENCES destinations(id) ON DELETE RESTRICT,   -- trail -> mountain
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  elevation_m int,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (kind <> 'trail' OR parent_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS destinations_kind_idx ON destinations (kind);
CREATE INDEX IF NOT EXISTS destinations_location_idx ON destinations (location_id);
CREATE INDEX IF NOT EXISTS destinations_parent_idx ON destinations (parent_id);

-- slug stays nullable-with-UNIQUE: set_slug() (from 036) fills it on every INSERT
-- before the row is visible, and both tables start empty, so there is no legacy
-- data to backfill and no window where slug is null for a real row.
CREATE OR REPLACE TRIGGER locations_set_slug BEFORE INSERT ON locations
  FOR EACH ROW EXECUTE FUNCTION public.set_slug('name');
CREATE OR REPLACE TRIGGER destinations_set_slug BEFORE INSERT ON destinations
  FOR EACH ROW EXECUTE FUNCTION public.set_slug('name');

CREATE OR REPLACE TRIGGER locations_record_slug_change AFTER UPDATE OF slug ON locations
  FOR EACH ROW EXECUTE FUNCTION public.record_slug_change('location');
CREATE OR REPLACE TRIGGER destinations_record_slug_change AFTER UPDATE OF slug ON destinations
  FOR EACH ROW EXECUTE FUNCTION public.record_slug_change('destination');

-- FKs from existing entities to their destination (slug_redirects CHECK in 036
-- already allows 'destination' and 'location', so no ALTER needed there).
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS expeditions_destination_idx ON expeditions (destination_id);
CREATE INDEX IF NOT EXISTS stories_destination_idx ON stories (destination_id);

-- RLS: mirror 034's exact style (public read, admin full access via profiles.is_admin).
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locations public read" ON locations;
CREATE POLICY "locations public read"
  ON locations FOR SELECT USING (true);

DROP POLICY IF EXISTS "admins manage locations" ON locations;
CREATE POLICY "admins manage locations"
  ON locations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "destinations public read" ON destinations;
CREATE POLICY "destinations public read"
  ON destinations FOR SELECT USING (true);

DROP POLICY IF EXISTS "admins manage destinations" ON destinations;
CREATE POLICY "admins manage destinations"
  ON destinations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
