-- Add device tracking columns to quiz_sessions table

alter table public.quiz_sessions
    add column if not exists device_type text,
    add column if not exists user_agent text,
    add column if not exists screen_resolution text,
    add column if not exists browser_info text;

-- Add indexes for analytics queries
create index if not exists idx_quiz_sessions_device_type on public.quiz_sessions (device_type);
create index if not exists idx_quiz_sessions_created_at on public.quiz_sessions (created_at);

-- Update existing records with default device type if needed
update public.quiz_sessions
set device_type = 'unknown'
where device_type is null;

-- Add comment for documentation
comment on column public.quiz_sessions.device_type is 'Device type: mobile, desktop, tablet, unknown';
comment on column public.quiz_sessions.user_agent is 'Full user agent string for detailed analytics';
comment on column public.quiz_sessions.screen_resolution is 'Screen resolution for UX analytics';
comment on column public.quiz_sessions.browser_info is 'Browser name and version';