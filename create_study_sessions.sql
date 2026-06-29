-- Create study_sessions table
create table if not exists public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  module_id uuid references public.modules on delete set null,
  duration_minutes integer not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Apply triggers and permissions
create trigger set_updated_at before update on public.study_sessions for each row execute procedure public.set_current_timestamp_updated_at();
alter table public.study_sessions disable row level security;
GRANT ALL PRIVILEGES ON TABLE public.study_sessions TO anon, authenticated;
