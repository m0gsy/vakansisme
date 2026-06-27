create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  bio text,
  avatar_url text,
  created_at timestamptz default now()
);

create table follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

alter table profiles enable row level security;
alter table follows enable row level security;

create policy "profiles are public"
  on profiles for select using (true);

create policy "users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "follows are public"
  on follows for select using (true);

create policy "auth users can follow"
  on follows for insert
  with check (auth.uid() = follower_id);

create policy "users can unfollow"
  on follows for delete
  using (auth.uid() = follower_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
