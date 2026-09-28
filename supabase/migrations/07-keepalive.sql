-- Keep-alive for the Supabase free tier (a project is paused after 7 days without activity).
-- Called by GET /api/cron/keepalive (Vercel Cron, daily) and by the GitHub Actions backup
-- (.github/workflows/supabase-keepalive.yml). Only the service role may call it.
-- Idempotent: safe to run more than once.

-- 1) Single-row heartbeat table
create table if not exists public.keepalive (
  id smallint primary key default 1 check (id = 1),
  last_ping_at timestamptz not null default now(),
  ping_count bigint not null default 0
);

comment on table public.keepalive is
  'Single-row heartbeat written by keepalive_ping() so the free-tier project never counts as inactive.';

-- RLS on with no policies: invisible to anon / authenticated through the Data API.
alter table public.keepalive enable row level security;

-- Supabase grants new public tables to anon/authenticated by default; take that back as well.
revoke all on table public.keepalive from public, anon, authenticated;
grant select, insert, update on table public.keepalive to service_role;

-- 2) Ping function: upserts the single row and returns the ping time
create or replace function public.keepalive_ping()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  pinged_at timestamptz := now();
begin
  insert into public.keepalive as k (id, last_ping_at, ping_count)
  values (1, pinged_at, 1)
  on conflict (id) do update
    set last_ping_at = excluded.last_ping_at,
        ping_count = k.ping_count + 1;

  return pinged_at;
end;
$$;

comment on function public.keepalive_ping() is
  'Heartbeat for the free-tier keep-alive cron. Service role only.';

-- Functions are executable by PUBLIC by default, and Supabase also grants anon/authenticated.
revoke execute on function public.keepalive_ping() from public, anon, authenticated;
grant execute on function public.keepalive_ping() to service_role;
