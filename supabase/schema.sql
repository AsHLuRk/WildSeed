-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
create table if not exists public.shares (
  id          text primary key,
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

-- Row Level Security ON with NO policies = the public/anon key can't read or write.
-- Only the server (service-role key, kept in env vars) touches this table, via the API routes.
alter table public.shares enable row level security;

create index if not exists shares_created_at_idx on public.shares (created_at);

-- Optional housekeeping: delete shares older than 90 days (run manually or schedule it).
-- delete from public.shares where created_at < now() - interval '90 days';
