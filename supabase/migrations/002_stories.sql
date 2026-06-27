create table stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete set null,
  author_handle text not null,
  type text not null check (type in ('photo dump', 'short story', 'video POV', 'chaos moment')),
  title text not null,
  excerpt text,
  content text,
  image_url text,
  published boolean default true,
  created_at timestamptz default now()
);

alter table stories enable row level security;

create policy "published stories are public"
  on stories for select using (published = true);

create policy "auth users can post"
  on stories for insert
  with check (auth.uid() = author_id);

create policy "authors can edit own"
  on stories for update
  using (auth.uid() = author_id);

create policy "authors can delete own"
  on stories for delete
  using (auth.uid() = author_id);

-- Seed
insert into stories (author_handle, type, title, excerpt, image_url) values
(
  '@chaos_hiker',
  'photo dump',
  'Three Days Above the Clouds, Back With Scars & Stories',
  'We got lost for 4 hours. Broken compass. Dead GPS. But the view...',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80'
),
(
  '@leaky_tent',
  'short story',
  'Why Does It Always Rain Right After We Set Up Camp?',
  'A question that never has an answer.',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80'
),
(
  '@vertigo_summit',
  'video POV',
  'Summit Attack 2 AM — Shaky Cam Edition',
  'Momentum matters. Cinematography doesn''t.',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80'
),
(
  '@no_sense_of_direction',
  'chaos moment',
  'Lost Trail Chronicles: The Universe Tests Us',
  'GPS said left. Instinct said right. Both were wrong.',
  'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?auto=format&fit=crop&w=800&q=80'
);
