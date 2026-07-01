-- ==============================================================================
-- LIFE OS V2 : COMPLETE DATABASE SCHEMA
-- This script will ERASE the existing database and recreate it from scratch.
-- Run this entirely in your Supabase SQL Editor.
-- ==============================================================================

create extension if not exists vector;

-- 1. DROP EVERYTHING (CLEAN SLATE)
drop table if exists public.action_templates cascade;
drop table if exists public.action_execution_logs cascade;
drop table if exists public.ai_actions cascade;
drop table if exists public.reflections cascade;
drop table if exists public.memory_access_logs cascade;
drop table if exists public.conversation_summaries cascade;
drop table if exists public.user_preferences cascade;
drop table if exists public.memory_relationships cascade;
drop table if exists public.ai_memories cascade;
drop table if exists public.knowledge_embeddings cascade;
drop table if exists public.embedding_jobs cascade;
drop table if exists public.retrieval_logs cascade;
drop table if exists public.citation_cache cascade;
drop table if exists public.knowledge_chunks cascade;
drop table if exists public.knowledge_document_versions cascade;
drop table if exists public.platform_relationships cascade;
drop table if exists public.user_schedule_preferences cascade;
drop table if exists public.time_blocks cascade;
drop table if exists public.generated_plans cascade;
drop table if exists public.schedule_conflicts cascade;
drop table if exists public.recommendations cascade;
drop table if exists public.competition_files cascade;
drop table if exists public.knowledge_files cascade;
drop table if exists public.notes cascade;
drop table if exists public.inbox_items cascade;
drop table if exists public.competitions cascade;
drop table if exists public.certification_resources cascade;
drop table if exists public.certification_study_sessions cascade;
drop table if exists public.certification_subtopics cascade;
drop table if exists public.certification_topics cascade;
drop table if exists public.certifications cascade;
drop table if exists public.project_milestones cascade;
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
  faculty text,
  degree_name text,
  department text,
  graduation_year integer,
  career_goal text,
  current_gpa numeric(3,2),
  target_gpa numeric(3,2),
  current_year integer,
  current_semester integer,
  academic_profile_completed boolean default false,
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
  course_code text not null unique,
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
  is_archived boolean default false,
  year integer,
  semester integer,
  notes text,
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
  target_completion_date timestamp with time zone,
  estimated_hours numeric(5,2) default 0,
  weekly_target_hours numeric(5,2) default 0,
  daily_focus_minutes integer default 0,
  is_archived boolean default false,
  completed_at timestamp with time zone,
  risk_level text default 'LOW',
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PROJECT MILESTONES
create table public.project_milestones (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  title text not null,
  description text,
  status text default 'PENDING',
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TASKS (Universal Queue)
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  milestone_id uuid references public.project_milestones on delete set null,
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
  daily_study_minutes integer default 30,
  weekly_study_goal_hours numeric(5,2) default 3,
  is_archived boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CERTIFICATION TOPICS (Exam Domain Blueprints)
create table public.certification_topics (
  id uuid default gen_random_uuid() primary key,
  certification_id uuid references public.certifications on delete cascade not null,
  domain_name text,
  title text not null,
  description text,
  priority text default 'MEDIUM',
  difficulty text default 'MEDIUM', -- EASY, MEDIUM, HARD
  estimated_study_hours numeric(5,2) default 0,
  learning_status text default 'NOT_STARTED', -- NOT_STARTED, READING, PRACTICING, REVIEWING, MASTERED
  notes text,
  tags text[] default '{}',
  confidence_level integer default 3, -- 1-5 scale
  last_studied_at timestamp with time zone,
  completion_date timestamp with time zone,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CERTIFICATION SUBTOPICS
create table public.certification_subtopics (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references public.certification_topics on delete cascade not null,
  title text not null,
  status text default 'PENDING', -- PENDING, COMPLETED
  completed_at timestamp with time zone,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CERTIFICATION STUDY SESSIONS (Time Tracking)
create table public.certification_study_sessions (
  id uuid default gen_random_uuid() primary key,
  certification_id uuid references public.certifications on delete cascade not null,
  topic_id uuid references public.certification_topics on delete set null,
  duration_minutes integer not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CERTIFICATION RESOURCES
create table public.certification_resources (
  id uuid default gen_random_uuid() primary key,
  certification_id uuid references public.certifications on delete cascade not null,
  topic_id uuid references public.certification_topics on delete cascade,
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

-- SCHEDULER PREFERENCES
create table public.user_schedule_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  preferred_focus_time text default 'MORNING', -- MORNING, AFTERNOON, EVENING, NIGHT
  max_daily_study_hours numeric(3,1) default 4.0,
  max_daily_project_hours numeric(3,1) default 3.0,
  buffer_minutes integer default 10,
  sleep_start_time time default '23:00',
  sleep_end_time time default '07:00',
  work_start_time time default '08:00',
  work_end_time time default '18:00',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- UNIFIED TIME BLOCKS
create table public.time_blocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null,
  type text default 'DEEP_WORK', -- STUDY, PROJECT, MEETING, BREAK, EXERCISE, PERSONAL, DEEP_WORK
  status text default 'PENDING', -- PENDING, ACTIVE, COMPLETED, SKIPPED
  scheduled_at timestamp with time zone not null,
  duration_minutes integer not null,
  is_locked boolean default false,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- GENERATED PLANS
create table public.generated_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  plan_date date not null,
  type text default 'DAILY', -- DAILY, WEEKLY
  status text default 'PROPOSED', -- PROPOSED, ACCEPTED, REJECTED
  plan_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SCHEDULE CONFLICTS
create table public.schedule_conflicts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null,
  description text,
  severity text default 'MEDIUM', -- LOW, MEDIUM, HIGH
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RECOMMENDATIONS (Decision Engine Outputs)
create table public.recommendations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null,
  description text,
  category text not null, -- CRITICAL, OPTIMIZATION, WELLNESS, RISK_MITIGATION
  status text default 'GENERATED', -- GENERATED, ACCEPTED, DISMISSED
  priority_score numeric(4,2),
  impact_score numeric(4,2),
  urgency_score numeric(4,2),
  effort_score numeric(4,2),
  explainability jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
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
  description text,
  author text,
  source_type text default 'UPLOAD', -- UPLOAD, URL, NOTE, BOOK, VIDEO, COURSE, WEB, AI
  owner_user_id uuid references public.users on delete set null,
  is_archived boolean default false,
  file_size bigint,
  tags text[] default '{}',
  version text default '1.0',
  language text default 'en',
  visibility text default 'private',
  processing_status text default 'UPLOADED', -- UPLOADED, EXTRACTED, CHUNKED, EMBEDDED, INDEXED, READY
  knowledge_status text default 'UNREAD', -- UNREAD, READING, REVIEWED, MASTERED, ARCHIVED
  keywords text[] default '{}',
  reading_progress numeric(5,2) default 0,
  last_opened_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.competition_files (
  id uuid default gen_random_uuid() primary key,
  competition_id uuid references public.competitions on delete cascade not null,
  file_id uuid references public.knowledge_files on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- KNOWLEDGE CHUNKS (For RAG AI)
create table public.knowledge_chunks (
  id uuid default gen_random_uuid() primary key,
  file_id uuid references public.knowledge_files on delete cascade not null,
  chunk_number integer not null,
  content text not null,
  start_offset integer,
  end_offset integer,
  token_count integer,
  embedding vector(1536),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- KNOWLEDGE DOCUMENT VERSIONS
create table public.knowledge_document_versions (
  id uuid default gen_random_uuid() primary key,
  file_id uuid references public.knowledge_files on delete cascade not null,
  version text not null,
  file_url text not null,
  file_size bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- KNOWLEDGE EMBEDDINGS (RAG Vector Store)
create table public.knowledge_embeddings (
  id uuid default gen_random_uuid() primary key,
  chunk_id uuid references public.knowledge_chunks on delete cascade not null,
  embedding vector(1536),
  embedding_model text default 'text-embedding-3-small',
  version integer default 1,
  status text default 'ACTIVE', -- ACTIVE, NEEDS_REGENERATION, PENDING_EMBEDDING
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EMBEDDING JOBS (Asynchronous background queue)
create table public.embedding_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  document_id uuid references public.knowledge_files on delete cascade,
  status text default 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RETRIEVAL LOGS
create table public.retrieval_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  query text not null,
  chunks_retrieved integer default 0,
  latency_ms integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CITATION CACHE
create table public.citation_cache (
  id uuid default gen_random_uuid() primary key,
  query_hash text not null,
  citations jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AI MEMORIES
create table public.ai_memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  memory_type text not null, -- ACADEMIC, PROJECTS, CERTIFICATIONS, KNOWLEDGE, SCHEDULER, PREFERENCE, RELATIONSHIP, CONVERSATION, GOAL, ACHIEVEMENT, BEHAVIOR, CUSTOM
  title text not null,
  content text not null,
  embedding_id uuid,
  importance_score numeric(3,2) default 1.0,
  confidence_score numeric(3,2) default 1.0,
  access_count integer default 0,
  last_accessed timestamp with time zone default timezone('utc'::text, now()),
  decay_score numeric(3,2) default 1.0,
  lifecycle_state text default 'ACTIVE', -- OBSERVED, CANDIDATE, VERIFIED, ACTIVE, FREQUENTLY_USED, ARCHIVED, FORGOTTEN
  source text default 'USER_CHAT',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MEMORY RELATIONSHIPS
create table public.memory_relationships (
  id uuid default gen_random_uuid() primary key,
  source_memory_id uuid references public.ai_memories on delete cascade not null,
  target_memory_id uuid references public.ai_memories on delete cascade not null,
  relationship_type text not null, -- SUPPORTS, CONTRADICTS, REFERENCES, DERIVED_FROM, RELATED_TO
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- USER PREFERENCES
create table public.user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade unique not null,
  preferred_study_hours numeric(3,1) default 4.0,
  preferred_ai_style text default 'BALANCED',
  preferred_learning_style text default 'VISUAL',
  career_goals text,
  focus_duration integer default 45,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CONVERSATION SUMMARIES
create table public.conversation_summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  session_id text not null,
  summary_content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MEMORY ACCESS LOGS
create table public.memory_access_logs (
  id uuid default gen_random_uuid() primary key,
  memory_id uuid references public.ai_memories on delete cascade not null,
  accessed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REFLECTIONS
create table public.reflections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  reflection_type text default 'WEEKLY_REVIEW', -- WEEKLY_REVIEW, HABIT_DETECTION, ACHIEVEMENT_RECOGNITION, MISSED_OPPORTUNITY
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AI ACTIONS
create table public.ai_actions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  action_type text not null,
  target_entity text,
  target_id text,
  parameters jsonb,
  status text default 'PENDING', -- PENDING, WAITING_CONFIRMATION, APPROVED, RUNNING, COMPLETED, FAILED, ROLLED_BACK
  rollback_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  executed_at timestamp with time zone
);

-- ACTION EXECUTION LOGS
create table public.action_execution_logs (
  id uuid default gen_random_uuid() primary key,
  action_id uuid references public.ai_actions on delete cascade not null,
  step_name text not null,
  status text not null,
  duration_ms integer default 0,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ACTION TEMPLATES
create table public.action_templates (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  workflow_steps jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);



-- PLATFORM RELATIONSHIPS (Unified Platform Knowledge Graph)
create table public.platform_relationships (
  id uuid default gen_random_uuid() primary key,
  source_entity_type text not null,
  source_entity_id uuid not null,
  target_entity_type text not null,
  target_entity_id uuid not null,
  relationship_type text default 'REFERENCES', -- REFERENCES, DEPENDS_ON, BLOCKED_BY, PREREQUISITE
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INBOX ITEMS
create table public.inbox_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  content text not null,
  source text default 'QUICK_CAPTURE',
  status text default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NOTES (Knowledge notes)
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  domain_id uuid references public.domains on delete set null,
  title text not null,
  content text,
  tags text[] default '{}',
  is_archived boolean default false,
  archived_at timestamp with time zone,
  archived_by uuid references public.users(id) on delete set null,
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

create index if not exists idx_modules_semester_id on public.modules (semester_id);
create index if not exists idx_modules_user_id on public.modules (user_id);
create index if not exists idx_assignments_module_id on public.assignments (module_id);
create index if not exists idx_exams_module_id on public.exams (module_id);
create index if not exists idx_projects_user_domain on public.projects (user_id, domain_id);
create index if not exists idx_certifications_user_domain on public.certifications (user_id, domain_id);
create index if not exists idx_life_events_user_date on public.life_events (user_id, event_date);
create index if not exists idx_tasks_user_due on public.tasks (user_id, due_date);
create index if not exists idx_notes_user_id on public.notes (user_id);
create index if not exists idx_inbox_items_user_id on public.inbox_items (user_id);
create index if not exists idx_knowledge_files_user_id on public.knowledge_files (user_id);
create index if not exists idx_time_blocks_user_id_scheduled on public.time_blocks (user_id, scheduled_at);
create index if not exists knowledge_chunks_embedding_idx on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists knowledge_embeddings_embedding_idx on public.knowledge_embeddings using hnsw (embedding vector_cosine_ops);

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
drop trigger if exists set_updated_at on public.users;
create trigger set_updated_at before update on public.users for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.domains;
create trigger set_updated_at before update on public.domains for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.skills;
create trigger set_updated_at before update on public.skills for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.tasks;
create trigger set_updated_at before update on public.tasks for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.discussion_threads;
create trigger set_updated_at before update on public.discussion_threads for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.curriculum_modules;
create trigger set_updated_at before update on public.curriculum_modules for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.academic_semesters;
create trigger set_updated_at before update on public.academic_semesters for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.modules;
create trigger set_updated_at before update on public.modules for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.module_results;
create trigger set_updated_at before update on public.module_results for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.timetable_sessions;
create trigger set_updated_at before update on public.timetable_sessions for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.assignments;
create trigger set_updated_at before update on public.assignments for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.exams;
create trigger set_updated_at before update on public.exams for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at before update on public.projects for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.certifications;
create trigger set_updated_at before update on public.certifications for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.certification_resources;
create trigger set_updated_at before update on public.certification_resources for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.competitions;
create trigger set_updated_at before update on public.competitions for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.knowledge_files;
create trigger set_updated_at before update on public.knowledge_files for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.life_events;
create trigger set_updated_at before update on public.life_events for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.inbox_items;
create trigger set_updated_at before update on public.inbox_items for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.notes;
create trigger set_updated_at before update on public.notes for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.project_milestones;
create trigger set_updated_at before update on public.project_milestones for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.certification_topics;
create trigger set_updated_at before update on public.certification_topics for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.certification_subtopics;
create trigger set_updated_at before update on public.certification_subtopics for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.knowledge_chunks;
create trigger set_updated_at before update on public.knowledge_chunks for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.user_schedule_preferences;
create trigger set_updated_at before update on public.user_schedule_preferences for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_updated_at on public.time_blocks;
create trigger set_updated_at before update on public.time_blocks for each row execute procedure public.set_current_timestamp_updated_at();

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
alter table if exists public.users disable row level security;
alter table if exists public.domains disable row level security;
alter table if exists public.skills disable row level security;
alter table if exists public.tasks disable row level security;
alter table if exists public.activity_logs disable row level security;
alter table if exists public.ai_tool_logs disable row level security;
alter table if exists public.discussion_threads disable row level security;
alter table if exists public.discussion_messages disable row level security;
alter table if exists public.notifications disable row level security;
alter table if exists public.device_tokens disable row level security;
alter table if exists public.curriculum_modules disable row level security;
alter table if exists public.academic_semesters disable row level security;
alter table if exists public.modules disable row level security;
alter table if exists public.module_results disable row level security;
alter table if exists public.timetable_sessions disable row level security;
alter table if exists public.assignments disable row level security;
alter table if exists public.exams disable row level security;
alter table if exists public.projects disable row level security;
alter table if exists public.certifications disable row level security;
alter table if exists public.certification_resources disable row level security;
alter table if exists public.competitions disable row level security;
alter table if exists public.knowledge_files disable row level security;
alter table if exists public.knowledge_chunks disable row level security;
alter table if exists public.knowledge_document_versions disable row level security;
alter table if exists public.platform_relationships disable row level security;
alter table if exists public.competition_files disable row level security;
alter table if exists public.life_events disable row level security;
alter table if exists public.inbox_items disable row level security;
alter table if exists public.notes disable row level security;
alter table if exists public.project_milestones disable row level security;
alter table if exists public.certification_topics disable row level security;
alter table if exists public.certification_subtopics disable row level security;
alter table if exists public.certification_study_sessions disable row level security;
alter table if exists public.user_schedule_preferences disable row level security;
alter table if exists public.time_blocks disable row level security;
alter table if exists public.generated_plans disable row level security;
alter table if exists public.schedule_conflicts disable row level security;
alter table if exists public.recommendations disable row level security;
alter table if exists public.knowledge_embeddings disable row level security;
alter table if exists public.embedding_jobs disable row level security;
alter table if exists public.retrieval_logs disable row level security;
alter table if exists public.citation_cache disable row level security;
alter table if exists public.ai_memories disable row level security;
alter table if exists public.memory_relationships disable row level security;
alter table if exists public.user_preferences disable row level security;
alter table if exists public.conversation_summaries disable row level security;
alter table if exists public.memory_access_logs disable row level security;
alter table if exists public.reflections disable row level security;
alter table if exists public.ai_actions disable row level security;
alter table if exists public.action_execution_logs disable row level security;
alter table if exists public.action_templates disable row level security;
