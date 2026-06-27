create table chaos_submissions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete set null,
  author_handle text not null,
  type text not null check (type in ('failed shot', 'absurd quote', 'shaky video', 'inside joke', 'chaos moment')),
  caption text not null,
  image_url text,
  approved boolean default true,
  rotation numeric default 0,
  accent_color text default '#9BFF3C',
  created_at timestamptz default now()
);

alter table chaos_submissions enable row level security;

create policy "approved submissions are public"
  on chaos_submissions for select using (approved = true);

create policy "auth users can submit"
  on chaos_submissions for insert
  with check (auth.uid() = author_id);

create policy "authors can delete own"
  on chaos_submissions for delete
  using (auth.uid() = author_id);

-- Seed with existing hardcoded cards
insert into chaos_submissions (author_handle, type, caption, rotation, accent_color) values
('@the_finger', 'failed shot', 'Was supposed to be a dramatic sunset. Finger photobombed it.', -2.4, '#FF6B1A'),
('@lost_not_lost', 'absurd quote', 'We just misread the map. That''s not getting lost, that''s an unplanned adventure.', 1.8, '#9BFF3C'),
('@shaky_cam', 'shaky video', 'Frame rate: anxiety. Resolution: vibes. ISO: way too dark.', -1.0, '#FF6B1A'),
('@tired_knees', 'inside joke', 'Trip leader: "Almost there." Time: 2:17 AM. Knees: already filing complaints.', 3.2, '#9BFF3C'),
('@auto_betrayal', 'failed shot', 'The sunrise photo we waited 4 hours for. Auto-brightness: not cooperating.', -0.7, '#FF6B1A'),
('@still_ok', 'chaos moment', 'Tent: collapsed. Instant noodles: gone. Rain cover: disappeared. Vibes: still okay.', 2.5, '#9BFF3C');
