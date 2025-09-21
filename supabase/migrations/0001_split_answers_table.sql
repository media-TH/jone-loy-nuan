-- Step 1: Create the new "answers" table
create table if not exists public.answers (
    id uuid primary key default gen_random_uuid(),
    question_id uuid not null references public.questions(id) on delete cascade,
    answer_text text not null,
    is_correct boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz
);

-- Step 2: Enable Row Level Security
alter table public.answers enable row level security;

-- Step 3: Create RLS policies (guarded against duplicates)
-- Allow public read access for everyone
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'answers'
          and policyname = 'Allow public read access'
    ) then
        create policy "Allow public read access" on public.answers for
        select using (true);
    end if;
end;
$$;

-- Allow authenticated users OR the service_role to insert data
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'answers'
          and policyname = 'Allow insert for auth users or service role'
    ) then
        create policy "Allow insert for auth users or service role" on public.answers for
        insert with check (
            auth.role() = 'authenticated'
            or auth.role() = 'service_role'
        );
    end if;
end;
$$;

-- Step 4: Alter the "questions" table to remove the legacy JSON column
alter table public.questions drop column if exists answers;

-- Step 5: Create an index on the foreign key for performance
create index if not exists idx_answers_question_id on public.answers(question_id);

-- Note: The ON DELETE CASCADE on the foreign key means that if a question is deleted,
-- all of its associated answers will be automatically deleted as well.
-- This simplifies the delete logic in our application.
