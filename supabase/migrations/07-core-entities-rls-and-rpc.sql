-- Core entities, indexes, RLS policies, and dashboard RPCs

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user','admin','service')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  content jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quiz_content(id) on delete cascade,
  status text not null default 'started' check (status in ('started','completed','abandoned')),
  score numeric(5,2),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid references public.quiz_attempts(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'ok' check (status in ('ok','warning','error')),
  created_at timestamptz not null default now()
);

create table if not exists public.scheduled_tasks_log (
  id bigint generated always as identity primary key,
  task_name text not null,
  status text not null check (status in ('queued','running','success','failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_created_at on public.user_profiles(created_at);
create index if not exists idx_quiz_content_created_at on public.quiz_content(created_at);
create index if not exists idx_quiz_content_status on public.quiz_content(status);
create index if not exists idx_quiz_attempts_user_id on public.quiz_attempts(user_id);
create index if not exists idx_quiz_attempts_created_at on public.quiz_attempts(created_at);
create index if not exists idx_quiz_attempts_status on public.quiz_attempts(status);
create index if not exists idx_user_events_user_id on public.user_events(user_id);
create index if not exists idx_user_events_created_at on public.user_events(created_at);
create index if not exists idx_user_events_status on public.user_events(status);
create index if not exists idx_scheduled_tasks_log_created_at on public.scheduled_tasks_log(created_at);
create index if not exists idx_scheduled_tasks_log_status on public.scheduled_tasks_log(status);

alter table public.user_profiles enable row level security;
alter table public.quiz_content enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.user_events enable row level security;
alter table public.scheduled_tasks_log enable row level security;

create policy if not exists user_profiles_owner_rw on public.user_profiles
for all to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy if not exists user_profiles_admin_all on public.user_profiles
for all to service_role
using (true)
with check (true);

create policy if not exists quiz_content_owner_rw on public.quiz_content
for all to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy if not exists quiz_content_admin_all on public.quiz_content
for all to service_role
using (true)
with check (true);

create policy if not exists quiz_attempts_owner_rw on public.quiz_attempts
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy if not exists quiz_attempts_admin_all on public.quiz_attempts
for all to service_role
using (true)
with check (true);

create policy if not exists user_events_owner_rw on public.user_events
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy if not exists user_events_admin_all on public.user_events
for all to service_role
using (true)
with check (true);

create policy if not exists scheduled_tasks_log_admin_all on public.scheduled_tasks_log
for all to service_role
using (true)
with check (true);

create or replace function public.rpc_dashboard_attempt_summary(p_from timestamptz default now() - interval '30 days')
returns table(total_attempts bigint, completed_attempts bigint, avg_score numeric)
language sql
security definer
set search_path = public
as $$
  select
    count(*)::bigint as total_attempts,
    count(*) filter (where status = 'completed')::bigint as completed_attempts,
    coalesce(avg(score), 0)::numeric as avg_score
  from public.quiz_attempts
  where created_at >= p_from;
$$;

create or replace function public.rpc_cron_stale_attempts(p_older_than interval default interval '2 hours')
returns table(attempt_id uuid, user_id uuid, started_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select id, user_id, started_at
  from public.quiz_attempts
  where status = 'started'
    and started_at < now() - p_older_than;
$$;
