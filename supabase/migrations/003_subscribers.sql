create table email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz default now()
);

alter table email_subscribers enable row level security;

-- Only service role can read (admin only, not exposed to client)
-- Public can insert their own email
create policy "anyone can subscribe"
  on email_subscribers for insert
  with check (true);
