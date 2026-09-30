-- ============================================================================
-- 10 · Security hardening: identifier-bearing views, content tables, prod-only analytics objects
-- ============================================================================
-- Context (docs/greenfield/ADR-005-anonymous-security.md): every player holds an anon JWT with
-- role "authenticated", the same Postgres role as a signed-in staff account. So any grant or
-- policy "to authenticated" is open to every visitor who asks issue-anon-jwt for a token.
--
--   1. quiz_kpi_summary: one row per session with anonymous_user_id + session_id. It ran as its
--      owner (no security_invoker), skipping quiz_sessions RLS, so the public key could list
--      every player's id. Now security_invoker and closed to the API roles; the portal reads the
--      aggregate columns with the service role behind the admin gate (lib/actions/analytics.ts).
--   2. Aggregate views: no longer readable without a JWT.
--   3. Content tables (questions, answers, scenario_images, kpi_targets): public read only. Writes
--      come from the portal's Server Actions with the service role behind getAdminUser()
--      (lib/actions/questions.ts, lib/actions/images.ts), so a player's token cannot deface the
--      quiz or plant a phishing number in it.
--   4. Objects that exist only in production (created outside these migrations) and carry
--      row-level player data: closed to the API roles when present.
--
-- Idempotent: safe to run more than once. Deploy together with the Server Action changes above
-- (they need SECRET_KEY on the server).


-- ----------------------------------------------------------------------------
-- 1) quiz_kpi_summary: no identifiers through the API
-- ----------------------------------------------------------------------------

alter view public.quiz_kpi_summary set (security_invoker = on);
revoke all on table public.quiz_kpi_summary from public, anon, authenticated;
grant select on table public.quiz_kpi_summary to service_role;


-- ----------------------------------------------------------------------------
-- 2) Aggregate views: counts and rates only, but still nothing for visitors without a JWT
-- ----------------------------------------------------------------------------

-- kpi_performance_summary stays readable by "authenticated": the portal's dashboard cards read it
-- from the browser (hooks/use-kpi-data.ts). It holds per-category totals, no row-level data.
revoke all on table public.kpi_performance_summary from public, anon;
-- quiz_analytics_summary (daily totals) has no reader in the app: service role only.
revoke all on table public.quiz_analytics_summary from public, anon, authenticated;
grant select on table public.kpi_performance_summary to service_role;
grant select on table public.quiz_analytics_summary to service_role;


-- ----------------------------------------------------------------------------
-- 3) Content tables: public SELECT, no writes through the API
-- ----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['questions', 'answers', 'scenario_images', 'kpi_targets'] loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    -- Privileges are checked before RLS, so this closes writes even if the live database
    -- carries a permissive policy created outside these migrations.
    execute format('revoke insert, update, delete, truncate on table public.%I from public, anon, authenticated', t);
    execute format('grant select on table public.%I to anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);

    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_public_read',
      t
    );
  end loop;
end $$;

-- quizzes and red_flags (migration 09) already have RLS with read-only policies; take the write
-- grants away as well, for the same reason as above.
revoke insert, update, delete, truncate on table public.quizzes from public, anon, authenticated;
revoke insert, update, delete, truncate on table public.red_flags from public, anon, authenticated;


-- ----------------------------------------------------------------------------
-- 4) Production-only objects with row-level player data
-- ----------------------------------------------------------------------------

-- user_statistics (per-session rows with anonymous_user_id), demographics_analytics (built on
-- survey_responses) and the 2025-09-22 snapshot. The portal reads the first two with the service
-- role behind the admin gate (lib/actions/user-statistics.ts, lib/actions/advanced-analytics.ts).
do $$
declare
  obj text;
begin
  foreach obj in array array['user_statistics', 'demographics_analytics', 'user_statistics_backup_20250922'] loop
    if to_regclass('public.' || obj) is not null then
      execute format('revoke all on table public.%I from public, anon, authenticated', obj);
      execute format('grant select on table public.%I to service_role', obj);
    end if;
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- Validation
-- ----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  assert not has_table_privilege('anon', 'public.quiz_kpi_summary', 'select'),
    'anon can still read quiz_kpi_summary';
  assert not has_table_privilege('authenticated', 'public.quiz_kpi_summary', 'select'),
    'authenticated can still read quiz_kpi_summary';

  foreach t in array array['questions', 'answers'] loop
    assert (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass),
      format('RLS is off on %s', t);
    assert not has_table_privilege('authenticated', 'public.' || t, 'update'),
      format('authenticated can still update %s', t);
  end loop;

  raise notice 'security hardening applied: identifier views closed, content tables read-only for API roles';
end $$;
