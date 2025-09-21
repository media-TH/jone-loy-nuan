-- Aggregated view of questions by wrong answer count

create or replace view public.question_wrong_counts as
select
  q.id as question_id,
  q.question_text,
  kc.slug as kpi_category,
  count(qr.id) filter (where qr.is_correct = false) as wrong_count,
  count(qr.id) as total_attempts,
  coalesce(round(
    100 * (count(qr.id) filter (where qr.is_correct = false))::numeric
    / nullif(count(qr.id), 0),
    1
  ), 0) as wrong_rate_percentage
from public.questions q
join public.kpi_categories kc on kc.id = q.kpi_category_id
left join public.question_responses qr on qr.question_id = q.id
group by q.id, q.question_text, kc.slug;

comment on view public.question_wrong_counts is 'Aggregated counts of wrong answers per question';

