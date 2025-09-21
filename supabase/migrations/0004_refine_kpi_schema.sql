-- Normalize KPI categories and expose analytics views

create table if not exists public.kpi_categories (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    display_name text not null,
    description text,
    target_percentage numeric(5,2) not null default 80.0,
    question_count smallint not null default 0,
    created_at timestamptz not null default now()
);

insert into public.kpi_categories (slug, display_name, description, question_count)
values
    ('SCAM_RECOGNITION', 'Scam Recognition', 'Identify common scam signals', 3),
    ('RISK_ASSESSMENT', 'Risk Assessment', 'Judge threat levels and next steps', 2),
    ('PROTECTIVE_ACTIONS', 'Protective Actions', 'Choose safe preventative actions', 3),
    ('RESPONSE_STRATEGIES', 'Response Strategies', 'Decide how to respond after detection', 2),
    ('UNKNOWN', 'Uncategorized', 'Fallback for legacy or unmapped records', 0)
on conflict (slug) do nothing;

alter table public.questions
    add column if not exists kpi_category_id uuid;

update public.questions as q
set kpi_category_id = coalesce(
        (select kc.id from public.kpi_categories kc where kc.slug = upper(q.category)),
        (select kc.id from public.kpi_categories kc where kc.slug = 'UNKNOWN')
    )
where q.kpi_category_id is null;

alter table public.questions
    alter column kpi_category_id set not null;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'questions_kpi_category_id_fkey'
          and conrelid = 'public.questions'::regclass
    ) then
        alter table public.questions
            add constraint questions_kpi_category_id_fkey
            foreign key (kpi_category_id) references public.kpi_categories (id);
    end if;
end;
$$;

create index if not exists idx_questions_kpi_category_id on public.questions (kpi_category_id);

drop view if exists public.user_wrong_answers;
drop view if exists public.kpi_scam_recognition cascade;
drop view if exists public.kpi_risk_assessment cascade;
drop view if exists public.kpi_protective_actions cascade;
drop view if exists public.kpi_response_strategies cascade;
drop view if exists public.kpi_total_summary cascade;
drop view if exists public.kpi_response_strategies cascade;
drop view if exists public.kpi_protective_actions cascade;
drop view if exists public.kpi_risk_assessment cascade;
drop view if exists public.kpi_scam_recognition cascade;
drop view if exists public.user_kpi_performance cascade;
drop view if exists public.question_difficulty_analysis cascade;
drop view if exists public.quiz_kpi_summary cascade;
drop view if exists public.question_responses_enriched cascade;

alter table public.questions
    drop column if exists category;

alter table public.question_responses
    add column if not exists kpi_category_id uuid;

update public.question_responses as qr
set kpi_category_id = coalesce(
        (select kc.id from public.kpi_categories kc where kc.slug = upper(qr.kpi_category)),
        (select kc.id from public.kpi_categories kc where kc.slug = 'UNKNOWN')
    )
where qr.kpi_category_id is null;

alter table public.question_responses
    alter column kpi_category_id set not null;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'question_responses_kpi_category_id_fkey'
          and conrelid = 'public.question_responses'::regclass
    ) then
        alter table public.question_responses
            add constraint question_responses_kpi_category_id_fkey
            foreign key (kpi_category_id) references public.kpi_categories (id);
    end if;
end;
$$;

create index if not exists idx_question_responses_kpi_category_id on public.question_responses (kpi_category_id);

alter table public.question_responses
    drop column if exists kpi_category;

alter table public.kpi_target
    add column if not exists kpi_category_id uuid;

update public.kpi_target as kt
set kpi_category_id = coalesce(
        (select kc.id from public.kpi_categories kc where kc.slug = upper(kt.name)),
        (select kc.id from public.kpi_categories kc where kc.slug = 'UNKNOWN')
    )
where kt.kpi_category_id is null;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'kpi_target_kpi_category_id_fkey'
          and conrelid = 'public.kpi_target'::regclass
    ) then
        alter table public.kpi_target
            add constraint kpi_target_kpi_category_id_fkey
            foreign key (kpi_category_id) references public.kpi_categories (id);
    end if;
end;
$$;

create index if not exists idx_kpi_target_kpi_category_id on public.kpi_target (kpi_category_id);

alter table public.question_responses enable row level security;

drop function if exists get_questions_with_answers();

create or replace function get_questions_with_answers()
returns table (
    id uuid,
    question_text text,
    category text,
    order_index int,
    content jsonb,
    result jsonb,
    created_at timestamptz,
    updated_at timestamptz,
    answers jsonb,
    normal_image_url text,
    result_image_url text
)
language plpgsql
as $$
begin
    return query
    select
        q.id,
        q.question_text,
        kc.slug as category,
        q.order_index,
        q.content,
        q.result,
        q.created_at,
        q.updated_at,
        coalesce(
            (
                select jsonb_agg(
                           jsonb_build_object(
                               'id', a.id,
                               'text', a.answer_text,
                               'isCorrect', a.is_correct
                           )
                           order by a.created_at
                       )
                from public.answers a
                where a.question_id = q.id
            ),
            '[]'::jsonb
        ) as answers,
        concat('/images/scenarios/question-', q.order_index::text, '/normal.svg') as normal_image_url,
        concat('/images/scenarios/question-', q.order_index::text, '/result.svg') as result_image_url
    from public.questions q
    join public.kpi_categories kc on kc.id = q.kpi_category_id
    order by q.order_index;
end;
$$;

create view public.question_responses_enriched as
select
    qr.id,
    qr.quiz_session_id,
    qr.question_id,
    qr.selected_answer_id,
    qr.is_correct,
    qr.response_time_ms,
    qr.question_order,
    qr.created_at,
    kc.slug as kpi_category_slug
from public.question_responses qr
join public.kpi_categories kc on kc.id = qr.kpi_category_id;

create view public.quiz_kpi_summary as
select
    qs.id as quiz_session_id,
    qs.session_id,
    qs.anonymous_user_id,
    qs.created_at,
    coalesce(round(
        100 * sum(case when kc.slug = 'SCAM_RECOGNITION' and qr.is_correct then 1 else 0 end)::numeric
        / nullif(sum(case when kc.slug = 'SCAM_RECOGNITION' then 1 else 0 end), 0),
        1
    ), 0) as scam_recognition_percentage,
    coalesce(round(
        100 * sum(case when kc.slug = 'RISK_ASSESSMENT' and qr.is_correct then 1 else 0 end)::numeric
        / nullif(sum(case when kc.slug = 'RISK_ASSESSMENT' then 1 else 0 end), 0),
        1
    ), 0) as risk_assessment_percentage,
    coalesce(round(
        100 * sum(case when kc.slug = 'PROTECTIVE_ACTIONS' and qr.is_correct then 1 else 0 end)::numeric
        / nullif(sum(case when kc.slug = 'PROTECTIVE_ACTIONS' then 1 else 0 end), 0),
        1
    ), 0) as protective_actions_percentage,
    coalesce(round(
        100 * sum(case when kc.slug = 'RESPONSE_STRATEGIES' and qr.is_correct then 1 else 0 end)::numeric
        / nullif(sum(case when kc.slug = 'RESPONSE_STRATEGIES' then 1 else 0 end), 0),
        1
    ), 0) as response_strategies_percentage,
    coalesce(round(
        100 * sum(case when qr.is_correct then 1 else 0 end)::numeric
        / nullif(count(qr.id), 0),
        1
    ), 0) as overall_percentage,
    count(qr.id) as total_answers_recorded
from public.quiz_sessions qs
left join public.question_responses qr on qr.quiz_session_id = qs.id
left join public.kpi_categories kc on kc.id = qr.kpi_category_id
group by qs.id, qs.session_id, qs.anonymous_user_id, qs.created_at;

create view public.question_difficulty_analysis as
select
    q.id as question_id,
    q.question_text,
    kc.slug as kpi_category,
    count(qr.id) as total_attempts,
    coalesce(round(
        100 * sum(case when qr.is_correct then 1 else 0 end)::numeric
        / nullif(count(qr.id), 0),
        1
    ), 0) as success_rate,
    coalesce(round(
        100 * (count(qr.id) - sum(case when qr.is_correct then 1 else 0 end))::numeric
        / nullif(count(qr.id), 0),
        1
    ), 0) as failure_rate,
    round(avg(qr.response_time_ms)::numeric, 2) as avg_response_time_ms
from public.questions q
join public.kpi_categories kc on kc.id = q.kpi_category_id
left join public.question_responses qr on qr.question_id = q.id
group by q.id, q.question_text, kc.slug
order by success_rate asc;

create view public.user_kpi_performance as
select
    qs.anonymous_user_id,
    kc.slug as kpi_category,
    count(qr.id) as questions_attempted,
    coalesce(round(
        100 * sum(case when qr.is_correct then 1 else 0 end)::numeric
        / nullif(count(qr.id), 0),
        1
    ), 0) as accuracy_percentage,
    round(avg(qr.response_time_ms)::numeric, 2) as avg_response_time_ms
from public.quiz_sessions qs
join public.question_responses qr on qr.quiz_session_id = qs.id
join public.kpi_categories kc on kc.id = qr.kpi_category_id
where qs.anonymous_user_id is not null
group by qs.anonymous_user_id, kc.slug;

create view public.user_wrong_answers as
select
    qs.anonymous_user_id,
    qs.session_id,
    qr.quiz_session_id,
    q.id as question_id,
    q.question_text,
    kc.slug as kpi_category,
    count(*) as times_wrong
from public.quiz_sessions qs
join public.question_responses qr on qr.quiz_session_id = qs.id
join public.questions q on q.id = qr.question_id
join public.kpi_categories kc on kc.id = q.kpi_category_id
where qr.is_correct = false
  and qs.anonymous_user_id is not null
group by qs.anonymous_user_id, qs.session_id, qr.quiz_session_id, q.id, q.question_text, kc.slug
order by times_wrong desc;










