-- Performance indexes on high-query-volume tables
CREATE INDEX IF NOT EXISTS idx_expedition_members_expedition_id ON expedition_members(expedition_id);
CREATE INDEX IF NOT EXISTS idx_expedition_members_user_id ON expedition_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expedition_members_status ON expedition_members(status);
CREATE INDEX IF NOT EXISTS idx_expedition_members_payment_due ON expedition_members(payment_due_at) WHERE status = 'pending_payment';

CREATE INDEX IF NOT EXISTS idx_expedition_reviews_expedition_id ON expedition_reviews(expedition_id);

CREATE INDEX IF NOT EXISTS idx_expedition_comments_expedition_id ON expedition_comments(expedition_id);

CREATE INDEX IF NOT EXISTS idx_expedition_gallery_expedition_id ON expedition_gallery(expedition_id);
CREATE INDEX IF NOT EXISTS idx_expedition_gallery_status ON expedition_gallery(status);

CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_chaos_reactions_chaos_id ON chaos_reactions(chaos_id);
