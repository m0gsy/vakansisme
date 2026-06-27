-- Full-text search indexes
CREATE INDEX IF NOT EXISTS expeditions_fts_idx ON expeditions
  USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(location, '') || ' ' || coalesce(description, '')));

CREATE INDEX IF NOT EXISTS stories_fts_idx ON stories
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, '')));

CREATE INDEX IF NOT EXISTS profiles_fts_idx ON profiles
  USING GIN (to_tsvector('english', coalesce(username, '') || ' ' || coalesce(bio, '')));
