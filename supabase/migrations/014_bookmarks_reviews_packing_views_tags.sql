-- Story view count
ALTER TABLE stories ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Story tags
ALTER TABLE stories ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  expedition_id uuid REFERENCES expeditions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, expedition_id)
);
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks own" ON bookmarks USING (auth.uid() = user_id);
CREATE POLICY "bookmarks insert" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks delete" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Expedition reviews
CREATE TABLE IF NOT EXISTS expedition_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedition_id uuid REFERENCES expeditions(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content text CHECK (char_length(content) <= 800),
  created_at timestamptz DEFAULT now(),
  UNIQUE(expedition_id, reviewer_id)
);
ALTER TABLE expedition_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON expedition_reviews FOR SELECT USING (true);
CREATE POLICY "reviews member insert" ON expedition_reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (SELECT 1 FROM expedition_members WHERE expedition_id = expedition_reviews.expedition_id AND user_id = auth.uid())
);
CREATE POLICY "reviews own delete" ON expedition_reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- Packing list items (per expedition, set by leader)
CREATE TABLE IF NOT EXISTS expedition_packing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedition_id uuid REFERENCES expeditions(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 100),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE expedition_packing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packing public read" ON expedition_packing_items FOR SELECT USING (true);
CREATE POLICY "packing leader insert" ON expedition_packing_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM expeditions e
    JOIN profiles p ON p.username = REPLACE(e.leader_handle, '@', '')
    WHERE e.id = expedition_packing_items.expedition_id AND p.id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "packing leader delete" ON expedition_packing_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM expeditions e
    JOIN profiles p ON p.username = REPLACE(e.leader_handle, '@', '')
    WHERE e.id = expedition_packing_items.expedition_id AND p.id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
