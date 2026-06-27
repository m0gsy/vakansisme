-- Expeditions
create table expeditions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  difficulty text not null,
  price text not null,
  date_start date not null,
  date_end date not null,
  leader_handle text not null,
  quota_max integer not null default 20,
  image_url text,
  created_at timestamptz default now()
);

-- Who joined which trip
create table expedition_members (
  id uuid primary key default gen_random_uuid(),
  expedition_id uuid not null references expeditions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(expedition_id, user_id)
);

-- RLS
alter table expeditions enable row level security;
alter table expedition_members enable row level security;

create policy "expeditions are public"
  on expeditions for select using (true);

create policy "members are public"
  on expedition_members for select using (true);

create policy "auth users can join"
  on expedition_members for insert
  with check (auth.uid() = user_id);

create policy "users can leave"
  on expedition_members for delete
  using (auth.uid() = user_id);

-- Seed with existing landing page trips
insert into expeditions (name, location, difficulty, price, date_start, date_end, leader_handle, quota_max, image_url) values
(
  'Escape Reality Vol. 1',
  'Rinjani, Indonesia',
  'Level: Pretty Chaotic',
  'Rp 850K',
  '2025-07-12', '2025-07-15',
  '@rinjani_survivor',
  20,
  'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80'
),
(
  'Summit Therapy: Still Haven''t Moved On',
  'Bromo, Indonesia',
  'Level: Very Chill',
  'Rp 450K',
  '2025-07-05', '2025-07-06',
  '@bromo_chaos',
  15,
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80'
),
(
  'Camp Without Drama (lying)',
  'Semeru, Indonesia',
  'Level: Full Chaos',
  'Rp 1.2JT',
  '2025-07-19', '2025-07-23',
  '@semeru_still_alive',
  12,
  'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?auto=format&fit=crop&w=800&q=80'
);
