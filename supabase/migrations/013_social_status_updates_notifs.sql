-- Social links on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_handle text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS strava_url text;

-- Expedition status
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'upcoming'
  CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled'));

-- Leader update posts
CREATE TABLE IF NOT EXISTS expedition_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedition_id uuid REFERENCES expeditions(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE expedition_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedition_updates public read" ON expedition_updates FOR SELECT USING (true);
CREATE POLICY "expedition_updates author insert" ON expedition_updates FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "expedition_updates author delete" ON expedition_updates FOR DELETE USING (auth.uid() = author_id);

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications own read" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications own update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications service insert" ON notifications FOR INSERT WITH CHECK (true);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_id, read) WHERE read = false;
