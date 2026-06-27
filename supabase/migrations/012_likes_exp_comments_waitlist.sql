-- Story likes
CREATE TABLE IF NOT EXISTS story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(story_id, user_id)
);
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "story_likes public read" ON story_likes FOR SELECT USING (true);
CREATE POLICY "story_likes auth insert" ON story_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "story_likes auth delete" ON story_likes FOR DELETE USING (auth.uid() = user_id);

-- Expedition comments
CREATE TABLE IF NOT EXISTS expedition_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedition_id uuid REFERENCES expeditions(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  author_handle text NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE expedition_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedition_comments public read" ON expedition_comments FOR SELECT USING (true);
CREATE POLICY "expedition_comments auth insert" ON expedition_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "expedition_comments author delete" ON expedition_comments FOR DELETE
  USING (auth.uid() = author_id);
CREATE POLICY "expedition_comments admin delete" ON expedition_comments FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Expedition waitlist
CREATE TABLE IF NOT EXISTS expedition_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedition_id uuid REFERENCES expeditions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(expedition_id, user_id)
);
ALTER TABLE expedition_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedition_waitlist public read" ON expedition_waitlist FOR SELECT USING (true);
CREATE POLICY "expedition_waitlist auth insert" ON expedition_waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expedition_waitlist auth delete" ON expedition_waitlist FOR DELETE
  USING (auth.uid() = user_id);
