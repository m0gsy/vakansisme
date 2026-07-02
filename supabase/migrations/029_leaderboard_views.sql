-- Aggregation views to replace full-table-scan leaderboard queries
CREATE OR REPLACE VIEW leaderboard_trips AS
  SELECT em.user_id, COUNT(*) AS trip_count, p.username, p.avatar_url
  FROM expedition_members em
  JOIN profiles p ON p.id = em.user_id
  WHERE em.status = 'approved'
  GROUP BY em.user_id, p.username, p.avatar_url
  ORDER BY trip_count DESC
  LIMIT 20;

CREATE OR REPLACE VIEW leaderboard_stories AS
  SELECT s.author_id AS user_id, COUNT(*) AS story_count, p.username, p.avatar_url
  FROM stories s
  JOIN profiles p ON p.id = s.author_id
  WHERE s.published = true
  GROUP BY s.author_id, p.username, p.avatar_url
  ORDER BY story_count DESC
  LIMIT 20;

-- Trending stories view (replaces full story_likes scan + JS aggregation)
CREATE OR REPLACE VIEW trending_stories AS
  SELECT sl.story_id, COUNT(*) AS like_count
  FROM story_likes sl
  WHERE sl.created_at >= now() - interval '7 days'
  GROUP BY sl.story_id
  ORDER BY like_count DESC
  LIMIT 4;
