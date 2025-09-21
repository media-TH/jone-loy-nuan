# Supabase Schema Export (Snapshot)

Exported at: 2025-09-21T13:58:51+07:00
Project: mnsatnmvclkozkcveljh (ap-southeast-1)

This directory contains an offline snapshot of database structure suitable for code review and agent analysis. It is NOT a full pg_dump; DDL has been summarized from system catalogs.

## Files
- `public_tables.json` — Table definitions for `public` schema: columns, PKs, FKs, row counts (approx), and RLS flags.
- `constraints.json` — All constraints across schemas (PK/UK/CK/FK) with definitions.
- `policies.json` — RLS policies with USING/CHECK expressions and role names.
- `rls_status.json` — RLS enabled/forced status per table across schemas.

## Recommended usage
- For ERD generation: parse `public_tables.json` to discover entities and relationships.
- For security review: read `policies.json` and `rls_status.json` to verify intended access.
- For validation: cross-check constraints in `constraints.json`.

## Limitations
- No exact CREATE TABLE DDL. If you need production-accurate DDL, run a dump:
  - Using Supabase CLI (locally):
    - `supabase db dump --schema-only > supabase/exports/schema.sql`
  - Or PostgreSQL `pg_dump` (schema only):
    - `pg_dump --schema-only --no-owner --no-privileges --dbname <connection-url> > supabase/exports/schema.sql`
- Row counts are approximate snapshots and may change.

## Next steps
- Optional: generate Mermaid ERD in docs.
- Optional: add `schema.sql` via CLI dump for reproducible DDL.
- Optional: add data dictionary (column descriptions) if maintained.

