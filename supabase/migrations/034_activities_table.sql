CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

INSERT INTO activities (name) VALUES
  ('Hiking'), ('Mountaineering'), ('Camping'),
  ('Cycling'), ('Diving'), ('Surfing'),
  ('Kayaking'), ('Other');

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities public read"
  ON activities FOR SELECT USING (true);

CREATE POLICY "admins manage activities"
  ON activities FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
