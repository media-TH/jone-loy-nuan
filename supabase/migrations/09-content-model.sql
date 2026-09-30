-- ========================================
-- Content model: quizzes, typed scenarios, placed red flags
-- ========================================
-- Lets the site serve more than one quiz/campaign and stores what used to be hardcoded in the
-- app ("order_index 1 is the PIN scenario", images derived from order_index) as data.
-- Read by lib/content/supabase-source.ts + lib/content/legacy.ts.
--
-- Additive and idempotent: safe to run more than once, drops no data. Existing questions are
-- attached to the default quiz 'scam-awareness'; questions.scenario stays NULL, which keeps the
-- legacy order-based mapping, so players see no change until an editor sets a scenario.

-- ----------------------------------------
-- 1) quizzes
-- ----------------------------------------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 64),
  title text not null check (char_length(btrim(title)) > 0),
  description text,
  locale text not null default 'th' check (locale in ('th', 'en')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  version integer not null default 1 check (version >= 1),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.quizzes is
  'A quiz / campaign. The public site reads published quizzes only (see RLS).';
comment on column public.quizzes.version is
  'Content revision; bump when the published content changes.';

create index if not exists idx_quizzes_status on public.quizzes (status);

-- update_updated_at_column() comes from 01-create-scam-awareness-schema.sql.
drop trigger if exists trigger_quizzes_updated_at on public.quizzes;
create trigger trigger_quizzes_updated_at
  before update on public.quizzes
  for each row
  execute function update_updated_at_column();

alter table public.quizzes enable row level security;

drop policy if exists "quizzes_public_read_published" on public.quizzes;
create policy "quizzes_public_read_published"
on public.quizzes
for select
to anon, authenticated
using (status = 'published');

-- Writes go through the service role (bypasses RLS); no insert/update/delete policies on purpose.

-- The default quiz. Its id is fixed (DEFAULT_QUIZ_ID in lib/content/source.ts) so the app sees the
-- same quiz id before and after this migration.
insert into public.quizzes (id, slug, title, description, locale, status, version, published_at)
values (
  'e7f40430-ba10-47ca-8265-03a04312d198',
  'scam-awareness',
  'แบบทดสอบ 10 สถานการณ์จำลอง',
  'ดูสถานการณ์จำลองที่ใกล้เคียงชีวิตจริง ตัดสินใจว่าจะทำอย่างไร แล้วดูว่าธงแดงจุดไหนที่บอกว่าเป็นมิจฉาชีพ',
  'th',
  'published',
  1,
  now()
)
on conflict (slug) do nothing;

-- ----------------------------------------
-- 2) questions.quiz_id + questions.scenario
-- ----------------------------------------
-- on delete restrict: a quiz that still has questions cannot be deleted (responses reference them).
alter table public.questions
  add column if not exists quiz_id uuid references public.quizzes (id) on delete restrict;

-- NULL = legacy mapping (lib/content/legacy.ts). Otherwise a Scenario object, e.g.
--   {"kind": "pin-entry", "pinLength": 6, "prompt": "กรุณากรอกรหัสผ่าน"}
--   {"kind": "image-pair", "normalSrc": "/images/...", "resultSrc": "/images/...", "alt": "..."}
-- (kinds: image-pair, pin-entry, chat, call, sms; shape validated by lib/content/schema.ts).
alter table public.questions
  add column if not exists scenario jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_questions_scenario_kind'
  ) then
    alter table public.questions
      add constraint chk_questions_scenario_kind
      check (
        scenario is null
        or (
          jsonb_typeof(scenario) = 'object'
          and coalesce(scenario ->> 'kind', '') in ('image-pair', 'pin-entry', 'chat', 'call', 'sms')
        )
      );
  end if;
end $$;

comment on column public.questions.quiz_id is
  'Quiz this question belongs to. Filled with the default quiz when inserted without one.';
comment on column public.questions.scenario is
  'Typed scenario (lib/content/types.ts Scenario). NULL keeps the legacy order_index mapping.';

-- Backfill: every existing question belongs to the default quiz.
update public.questions
set quiz_id = (select id from public.quizzes where slug = 'scam-awareness')
where quiz_id is null;

-- The admin portal inserts questions without a quiz; keep those in the default quiz.
create or replace function public.questions_default_quiz()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.quiz_id is null then
    select q.id into new.quiz_id from public.quizzes q where q.slug = 'scam-awareness';
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_questions_default_quiz on public.questions;
create trigger trigger_questions_default_quiz
  before insert on public.questions
  for each row
  execute function public.questions_default_quiz();

-- order_index was unique across all questions; it only has to be unique within a quiz, so a
-- second quiz can number its questions from 1 again. Nothing changes for the default quiz.
create unique index if not exists questions_quiz_order_key
  on public.questions (quiz_id, order_index);
alter table public.questions drop constraint if exists questions_order_index_key;

-- ----------------------------------------
-- 3) red_flags: numbered, optionally placed pins
-- ----------------------------------------
-- The table exists since 01 (flag_text, flag_type, display_order). Kept as is; the new columns
-- sit next to the old ones and are backfilled from them.
create table if not exists public.red_flags (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions (id) on delete cascade,
  flag_text text not null,
  flag_type text default 'warning',
  display_order integer default 0,
  created_at timestamptz default now()
);

alter table public.red_flags add column if not exists number integer;
alter table public.red_flags add column if not exists label text;
alter table public.red_flags add column if not exists detail text;
-- Pin anchor in percent of the scenario frame (0-100); both set or both NULL.
alter table public.red_flags add column if not exists x numeric(5, 2);
alter table public.red_flags add column if not exists y numeric(5, 2);

update public.red_flags set label = flag_text where label is null;

-- Number unnumbered flags per question in their display order, after any numbers already set.
with numbered as (
  select
    id,
    row_number() over (
      partition by question_id
      order by display_order nulls last, created_at, id
    ) as n
  from public.red_flags
  where number is null
)
update public.red_flags rf
set number = numbered.n + coalesce(
  (
    select max(existing.number)
    from public.red_flags existing
    where existing.question_id is not distinct from rf.question_id
  ),
  0
)
from numbered
where rf.id = numbered.id;

-- label and flag_text mirror each other, and a missing number takes the next free one, so both
-- old writers (flag_text only) and new ones (label/number) work.
create or replace function public.red_flags_sync_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.flag_text is distinct from old.flag_text and new.label is not distinct from old.label then
      new.label := new.flag_text;
    elsif new.label is distinct from old.label and new.flag_text is not distinct from old.flag_text then
      new.flag_text := new.label;
    end if;
  end if;
  new.label := coalesce(nullif(btrim(new.label), ''), new.flag_text);
  new.flag_text := coalesce(new.flag_text, new.label);
  if new.number is null then
    select coalesce(max(rf.number), 0) + 1 into new.number
    from public.red_flags rf
    where rf.question_id is not distinct from new.question_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_red_flags_sync_columns on public.red_flags;
create trigger trigger_red_flags_sync_columns
  before insert or update on public.red_flags
  for each row
  execute function public.red_flags_sync_columns();

alter table public.red_flags alter column label set not null;
alter table public.red_flags alter column number set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chk_red_flags_number_positive') then
    alter table public.red_flags
      add constraint chk_red_flags_number_positive check (number >= 1);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'chk_red_flags_position') then
    alter table public.red_flags
      add constraint chk_red_flags_position check (
        (x is null and y is null)
        or (
          x is not null and y is not null
          and x between 0 and 100 and y between 0 and 100
        )
      );
  end if;
end $$;

create unique index if not exists red_flags_question_number_key
  on public.red_flags (question_id, number);

comment on column public.red_flags.number is 'Pin number, 1-based and unique per question.';
comment on column public.red_flags.label is 'Short red flag text (mirrors flag_text).';
comment on column public.red_flags.detail is 'Longer explanation under the label.';
comment on column public.red_flags.x is 'Pin anchor, percent of the scenario frame width (0-100).';
comment on column public.red_flags.y is 'Pin anchor, percent of the scenario frame height (0-100).';

alter table public.red_flags enable row level security;

drop policy if exists "red_flags_public_read" on public.red_flags;
create policy "red_flags_public_read"
on public.red_flags
for select
to anon, authenticated
using (true);

-- ----------------------------------------
-- 4) get_questions_with_answers(): also return quiz_id, scenario and red_flags
-- ----------------------------------------
-- Same columns as before plus three new ones at the end (callers select by name, so this is
-- backward compatible). Changing a function's result columns needs drop + create.
-- Returns questions of published quizzes only (the admin portal lists the same set).
-- The deployed function may differ from 02 (it already returns kpi_category); keep its security
-- mode (invoker/definer) as it is, so anon reads keep working exactly as before.
drop table if exists pg_temp.content_model_rpc_security;
create temp table content_model_rpc_security as
select coalesce(bool_or(p.prosecdef), false) as was_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_questions_with_answers'
  and p.pronargs = 0;

drop function if exists public.get_questions_with_answers();

create function public.get_questions_with_answers()
returns table (
  id uuid,
  question_text text,
  category text,
  content jsonb,
  result jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  order_index integer,
  kpi_category text,
  answers jsonb,
  quiz_id uuid,
  scenario jsonb,
  red_flags jsonb
)
language sql
stable
set search_path = ''
as $$
  select
    q.id,
    q.question_text,
    q.category,
    q.content,
    q.result,
    q.created_at,
    q.updated_at,
    q.order_index,
    q.kpi_category,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'answer_text', a.answer_text,
            'is_correct', a.is_correct,
            'explanation', a.explanation
          )
        )
        from public.answers a
        where a.question_id = q.id
      ),
      '[]'::jsonb
    ) as answers,
    q.quiz_id,
    q.scenario,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'number', rf.number,
            'label', rf.label,
            'detail', rf.detail,
            'x', rf.x,
            'y', rf.y
          )
          order by rf.number
        )
        from public.red_flags rf
        where rf.question_id = q.id
      ),
      '[]'::jsonb
    ) as red_flags
  from public.questions q
  -- Published quizzes only: draft campaign content (and its answer key) stays private until
  -- launch, whether this function runs as invoker or definer.
  join public.quizzes qz on qz.id = q.quiz_id and qz.status = 'published'
  order by q.order_index;
$$;

do $$
begin
  if (select was_definer from content_model_rpc_security) then
    alter function public.get_questions_with_answers() security definer;
  end if;
end $$;

drop table if exists pg_temp.content_model_rpc_security;

grant execute on function public.get_questions_with_answers() to anon, authenticated, service_role;

-- ----------------------------------------
-- 5) Checks
-- ----------------------------------------
do $$
begin
  assert (select count(*) from public.quizzes where slug = 'scam-awareness') = 1,
    'default quiz scam-awareness is missing';
  assert (select count(*) from public.questions where quiz_id is null) = 0,
    'questions without a quiz remain after the backfill';
  raise notice 'content model ready: quizzes, questions.quiz_id/scenario, red_flags number/label/detail/x/y';
end $$;
