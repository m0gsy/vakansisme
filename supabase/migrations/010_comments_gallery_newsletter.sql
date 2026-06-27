-- Add email to profiles (for story approval notifications)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Story comments
CREATE TABLE IF NOT EXISTS story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  author_handle text NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_comments public read" ON story_comments FOR SELECT USING (true);
CREATE POLICY "story_comments auth insert" ON story_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "story_comments author delete" ON story_comments FOR DELETE
  USING (auth.uid() = author_id);
CREATE POLICY "story_comments admin delete" ON story_comments FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Expedition gallery
CREATE TABLE IF NOT EXISTS expedition_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedition_id uuid REFERENCES expeditions(id) ON DELETE CASCADE NOT NULL,
  uploader_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  uploader_handle text NOT NULL,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE expedition_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expedition_gallery public read" ON expedition_gallery FOR SELECT USING (true);
CREATE POLICY "expedition_gallery member insert" ON expedition_gallery FOR INSERT
  WITH CHECK (
    auth.uid() = uploader_id AND
    EXISTS (
      SELECT 1 FROM expedition_members
      WHERE expedition_id = expedition_gallery.expedition_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "expedition_gallery owner delete" ON expedition_gallery FOR DELETE
  USING (auth.uid() = uploader_id);
CREATE POLICY "expedition_gallery admin delete" ON expedition_gallery FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Storage bucket for gallery
INSERT INTO storage.buckets (id, name, public)
  VALUES ('gallery', 'gallery', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "gallery public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');
CREATE POLICY "gallery auth upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);
CREATE POLICY "gallery owner delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery' AND auth.uid()::text = (storage.foldername(name))[1]);
