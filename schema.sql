-- ==============================================================================
-- LIFE OS V2 : COMPLETE DATABASE SCHEMA
-- This script will ERASE the existing database and recreate it from scratch.
-- Run this entirely in your Supabase SQL Editor.
-- ==============================================================================

-- 1. DROP EVERYTHING (CLEAN SLATE)
drop table if exists public.document_chunks cascade;
drop table if exists public.competition_files cascade;
drop table if exists public.knowledge_files cascade;
drop table if exists public.competitions cascade;
drop table if exists public.certification_resources cascade;
drop table if exists public.certifications cascade;
drop table if exists public.projects cascade;
drop table if exists public.exams cascade;
drop table if exists public.assignments cascade;
drop table if exists public.timetable_sessions cascade;
drop table if exists public.module_results cascade;
drop table if exists public.modules cascade;
drop table if exists public.academic_semesters cascade;
drop table if exists public.curriculum_modules cascade;
drop table if exists public.life_events cascade;
drop table if exists public.device_tokens cascade;
drop table if exists public.notifications cascade;
drop table if exists public.discussion_messages cascade;
drop table if exists public.discussion_threads cascade;
drop table if exists public.ai_tool_logs cascade;
drop table if exists public.activity_logs cascade;
drop table if exists public.tasks cascade;
drop table if exists public.skills cascade;
drop table if exists public.domains cascade;
drop table if exists public.users cascade;

-- DROP ENUMS
drop type if exists module_status cascade;
drop type if exists project_status cascade;
drop type if exists cert_status cascade;
drop type if exists session_type cascade;
drop type if exists discussion_entity_type cascade;
drop type if exists event_type cascade;
drop type if exists resource_type cascade;
drop type if exists knowledge_entity_type cascade;

-- ==============================================================================
-- 2. CREATE EXTENSIONS & ENUMS
-- ==============================================================================

create extension if not exists vector with schema public;

create type module_status as enum ('NOT_STARTED', 'ONGOING', 'EXAM_PENDING', 'RESULT_PENDING', 'COMPLETED', 'REPEAT');
create type project_status as enum ('IDEA', 'RESEARCHING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
create type cert_status as enum ('IDEA', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
create type session_type as enum ('LECTURE', 'LAB', 'PRACTICAL', 'TUTORIAL');
create type discussion_entity_type as enum ('PROJECT', 'CERTIFICATION', 'MODULE', 'CAREER', 'DOMAIN');
create type event_type as enum ('EXAM', 'ASSIGNMENT', 'CERT_EXAM', 'PROJECT_MILESTONE', 'COMPETITION', 'INTERNSHIP_DEADLINE');
create type resource_type as enum ('COURSE', 'PRACTICE_EXAM', 'YOUTUBE', 'PDF');
create type knowledge_entity_type as enum ('MODULE', 'PROJECT', 'CERTIFICATION', 'INBOX');

-- ==============================================================================
-- 3. CORE TABLES
-- ==============================================================================

-- USERS
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  university text,
  degree_name text,
  graduation_year integer,
  career_goal text,
  current_gpa numeric(3,2),
  target_gpa numeric(3,2),
  current_year integer,
  current_semester integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DOMAINS (Categories like 'Cloud', 'AI', 'Software Engineering')
create table public.domains (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 4. ACADEMIC HUB (New Master Curriculum Setup)
-- ==============================================================================

-- CURRICULUM MODULES (The Master Catalog preloaded by seeder)
create table public.curriculum_modules (
  id uuid default gen_random_uuid() primary key,
  course_code text not null,
  course_name text not null,
  credits integer not null,
  year integer not null,
  semester integer not null,
  is_compulsory boolean default true,
  category text,
  track text,
  prerequisites text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ACADEMIC SEMESTERS
create table public.academic_semesters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  year integer not null,
  semester integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MODULES (Student's specific selected courses & grades)
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
  is_selected boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MODULE RESULTS (GPA Breakdown Engine)
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

-- TIMETABLE SESSIONS
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

-- ASSIGNMENTS
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

-- EXAMS
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

-- ==============================================================================
-- 5. PORTFOLIO & WORKFLOW (Projects, Certs, Tasks)
-- ==============================================================================

-- TASKS (Universal Queue)
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null,
  description text,
  status text default 'PENDING',
  priority text default 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
  due_date timestamp with time zone,
  domain_id uuid references public.domains on delete set null,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PROJECTS
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  domain_id uuid references public.domains on delete set null,
  name text not null,
  description text,
  category text,
  status project_status default 'IDEA',
  priority text default 'LOW',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CERTIFICATIONS
create table public.certifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  domain_id uuid references public.domains on delete set null,
  name text not null,
  provider text,
  cost numeric(10,2),
  target_date timestamp with time zone,
  exam_date timestamp with time zone,
  status cert_status default 'IDEA',
  priority text default 'LOW',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.certification_resources (
  id uuid default gen_random_uuid() primary key,
  certification_id uuid references public.certifications on delete cascade not null,
  title text not null,
  url text,
  resource_type resource_type,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- COMPETITIONS
create table public.competitions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  name text not null,
  organizer text,
  registration_deadline timestamp with time zone,
  submission_deadline timestamp with time zone,
  prize text,
  status text default 'OPEN',
  priority text default 'LOW',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 6. TIMELINE & KNOWLEDGE
-- ==============================================================================

-- LIFE EVENTS (Mission Control global timeline)
create table public.life_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null,
  type event_type not null,
  event_date timestamp with time zone not null,
  importance integer default 0,
  is_recurring boolean default false,
  recurrence_rule text,
  related_entity_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- KNOWLEDGE FILES (Universal inbox / module resources)
create table public.knowledge_files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  domain_id uuid references public.domains on delete set null,
  file_name text not null,
  file_url text not null,
  file_type text,
  entity_type knowledge_entity_type default 'INBOX',
  entity_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.competition_files (
  id uuid default gen_random_uuid() primary key,
  competition_id uuid references public.competitions on delete cascade not null,
  file_id uuid references public.knowledge_files on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DOCUMENT CHUNKS (For RAG AI)
create table public.document_chunks (
  id uuid default gen_random_uuid() primary key,
  file_id uuid references public.knowledge_files on delete cascade not null,
  content text not null,
  embedding vector(1536),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 7. MISC & SOCIAL
-- ==============================================================================

create table public.skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  name text not null,
  category text,
  level integer default 0,
  target_level integer default 100,
  progress numeric(5,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.discussion_threads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  entity_type discussion_entity_type not null,
  entity_id uuid not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.discussion_messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.discussion_threads on delete cascade not null,
  role text not null check (role in ('user', 'ai')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null,
  message text not null,
  type text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.device_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  device_type text not null,
  token text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  action text not null,
  entity_type text,
  entity_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.ai_tool_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  tool_name text not null,
  input jsonb,
  output jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- ==============================================================================
-- 8. INDEXES & TRIGGERS
-- ==============================================================================

create index on public.modules (semester_id);
create index on public.modules (user_id);
create index on public.assignments (module_id);
create index on public.exams (module_id);
create index on public.projects (user_id, domain_id);
create index on public.certifications (user_id, domain_id);
create index on public.life_events (user_id, event_date);
create index on public.tasks (user_id, due_date);
create index document_chunks_embedding_idx on public.document_chunks using hnsw (embedding vector_cosine_ops);

-- Auth Trigger
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Auto-update updated_at trigger function
create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Apply triggers
create trigger set_updated_at before update on public.users for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.domains for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.skills for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.tasks for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.discussion_threads for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.curriculum_modules for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.academic_semesters for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.modules for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.module_results for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.timetable_sessions for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.assignments for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.exams for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.projects for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.certifications for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.certification_resources for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.competitions for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.knowledge_files for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.life_events for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.document_chunks for each row execute procedure public.set_current_timestamp_updated_at();

-- ==============================================================================
-- 9. PERMISSIONS & RLS SETUP (Critical to fix "permission denied" errors)
-- ==============================================================================

-- Grant explicit base permissions to the API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Ensure future tables also inherit these permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- Disable RLS across the board for development
alter table public.users disable row level security;
alter table public.domains disable row level security;
alter table public.skills disable row level security;
alter table public.tasks disable row level security;
alter table public.activity_logs disable row level security;
alter table public.ai_tool_logs disable row level security;
alter table public.discussion_threads disable row level security;
alter table public.discussion_messages disable row level security;
alter table public.notifications disable row level security;
alter table public.device_tokens disable row level security;
alter table public.curriculum_modules disable row level security;
alter table public.academic_semesters disable row level security;
alter table public.modules disable row level security;
alter table public.module_results disable row level security;
alter table public.timetable_sessions disable row level security;
alter table public.assignments disable row level security;
alter table public.exams disable row level security;
alter table public.projects disable row level security;
alter table public.certifications disable row level security;
alter table public.certification_resources disable row level security;
alter table public.competitions disable row level security;
alter table public.knowledge_files disable row level security;
alter table public.competition_files disable row level security;
alter table public.life_events disable row level security;
alter table public.document_chunks disable row level security;
