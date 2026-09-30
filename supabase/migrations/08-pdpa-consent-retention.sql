-- ============================================================================
-- 08 · PDPA (พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562): consent log, retention, erasure
-- ============================================================================
-- Database side of lib/privacy/policy.ts (POLICY_VERSION 2026-09-28):
--   1. survey_responses: gender + policy_version columns; writes only through the server.
--   2. quiz_sessions: anonymised_at marker (+ the device columns the app already writes).
--   3. pdpa_consent_log: append-only record of every consent / withdrawal (s.19).
--   4. survey_demographics_monthly: what demographics become once their retention ends.
--   5. pdpa_current_subject(): the verified anon identity behind a request (Server Actions).
--   6. pdpa_retention_purge(): applies RETENTION; pg_cron runs it daily at 02:30 Asia/Bangkok.
--   7. pdpa_erase_subject() (s.33) / pdpa_erase_demographics() (consent withdrawn, s.19).
--
-- Idempotent: safe to run more than once.
-- Deploy together with lib/actions/survey.ts: from here on anon / authenticated can no longer write
-- survey_responses directly (the Server Action checks consent, then writes with the service role).
-- The first purge run rolls up + deletes survey rows older than 12 months and anonymises sessions
-- older than 24 months: take a backup first if older raw data must be kept for another reason.


-- ----------------------------------------------------------------------------
-- 0) Pin the search_path of the score-trigger functions from migration 01
-- ----------------------------------------------------------------------------

-- They name tables without a schema. The PDPA functions below run with an empty search_path
-- (security definer best practice) and triggers fired from inside them inherit it, so deleting
-- question_responses during an erasure would fail with "relation quiz_sessions does not exist".
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.trigger_update_total_score()',
    'public.calculate_total_summary_score(uuid)',
    'public.calculate_kpi_scores(uuid)'
  ] loop
    if to_regprocedure(fn) is not null then
      execute format('alter function %s set search_path = public', fn);
    end if;
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 1) survey_responses: data-minimised demographics, written only by the server
-- ----------------------------------------------------------------------------

alter table public.survey_responses add column if not exists gender text;
alter table public.survey_responses add column if not exists policy_version text;

do $$
begin
  -- No sexual-orientation options (would be sensitive data under s.26).
  if not exists (select 1 from pg_constraint where conname = 'chk_survey_responses_gender') then
    alter table public.survey_responses
      add constraint chk_survey_responses_gender
      check (gender is null or gender in ('female', 'male', 'other', 'unspecified'));
  end if;
end $$;

comment on column public.survey_responses.gender is
  'female | male | other | unspecified (ไม่ระบุ). NULL when not answered. Nothing is stored for minors (s.20).';
comment on column public.survey_responses.policy_version is
  'POLICY_VERSION of the privacy notice the demographics consent was given under (lib/privacy/policy.ts).';

-- submitSurveyAction verifies consent and session ownership, then writes with the service role.
-- Direct writes with the public key or an anon JWT would skip those checks.
revoke insert, update, delete, truncate on table public.survey_responses from anon, authenticated;
-- Nobody reads demographics through the API: every player's anon JWT has role "authenticated",
-- so a grant to that role would hand every respondent's row to every player. The portal reads
-- them with the service role behind the admin gate (lib/actions/advanced-analytics.ts).
revoke select on table public.survey_responses from public, anon, authenticated;
grant select, insert, update, delete on table public.survey_responses to service_role;
-- Defence in depth if a grant ever comes back: RLS on, and no policy for any API role.
alter table public.survey_responses enable row level security;


-- ----------------------------------------------------------------------------
-- 2) quiz_sessions: retention marker
-- ----------------------------------------------------------------------------

-- Written by create_quiz_session() in production but missing from migration 01; declared here so a
-- database built from these migrations alone has every column the purge touches.
alter table public.quiz_sessions add column if not exists device_type text;
alter table public.quiz_sessions add column if not exists user_agent text;

alter table public.quiz_sessions add column if not exists anonymised_at timestamptz;
comment on column public.quiz_sessions.anonymised_at is
  'Set by pdpa_retention_purge() when the session was stripped of identifiers (RETENTION.quizSessions).';

create index if not exists idx_quiz_sessions_anonymous_user_id
  on public.quiz_sessions (anonymous_user_id)
  where anonymous_user_id is not null;
create index if not exists idx_quiz_sessions_pdpa_retention
  on public.quiz_sessions (created_at)
  where anonymised_at is null;


-- ----------------------------------------------------------------------------
-- 3) pdpa_consent_log: append-only
-- ----------------------------------------------------------------------------

create table if not exists public.pdpa_consent_log (
  id uuid primary key default gen_random_uuid(),
  anonymous_user_id text not null,
  purpose text not null,
  granted boolean not null,
  policy_version text not null,
  created_at timestamptz not null default now(),
  constraint chk_pdpa_consent_log_user_prefix check (left(anonymous_user_id, 5) = 'user_'),
  -- Consent purposes (lib/privacy/policy.ts → CONSENT_PURPOSE_IDS). A new purpose needs a new
  -- notice version and a migration anyway.
  constraint chk_pdpa_consent_log_purpose check (purpose in ('demographics')),
  constraint chk_pdpa_consent_log_policy_version check (char_length(policy_version) between 1 and 32)
);

comment on table public.pdpa_consent_log is
  'PDPA s.19 consent record: one row per decision (withdrawal = new row with granted = false). '
  'Append-only; rows are removed only by pdpa_retention_purge() (after 5 years) or pdpa_erase_subject().';

create index if not exists idx_pdpa_consent_log_subject
  on public.pdpa_consent_log (anonymous_user_id, purpose, created_at desc);
create index if not exists idx_pdpa_consent_log_created_at
  on public.pdpa_consent_log (created_at);

-- Insert: the database clock decides created_at (no backdating). Update: never. Delete: only
-- inside the two PDPA functions below, which switch pdpa.allow_consent_log_delete on for their
-- own transaction.
create or replace function public.pdpa_consent_log_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    return new;
  end if;

  if tg_op = 'UPDATE' then
    raise exception 'pdpa_consent_log is append-only: record a new decision instead'
      using errcode = '42501';
  end if;

  if coalesce(current_setting('pdpa.allow_consent_log_delete', true), '') <> 'on' then
    raise exception 'pdpa_consent_log rows are removed only by pdpa_retention_purge() or pdpa_erase_subject()'
      using errcode = '42501';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_pdpa_consent_log_guard on public.pdpa_consent_log;
create trigger trg_pdpa_consent_log_guard
  before insert or update or delete on public.pdpa_consent_log
  for each row
  execute function public.pdpa_consent_log_guard();

alter table public.pdpa_consent_log enable row level security;

-- Same anon JWT claim check as migrations 05/06: the claim may be '<id>' or 'user_<id>'.
drop policy if exists "anon_jwt_select_pdpa_consent_log" on public.pdpa_consent_log;
create policy "anon_jwt_select_pdpa_consent_log"
on public.pdpa_consent_log
for select
to authenticated
using (
  (auth.jwt() ->> 'anon_user_id') IS NOT NULL
  AND (
    (auth.jwt() ->> 'anon_user_id') = anonymous_user_id
    OR anonymous_user_id = ('user_' || (auth.jwt() ->> 'anon_user_id'))
  )
);

drop policy if exists "anon_jwt_insert_pdpa_consent_log" on public.pdpa_consent_log;
create policy "anon_jwt_insert_pdpa_consent_log"
on public.pdpa_consent_log
for insert
to authenticated
with check (
  (auth.jwt() ->> 'anon_user_id') IS NOT NULL
  AND (
    (auth.jwt() ->> 'anon_user_id') = anonymous_user_id
    OR anonymous_user_id = ('user_' || (auth.jwt() ->> 'anon_user_id'))
  )
);

-- No update / delete policy on purpose. Supabase grants new tables to every API role: narrow that.
revoke all on table public.pdpa_consent_log from public, anon, authenticated, service_role;
grant select, insert on table public.pdpa_consent_log to authenticated;
grant select, insert, delete on table public.pdpa_consent_log to service_role;


-- ----------------------------------------------------------------------------
-- 4) survey_demographics_monthly: anonymous statistics left after the 12-month limit
-- ----------------------------------------------------------------------------

-- One count per month per single dimension (never a cross-tabulation), so no row describes a person.
create table if not exists public.survey_demographics_monthly (
  month date not null,
  dimension text not null
    check (dimension in ('age_group', 'gender', 'province', 'education', 'occupation')),
  value text not null,
  responses integer not null default 0 check (responses >= 0),
  -- Sessions with a score, and the sum of their total_summary_score (0–100): average = sum / count.
  scored_responses integer not null default 0 check (scored_responses >= 0),
  score_sum numeric(14, 2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (month, dimension, value)
);

comment on table public.survey_demographics_monthly is
  'Monthly single-dimension counts of survey_responses rows removed by pdpa_retention_purge() '
  '(month = Asia/Bangkok month of submission). Anonymous statistics, kept without a time limit.';

alter table public.survey_demographics_monthly enable row level security;
revoke all on table public.survey_demographics_monthly from public, anon, authenticated;
grant select on table public.survey_demographics_monthly to service_role;


-- ----------------------------------------------------------------------------
-- 5) pdpa_current_subject(): who is calling, as verified by PostgREST
-- ----------------------------------------------------------------------------

-- PostgREST checks the JWT signature and expiry before running this, so a Server Action can call it
-- with the caller's token and trust the answer (lib/privacy/identity.ts).
create or replace function public.pdpa_current_subject()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when nullif(auth.jwt() ->> 'anon_user_id', '') is null then null
    when left(auth.jwt() ->> 'anon_user_id', 5) = 'user_' then auth.jwt() ->> 'anon_user_id'
    else 'user_' || (auth.jwt() ->> 'anon_user_id')
  end;
$$;

comment on function public.pdpa_current_subject() is
  'anon_user_id claim of the verified request JWT, normalised to the stored user_<id> form (NULL without one).';

revoke execute on function public.pdpa_current_subject() from public, anon;
grant execute on function public.pdpa_current_subject() to authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 6) pdpa_retention_purge(): RETENTION (lib/privacy/policy.ts)
-- ----------------------------------------------------------------------------

create or replace function public.pdpa_retention_purge()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- RETENTION: keep in sync with lib/privacy/policy.ts (checked by __tests__/privacy/policy.test.ts).
  v_demographics_cutoff constant timestamptz := now() - interval '12 months';
  v_sessions_cutoff constant timestamptz := now() - interval '24 months';
  v_consent_cutoff constant timestamptz := now() - interval '60 months';

  v_demographics_deleted integer := 0;
  v_aggregate_rows integer := 0;
  v_sessions_anonymised integer := 0;
  v_consent_deleted integer := 0;
  v_legacy_anonymised integer := 0;
begin
  -- 1) Demographics (12 months): roll the expiring rows up into monthly counts, then delete them.
  --    One statement, so every deleted row is counted exactly once. A row without a submission
  --    time cannot prove it is recent and is treated as expired.
  with expired as (
    delete from public.survey_responses sr
    where sr.submitted_at is null or sr.submitted_at < v_demographics_cutoff
    returning
      sr.quiz_session_id,
      date_trunc('month', coalesce(sr.submitted_at, v_demographics_cutoff) at time zone 'Asia/Bangkok')::date
        as month,
      sr.age_group,
      sr.gender,
      sr.province,
      sr.education,
      sr.occupation
  ),
  scored as (
    select e.*, qs.total_summary_score as score
    from expired e
    left join public.quiz_sessions qs on qs.id = e.quiz_session_id
  ),
  marginals as (
    select s.month, 'age_group'::text as dimension, s.age_group as value, s.score from scored s
    union all select s.month, 'gender', s.gender, s.score from scored s
    union all select s.month, 'province', s.province, s.score from scored s
    union all select s.month, 'education', s.education, s.score from scored s
    union all select s.month, 'occupation', s.occupation, s.score from scored s
  ),
  upserted as (
    insert into public.survey_demographics_monthly as agg
      (month, dimension, value, responses, scored_responses, score_sum)
    select
      m.month,
      m.dimension,
      coalesce(nullif(btrim(m.value), ''), 'not_specified'),
      count(*),
      count(m.score),
      coalesce(sum(m.score), 0)
    from marginals m
    group by 1, 2, 3
    on conflict (month, dimension, value) do update
      set responses = agg.responses + excluded.responses,
          scored_responses = agg.scored_responses + excluded.scored_responses,
          score_sum = agg.score_sum + excluded.score_sum,
          updated_at = now()
    returning 1
  )
  select (select count(*) from expired), (select count(*) from upserted)
  into v_demographics_deleted, v_aggregate_rows;

  -- 2) Quiz sessions + answers (24 months): remove everything that links a session to a browser.
  --    Answers, scores, timings and device type stay as anonymous statistics.
  update public.quiz_sessions qs
  set
    anonymous_user_id = null,
    device_fingerprint = null,
    user_agent = null,
    session_id = 'anon_' || replace(qs.id::text, '-', ''),
    anonymised_at = now()
  where qs.anonymised_at is null
    and coalesce(qs.created_at, qs.started_at, qs.completed_at, '-infinity'::timestamptz) < v_sessions_cutoff;
  get diagnostics v_sessions_anonymised = row_count;

  -- 3) Consent log (60 months).
  perform set_config('pdpa.allow_consent_log_delete', 'on', true);
  delete from public.pdpa_consent_log cl where cl.created_at < v_consent_cutoff;
  get diagnostics v_consent_deleted = row_count;
  perform set_config('pdpa.allow_consent_log_delete', 'off', true);

  -- 4) Legacy snapshot of user_statistics taken on 2025-09-22 (not created by these migrations).
  --    Same rule as quiz sessions. Skipped with a warning if its shape is not what we expect.
  if to_regclass('public.user_statistics_backup_20250922') is not null then
    begin
      execute $sql$
        update public.user_statistics_backup_20250922
        set anonymous_user_id = null
        where anonymous_user_id is not null
          and coalesce(created_at, started_at, '-infinity'::timestamptz) < $1
      $sql$ using v_sessions_cutoff;
      get diagnostics v_legacy_anonymised = row_count;
    exception when undefined_column or datatype_mismatch or undefined_function then
      raise warning 'pdpa_retention_purge: skipped user_statistics_backup_20250922 (%)', sqlerrm;
    end;
  end if;

  return jsonb_build_object(
    'demographics_deleted', v_demographics_deleted,
    'demographic_aggregate_rows', v_aggregate_rows,
    'sessions_anonymised', v_sessions_anonymised,
    'consent_records_deleted', v_consent_deleted,
    'legacy_rows_anonymised', v_legacy_anonymised,
    'ran_at', now()
  );
end;
$$;

comment on function public.pdpa_retention_purge() is
  'Applies RETENTION from lib/privacy/policy.ts. Run daily by pg_cron (pdpa-retention-purge). Service role only.';

revoke execute on function public.pdpa_retention_purge() from public, anon, authenticated;
grant execute on function public.pdpa_retention_purge() to service_role;


-- ----------------------------------------------------------------------------
-- 7) Erasure (s.33) and consent withdrawal (s.19)
-- ----------------------------------------------------------------------------

create or replace function public.pdpa_erase_subject(p_anonymous_user_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subject text := nullif(btrim(p_anonymous_user_id), '');
  v_session_ids uuid[];
  v_survey integer := 0;
  v_responses integer := 0;
  v_sessions integer := 0;
  v_consents integer := 0;
  v_legacy integer := 0;
begin
  if v_subject is null then
    raise exception 'pdpa_erase_subject: p_anonymous_user_id is required' using errcode = '22023';
  end if;
  -- Stored ids carry the user_ prefix (migration 04).
  if left(v_subject, 5) <> 'user_' then
    v_subject := 'user_' || v_subject;
  end if;

  select coalesce(array_agg(qs.id), '{}'::uuid[])
  into v_session_ids
  from public.quiz_sessions qs
  where qs.anonymous_user_id = v_subject;

  -- Demographics first: their foreign key is ON DELETE SET NULL, so deleting the sessions first
  -- would leave them behind, unlinked.
  delete from public.survey_responses sr where sr.quiz_session_id = any (v_session_ids);
  get diagnostics v_survey = row_count;

  delete from public.question_responses qr where qr.quiz_session_id = any (v_session_ids);
  get diagnostics v_responses = row_count;

  delete from public.quiz_sessions qs where qs.id = any (v_session_ids);
  get diagnostics v_sessions = row_count;

  perform set_config('pdpa.allow_consent_log_delete', 'on', true);
  delete from public.pdpa_consent_log cl where cl.anonymous_user_id = v_subject;
  get diagnostics v_consents = row_count;
  perform set_config('pdpa.allow_consent_log_delete', 'off', true);

  if to_regclass('public.user_statistics_backup_20250922') is not null then
    begin
      execute 'delete from public.user_statistics_backup_20250922 where anonymous_user_id = $1'
        using v_subject;
      get diagnostics v_legacy = row_count;
    exception when undefined_column then
      raise warning 'pdpa_erase_subject: skipped user_statistics_backup_20250922 (%)', sqlerrm;
    end;
  end if;

  return jsonb_build_object(
    'quiz_sessions', v_sessions,
    'question_responses', v_responses,
    'survey_responses', v_survey,
    'consent_records', v_consents,
    'legacy_rows', v_legacy
  );
end;
$$;

comment on function public.pdpa_erase_subject(text) is
  'PDPA s.33: deletes every row linked to one anonymous_user_id. Called by eraseMyData after the '
  'caller''s identity was verified. Service role only.';

revoke execute on function public.pdpa_erase_subject(text) from public, anon, authenticated;
grant execute on function public.pdpa_erase_subject(text) to service_role;

create or replace function public.pdpa_erase_demographics(p_anonymous_user_id text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subject text := nullif(btrim(p_anonymous_user_id), '');
  v_deleted integer := 0;
begin
  if v_subject is null then
    raise exception 'pdpa_erase_demographics: p_anonymous_user_id is required' using errcode = '22023';
  end if;
  if left(v_subject, 5) <> 'user_' then
    v_subject := 'user_' || v_subject;
  end if;

  delete from public.survey_responses sr
  using public.quiz_sessions qs
  where qs.id = sr.quiz_session_id
    and qs.anonymous_user_id = v_subject;
  get diagnostics v_deleted = row_count;

  return v_deleted;
end;
$$;

comment on function public.pdpa_erase_demographics(text) is
  'PDPA s.19: deletes the demographics of one anonymous_user_id after they withdrew consent. Service role only.';

revoke execute on function public.pdpa_erase_demographics(text) from public, anon, authenticated;
grant execute on function public.pdpa_erase_demographics(text) to service_role;


-- ----------------------------------------------------------------------------
-- 8) Schedule: every day at 02:30 Asia/Bangkok
-- ----------------------------------------------------------------------------

create extension if not exists pg_cron with schema pg_catalog;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'pdpa-retention-purge') then
    perform cron.unschedule('pdpa-retention-purge');
  end if;
end $$;

-- pg_cron evaluates schedules in UTC: 19:30 UTC = 02:30 Asia/Bangkok (UTC+7, no daylight saving).
select cron.schedule(
  'pdpa-retention-purge',
  '30 19 * * *',
  $cron$select public.pdpa_retention_purge();$cron$
);


-- ----------------------------------------------------------------------------
-- Validation
-- ----------------------------------------------------------------------------

do $$
begin
  assert to_regclass('public.pdpa_consent_log') is not null, 'pdpa_consent_log was not created';
  assert to_regclass('public.survey_demographics_monthly') is not null,
    'survey_demographics_monthly was not created';
  assert (select relrowsecurity from pg_class where oid = 'public.pdpa_consent_log'::regclass),
    'RLS is off on pdpa_consent_log';
  assert (select relrowsecurity from pg_class where oid = 'public.survey_responses'::regclass),
    'RLS is off on survey_responses';
  assert not has_table_privilege('authenticated', 'public.survey_responses', 'select'),
    'authenticated can still read survey_responses';
  assert exists (select 1 from cron.job where jobname = 'pdpa-retention-purge'),
    'pdpa-retention-purge is not scheduled';
  raise notice 'PDPA consent log, retention purge and erasure functions are in place.';
end $$;
