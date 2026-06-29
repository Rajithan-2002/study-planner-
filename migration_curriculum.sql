-- 1. DROP EXISTING DEPENDENT TABLES (To clear dummy data cleanly)
drop table if exists public.timetable_sessions cascade;
drop table if exists public.module_results cascade;
drop table if exists public.exams cascade;
drop table if exists public.assignments cascade;
drop table if exists public.modules cascade;

-- 2. CREATE CURRICULUM MODULES
create table public.curriculum_modules (
  id uuid default gen_random_uuid() primary key,
  course_code text not null,
  course_name text not null,
  credits integer not null,
  year integer not null,
  semester integer not null,
  is_compulsory boolean default true,
  category text, -- e.g., 'Core', 'Elective', 'Specialization'
  track text, -- for future specialization tracks e.g., 'Software Engineering', 'Data Science'
  prerequisites text[], -- array of course_codes
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. RECREATE MODULES (Student Modules with Snapshots)
create table public.modules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  curriculum_module_id uuid references public.curriculum_modules on delete set null,
  semester_id uuid references public.academic_semesters on delete set null,
  code text not null, -- snapshot
  name text not null, -- snapshot
  credits integer not null, -- snapshot
  grade text,
  status module_status default 'NOT_STARTED',
  priority text default 'LOW',
  is_selected boolean default true, -- To distinguish between planned vs just available options
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. RECREATE DEPENDENT TABLES
create table public.module_results (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references public.modules on delete cascade not null,
  component text not null,
  weight numeric(5,2),
  marks numeric(5,2),
  grade text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.timetable_sessions (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references public.modules on delete cascade not null,
  day text not null,
  start_time time not null,
  end_time time not null,
  location text,
  session_type session_type,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.assignments (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references public.modules on delete cascade not null,
  name text not null,
  weight numeric(5,2),
  deadline timestamp with time zone,
  status text default 'PENDING',
  marks numeric(5,2),
  priority text default 'LOW',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.exams (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references public.modules on delete cascade not null,
  name text not null,
  weight numeric(5,2),
  exam_date timestamp with time zone,
  status text default 'PENDING',
  marks numeric(5,2),
  priority text default 'LOW',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. RE-APPLY TRIGGERS AND RLS
create trigger set_updated_at before update on public.curriculum_modules for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.modules for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.module_results for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.timetable_sessions for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.assignments for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.exams for each row execute procedure public.set_current_timestamp_updated_at();

alter table public.curriculum_modules disable row level security;
alter table public.modules disable row level security;
alter table public.module_results disable row level security;
alter table public.timetable_sessions disable row level security;
alter table public.assignments disable row level security;
alter table public.exams disable row level security;
