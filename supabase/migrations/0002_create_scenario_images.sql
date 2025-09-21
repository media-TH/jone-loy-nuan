-- Create the "scenario_images" table to store Supabase Storage references.
create table if not exists public.scenario_images (
    id uuid primary key default gen_random_uuid(),
    question_id uuid not null references public.questions(id) on delete cascade,
    variant text not null check (variant in ('normal', 'result')),
    image_url text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    constraint unique_question_variant unique (question_id, variant)
);

-- Enable Row Level Security
alter table public.scenario_images enable row level security;

-- Allow public read access for everyone
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'scenario_images'
          and policyname = 'Allow public read access'
    ) then
        create policy "Allow public read access" on public.scenario_images for
        select using (true);
    end if;
end;
$$;

-- Allow authenticated users or service_role to perform mutations
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'scenario_images'
          and policyname = 'Allow all access for auth users or service role'
    ) then
        create policy "Allow all access for auth users or service role" on public.scenario_images for all using (
            auth.role() = 'authenticated'
            or auth.role() = 'service_role'
        ) with check (
            auth.role() = 'authenticated'
            or auth.role() = 'service_role'
        );
    end if;
end;
$$;

-- Create an index on the foreign key for better performance.
create index if not exists idx_scenario_images_question_id on public.scenario_images(question_id);
