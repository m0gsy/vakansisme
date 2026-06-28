-- FTS: generated tsvector columns (replaces expression-only indexes from 016)
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name,'') || ' ' || coalesce(location,'') || ' ' || coalesce(description,''))
  ) STORED;
DROP INDEX IF EXISTS expeditions_fts_idx;
CREATE INDEX IF NOT EXISTS expeditions_fts_idx ON expeditions USING GIN(fts);

ALTER TABLE stories ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,''))
  ) STORED;
DROP INDEX IF EXISTS stories_fts_idx;
CREATE INDEX IF NOT EXISTS stories_fts_idx ON stories USING GIN(fts);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(username,'') || ' ' || coalesce(bio,''))
  ) STORED;
DROP INDEX IF EXISTS profiles_fts_idx;
CREATE INDEX IF NOT EXISTS profiles_fts_idx ON profiles USING GIN(fts);

-- Unified newsletter subscribers (canonical table)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "newsletter anon insert" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "newsletter admin read" ON newsletter_subscribers FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Content reports
CREATE TABLE IF NOT EXISTS content_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('story','chaos','profile','comment')),
  content_id   text NOT NULL,
  reason       text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  created_at   timestamptz DEFAULT now(),
  resolved     boolean DEFAULT false,
  UNIQUE(reporter_id, content_type, content_id)
);
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "reports insert" ON content_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "reports admin read" ON content_reports FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "reports admin update" ON content_reports FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Chaos reactions (fire emoji toggle)
CREATE TABLE IF NOT EXISTS chaos_reactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  chaos_id   uuid REFERENCES chaos_submissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chaos_id)
);
ALTER TABLE chaos_reactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "reactions read" ON chaos_reactions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "reactions own" ON chaos_reactions USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Story → expedition link
ALTER TABLE stories ADD COLUMN IF NOT EXISTS expedition_id uuid REFERENCES expeditions(id) ON DELETE SET NULL;

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_on_join    boolean DEFAULT true,
  email_on_story   boolean DEFAULT true,
  email_on_status  boolean DEFAULT true,
  email_newsletter boolean DEFAULT true
);
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "prefs own" ON notification_prefs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profiles: store email for notifications without service role
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
