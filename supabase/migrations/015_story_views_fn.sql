-- Function to safely increment story view count
CREATE OR REPLACE FUNCTION increment_story_views(story_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE stories SET view_count = COALESCE(view_count, 0) + 1 WHERE id = story_id AND published = true;
$$;
