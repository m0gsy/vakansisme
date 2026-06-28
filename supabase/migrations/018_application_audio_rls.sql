-- Application notes for joining expeditions
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS application_prompt text;
ALTER TABLE expedition_members ADD COLUMN IF NOT EXISTS notes text;

-- Story audio and expedition link (expedition_id already in 017, safe to re-run)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS expedition_id uuid REFERENCES expeditions(id) ON DELETE SET NULL;

-- Avg rating view for expedition listing cards
CREATE OR REPLACE VIEW expedition_ratings AS
  SELECT
    expedition_id,
    ROUND(AVG(rating)::numeric, 1) AS avg_rating,
    COUNT(*)::int AS review_count
  FROM expedition_reviews
  GROUP BY expedition_id;

-- RLS audit: enable on all tables (idempotent)
ALTER TABLE expedition_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedition_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedition_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedition_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedition_packing_items ENABLE ROW LEVEL SECURITY;

-- Expedition reviews
DO $$ BEGIN CREATE POLICY "exp_reviews_read" ON expedition_reviews FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "exp_reviews_insert" ON expedition_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "exp_reviews_delete" ON expedition_reviews FOR DELETE USING (auth.uid() = reviewer_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Expedition comments
DO $$ BEGIN CREATE POLICY "exp_comments_read" ON expedition_comments FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "exp_comments_insert" ON expedition_comments FOR INSERT WITH CHECK (auth.uid() = author_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "exp_comments_delete" ON expedition_comments FOR DELETE USING (auth.uid() = author_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Story comments
DO $$ BEGIN CREATE POLICY "story_comments_read" ON story_comments FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "story_comments_insert" ON story_comments FOR INSERT WITH CHECK (auth.uid() = author_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "story_comments_delete" ON story_comments FOR DELETE USING (auth.uid() = author_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Story likes
DO $$ BEGIN CREATE POLICY "story_likes_read" ON story_likes FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "story_likes_own" ON story_likes USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bookmarks
DO $$ BEGIN CREATE POLICY "bookmarks_own" ON bookmarks USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Waitlist
DO $$ BEGIN CREATE POLICY "waitlist_read" ON expedition_waitlist FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "waitlist_own" ON expedition_waitlist USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Updates
DO $$ BEGIN CREATE POLICY "updates_read" ON expedition_updates FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "updates_insert" ON expedition_updates FOR INSERT WITH CHECK (auth.uid() = author_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "updates_delete" ON expedition_updates FOR DELETE USING (auth.uid() = author_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- expedition_packing_items: RLS + policies already set correctly in migration 014 (leader-based, no added_by column)
