-- Dynamic destination kinds: admin can add kinds beyond mountain/trail/national_park
-- without a code deploy. Replaces the inline CHECK on destinations.kind with a FK to
-- a destination_kinds lookup table (mirrors activities' pattern from 034).

CREATE TABLE destination_kinds (
  name text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO destination_kinds (name) VALUES ('mountain'), ('trail'), ('national_park');

-- Drop the unnamed CHECK from 037 (`kind IN (...)`). Postgres stores IN-lists rewritten
-- as `= ANY (ARRAY[...])`, so a `%IN%` match pattern would never fire; target the
-- deterministic auto-generated name first, then fall back to scanning the rendered
-- definition for the literal kind values.
DO $$ DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
  WHERE conrelid = 'destinations'::regclass AND contype = 'c'
    AND conname = 'destinations_kind_check';
  IF c IS NULL THEN
    SELECT conname INTO c FROM pg_constraint
    WHERE conrelid = 'destinations'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%mountain%trail%national_park%';
  END IF;
  IF c IS NOT NULL THEN EXECUTE format('ALTER TABLE destinations DROP CONSTRAINT %I', c); END IF;
END $$;

-- Trail-parent CHECK (kind <> 'trail' OR parent_id IS NOT NULL) is untouched.

ALTER TABLE destinations ADD CONSTRAINT destinations_kind_fkey
  FOREIGN KEY (kind) REFERENCES destination_kinds(name) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE destination_kinds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "destination_kinds public read"
  ON destination_kinds FOR SELECT USING (true);

CREATE POLICY "admins manage destination_kinds"
  ON destination_kinds FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
