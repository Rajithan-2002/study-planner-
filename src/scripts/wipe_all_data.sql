-- ==============================================================================
-- LIFE OS — COMPLETE RESET & REBUILD
-- Wipes ALL data + ALL auth users, drops all tables, recreates everything fresh.
-- Run this in Supabase SQL Editor → New Query → Run
-- After running: login fresh with Google at http://localhost:3000/login
-- ==============================================================================


-- ==============================================================================
-- STEP 1: WIPE ALL AUTH USERS
-- ==============================================================================
DELETE FROM auth.users;


-- ==============================================================================
-- STEP 2: DROP ALL EXISTING TABLES (clean slate)
-- ==============================================================================
DROP TABLE IF EXISTS public.planning_decisions CASCADE;
DROP TABLE IF EXISTS public.availability_exceptions CASCADE;
DROP TABLE IF EXISTS public.fixed_commitments CASCADE;
DROP TABLE IF EXISTS public.recurring_activity_logs CASCADE;
DROP TABLE IF EXISTS public.recurring_activities CASCADE;
DROP TABLE IF EXISTS public.planning_capacity CASCADE;
DROP TABLE IF EXISTS public.action_templates CASCADE;
DROP TABLE IF EXISTS public.action_execution_logs CASCADE;
DROP TABLE IF EXISTS public.ai_actions CASCADE;
DROP TABLE IF EXISTS public.reflections CASCADE;
DROP TABLE IF EXISTS public.memory_access_logs CASCADE;
DROP TABLE IF EXISTS public.conversation_summaries CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.memory_relationships CASCADE;
DROP TABLE IF EXISTS public.ai_memories CASCADE;
DROP TABLE IF EXISTS public.knowledge_embeddings CASCADE;
DROP TABLE IF EXISTS public.embedding_jobs CASCADE;
DROP TABLE IF EXISTS public.retrieval_logs CASCADE;
DROP TABLE IF EXISTS public.citation_cache CASCADE;
DROP TABLE IF EXISTS public.knowledge_chunks CASCADE;
DROP TABLE IF EXISTS public.knowledge_document_versions CASCADE;
DROP TABLE IF EXISTS public.platform_relationships CASCADE;
DROP TABLE IF EXISTS public.user_schedule_preferences CASCADE;
DROP TABLE IF EXISTS public.time_blocks CASCADE;
DROP TABLE IF EXISTS public.generated_plans CASCADE;
DROP TABLE IF EXISTS public.schedule_conflicts CASCADE;
DROP TABLE IF EXISTS public.recommendations CASCADE;
DROP TABLE IF EXISTS public.competition_files CASCADE;
DROP TABLE IF EXISTS public.knowledge_files CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.inbox_items CASCADE;
DROP TABLE IF EXISTS public.competitions CASCADE;
DROP TABLE IF EXISTS public.certification_resources CASCADE;
DROP TABLE IF EXISTS public.certification_study_sessions CASCADE;
DROP TABLE IF EXISTS public.certification_subtopics CASCADE;
DROP TABLE IF EXISTS public.certification_topics CASCADE;
DROP TABLE IF EXISTS public.certifications CASCADE;
DROP TABLE IF EXISTS public.project_milestones CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.timetable_sessions CASCADE;
DROP TABLE IF EXISTS public.module_results CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.academic_semesters CASCADE;
DROP TABLE IF EXISTS public.curriculum_modules CASCADE;
DROP TABLE IF EXISTS public.life_events CASCADE;
DROP TABLE IF EXISTS public.device_tokens CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.discussion_messages CASCADE;
DROP TABLE IF EXISTS public.discussion_threads CASCADE;
DROP TABLE IF EXISTS public.ai_tool_logs CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.domains CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.work_sessions CASCADE;

-- ==============================================================================
-- STEP 3: DROP ENUMS
-- ==============================================================================
DROP TYPE IF EXISTS module_status CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS cert_status CASCADE;
DROP TYPE IF EXISTS session_type CASCADE;
DROP TYPE IF EXISTS discussion_entity_type CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;
DROP TYPE IF EXISTS resource_type CASCADE;
DROP TYPE IF EXISTS knowledge_entity_type CASCADE;


-- ==============================================================================
-- STEP 4: CREATE EXTENSIONS & ENUMS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

CREATE TYPE module_status AS ENUM ('NOT_STARTED', 'ONGOING', 'EXAM_PENDING', 'RESULT_PENDING', 'COMPLETED', 'REPEAT');
CREATE TYPE project_status AS ENUM ('IDEA', 'RESEARCHING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE cert_status AS ENUM ('IDEA', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE session_type AS ENUM ('LECTURE', 'LAB', 'PRACTICAL', 'TUTORIAL');
CREATE TYPE discussion_entity_type AS ENUM ('PROJECT', 'CERTIFICATION', 'MODULE', 'CAREER', 'DOMAIN');
CREATE TYPE event_type AS ENUM ('EXAM', 'ASSIGNMENT', 'CERT_EXAM', 'PROJECT_MILESTONE', 'COMPETITION', 'INTERNSHIP_DEADLINE');
CREATE TYPE resource_type AS ENUM ('COURSE', 'PRACTICE_EXAM', 'YOUTUBE', 'PDF');
CREATE TYPE knowledge_entity_type AS ENUM ('MODULE', 'PROJECT', 'CERTIFICATION', 'INBOX');


-- ==============================================================================
-- STEP 5: CORE TABLES
-- ==============================================================================

-- USERS (root identity table)
CREATE TABLE public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
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
  academic_profile_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- DOMAINS
CREATE TABLE public.domains (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SKILLS
CREATE TABLE public.skills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text,
  level integer DEFAULT 0,
  target_level integer DEFAULT 100,
  progress numeric(5,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- STEP 6: ACADEMIC HUB
-- ==============================================================================

CREATE TABLE public.curriculum_modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code text NOT NULL UNIQUE,
  course_name text NOT NULL,
  credits integer NOT NULL,
  year integer NOT NULL,
  semester integer NOT NULL,
  is_compulsory boolean DEFAULT true,
  category text,
  track text,
  prerequisites text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.academic_semesters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  semester integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, year, semester)
);

CREATE TABLE public.modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  curriculum_module_id uuid REFERENCES public.curriculum_modules ON DELETE SET NULL,
  semester_id uuid REFERENCES public.academic_semesters ON DELETE SET NULL,
  code text NOT NULL,
  name text NOT NULL,
  credits integer NOT NULL,
  grade text,
  status module_status DEFAULT 'NOT_STARTED',
  priority text DEFAULT 'LOW',
  is_selected boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  year integer,
  semester integer,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.module_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid REFERENCES public.modules ON DELETE CASCADE NOT NULL,
  component text NOT NULL,
  weight numeric(5,2),
  marks numeric(5,2),
  grade text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.timetable_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid REFERENCES public.modules ON DELETE CASCADE NOT NULL,
  day text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  session_type session_type,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid REFERENCES public.modules ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  weight numeric(5,2),
  deadline timestamp with time zone,
  status text DEFAULT 'PENDING',
  marks numeric(5,2),
  priority text DEFAULT 'LOW',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.exams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid REFERENCES public.modules ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  weight numeric(5,2),
  exam_date timestamp with time zone,
  status text DEFAULT 'PENDING',
  marks numeric(5,2),
  priority text DEFAULT 'LOW',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- STEP 7: PROJECTS, TASKS, CERTIFICATIONS
-- ==============================================================================

CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  domain_id uuid REFERENCES public.domains ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  category text,
  status project_status DEFAULT 'IDEA',
  priority text DEFAULT 'LOW',
  notes text,
  target_completion_date timestamp with time zone,
  estimated_hours numeric(5,2) DEFAULT 0,
  estimated_total_hours numeric(5,2) DEFAULT 0,
  completed_hours numeric(5,2) DEFAULT 0,
  weekly_target_hours numeric(5,2) DEFAULT 0,
  daily_focus_minutes integer DEFAULT 0,
  is_archived boolean DEFAULT false,
  completed_at timestamp with time zone,
  risk_level text DEFAULT 'LOW',
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.project_milestones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'PENDING',
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  milestone_id uuid REFERENCES public.project_milestones ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'PENDING',
  priority text DEFAULT 'LOW',
  due_date timestamp with time zone,
  domain_id uuid REFERENCES public.domains ON DELETE SET NULL,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.certifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  domain_id uuid REFERENCES public.domains ON DELETE SET NULL,
  name text NOT NULL,
  provider text,
  cost numeric(10,2),
  target_date timestamp with time zone,
  target_exam_date timestamp with time zone,
  exam_date timestamp with time zone,
  target_date_alias timestamp with time zone,
  status cert_status DEFAULT 'IDEA',
  priority text DEFAULT 'LOW',
  notes text,
  daily_study_minutes integer DEFAULT 30,
  weekly_study_goal_hours numeric(5,2) DEFAULT 3,
  estimated_total_hours numeric(5,2) DEFAULT 0,
  completed_hours numeric(5,2) DEFAULT 0,
  is_archived boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.certification_topics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  certification_id uuid REFERENCES public.certifications ON DELETE CASCADE NOT NULL,
  domain_name text,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'MEDIUM',
  difficulty text DEFAULT 'MEDIUM',
  estimated_study_hours numeric(5,2) DEFAULT 0,
  learning_status text DEFAULT 'NOT_STARTED',
  notes text,
  tags text[] DEFAULT '{}',
  confidence_level integer DEFAULT 3,
  last_studied_at timestamp with time zone,
  completion_date timestamp with time zone,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.certification_subtopics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid REFERENCES public.certification_topics ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  status text DEFAULT 'PENDING',
  completed_at timestamp with time zone,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.certification_study_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  certification_id uuid REFERENCES public.certifications ON DELETE CASCADE NOT NULL,
  topic_id uuid REFERENCES public.certification_topics ON DELETE SET NULL,
  duration_minutes integer NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.certification_resources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  certification_id uuid REFERENCES public.certifications ON DELETE CASCADE NOT NULL,
  topic_id uuid REFERENCES public.certification_topics ON DELETE CASCADE,
  title text NOT NULL,
  url text,
  resource_type resource_type,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.competitions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  organizer text,
  registration_deadline timestamp with time zone,
  submission_deadline timestamp with time zone,
  prize text,
  status text DEFAULT 'OPEN',
  priority text DEFAULT 'LOW',
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- STEP 8: TIMELINE, SCHEDULER, KNOWLEDGE
-- ==============================================================================

CREATE TABLE public.life_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type event_type NOT NULL,
  event_date timestamp with time zone NOT NULL,
  importance integer DEFAULT 0,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  related_entity_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.user_schedule_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_focus_time text DEFAULT 'MORNING',
  max_daily_study_hours numeric(3,1) DEFAULT 4.0,
  max_daily_project_hours numeric(3,1) DEFAULT 3.0,
  buffer_minutes integer DEFAULT 10,
  sleep_start_time time DEFAULT '23:00',
  sleep_end_time time DEFAULT '07:00',
  work_start_time time DEFAULT '08:00',
  work_end_time time DEFAULT '22:00',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.time_blocks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type text DEFAULT 'DEEP_WORK',
  status text DEFAULT 'PENDING',
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL,
  is_locked boolean DEFAULT false,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.generated_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  plan_date date NOT NULL,
  type text DEFAULT 'DAILY',
  status text DEFAULT 'PROPOSED',
  plan_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.schedule_conflicts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  severity text DEFAULT 'MEDIUM',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.recommendations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  status text DEFAULT 'GENERATED',
  priority_score numeric(4,2),
  impact_score numeric(4,2),
  urgency_score numeric(4,2),
  effort_score numeric(4,2),
  explainability jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.knowledge_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  domain_id uuid REFERENCES public.domains ON DELETE SET NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  entity_type knowledge_entity_type DEFAULT 'INBOX',
  entity_id uuid,
  description text,
  author text,
  source_type text DEFAULT 'UPLOAD',
  owner_user_id uuid REFERENCES public.users ON DELETE SET NULL,
  is_archived boolean DEFAULT false,
  file_size bigint,
  tags text[] DEFAULT '{}',
  version text DEFAULT '1.0',
  language text DEFAULT 'en',
  visibility text DEFAULT 'private',
  processing_status text DEFAULT 'UPLOADED',
  knowledge_status text DEFAULT 'UNREAD',
  keywords text[] DEFAULT '{}',
  reading_progress numeric(5,2) DEFAULT 0,
  last_opened_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.competition_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id uuid REFERENCES public.competitions ON DELETE CASCADE NOT NULL,
  file_id uuid REFERENCES public.knowledge_files ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.knowledge_chunks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id uuid REFERENCES public.knowledge_files ON DELETE CASCADE NOT NULL,
  chunk_number integer NOT NULL,
  content text NOT NULL,
  start_offset integer,
  end_offset integer,
  token_count integer,
  embedding vector(1536),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.knowledge_document_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id uuid REFERENCES public.knowledge_files ON DELETE CASCADE NOT NULL,
  version text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.knowledge_embeddings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chunk_id uuid REFERENCES public.knowledge_chunks ON DELETE CASCADE NOT NULL,
  embedding vector(1536),
  embedding_model text DEFAULT 'text-embedding-3-small',
  version integer DEFAULT 1,
  status text DEFAULT 'ACTIVE',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.embedding_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.knowledge_files ON DELETE CASCADE,
  status text DEFAULT 'PENDING',
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.retrieval_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  query text NOT NULL,
  chunks_retrieved integer DEFAULT 0,
  latency_ms integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.citation_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  query_hash text NOT NULL,
  citations jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  domain_id uuid REFERENCES public.domains ON DELETE SET NULL,
  title text NOT NULL,
  content text,
  tags text[] DEFAULT '{}',
  is_archived boolean DEFAULT false,
  archived_at timestamp with time zone,
  archived_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.inbox_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  source text DEFAULT 'QUICK_CAPTURE',
  status text DEFAULT 'PENDING',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.platform_relationships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_entity_type text NOT NULL,
  source_entity_id uuid NOT NULL,
  target_entity_type text NOT NULL,
  target_entity_id uuid NOT NULL,
  relationship_type text DEFAULT 'REFERENCES',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- STEP 9: AI, MEMORY, REFLECTION
-- ==============================================================================

CREATE TABLE public.ai_memories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  memory_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  embedding_id uuid,
  importance_score numeric(3,2) DEFAULT 1.0,
  confidence_score numeric(3,2) DEFAULT 1.0,
  access_count integer DEFAULT 0,
  last_accessed timestamp with time zone DEFAULT timezone('utc'::text, now()),
  decay_score numeric(3,2) DEFAULT 1.0,
  lifecycle_state text DEFAULT 'ACTIVE',
  source text DEFAULT 'USER_CHAT',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.memory_relationships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_memory_id uuid REFERENCES public.ai_memories ON DELETE CASCADE NOT NULL,
  target_memory_id uuid REFERENCES public.ai_memories ON DELETE CASCADE NOT NULL,
  relationship_type text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.user_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE UNIQUE NOT NULL,
  preferred_study_hours numeric(3,1) DEFAULT 4.0,
  preferred_ai_style text DEFAULT 'BALANCED',
  preferred_learning_style text DEFAULT 'VISUAL',
  career_goals text,
  focus_duration integer DEFAULT 45,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.conversation_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  summary_content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.memory_access_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  memory_id uuid REFERENCES public.ai_memories ON DELETE CASCADE NOT NULL,
  accessed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.reflections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  reflection_type text DEFAULT 'WEEKLY_REVIEW',
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.ai_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  target_entity text,
  target_id text,
  parameters jsonb,
  status text DEFAULT 'PENDING',
  rollback_data jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  executed_at timestamp with time zone
);

CREATE TABLE public.action_execution_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id uuid REFERENCES public.ai_actions ON DELETE CASCADE NOT NULL,
  step_name text NOT NULL,
  status text NOT NULL,
  duration_ms integer DEFAULT 0,
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.action_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  workflow_steps jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- STEP 10: MISC (Notifications, Logs, Discussions)
-- ==============================================================================

CREATE TABLE public.discussion_threads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  entity_type discussion_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.discussion_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid REFERENCES public.discussion_threads ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'ai')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.device_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  device_type text NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.ai_tool_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  tool_name text NOT NULL,
  input jsonb,
  output jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- STEP 11: PLANNING CENTER (Sprint 5A)
-- ==============================================================================

CREATE TABLE public.planning_capacity (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  monday_hours numeric(3,1) DEFAULT 4.0 NOT NULL,
  tuesday_hours numeric(3,1) DEFAULT 4.0 NOT NULL,
  wednesday_hours numeric(3,1) DEFAULT 4.0 NOT NULL,
  thursday_hours numeric(3,1) DEFAULT 4.0 NOT NULL,
  friday_hours numeric(3,1) DEFAULT 4.0 NOT NULL,
  saturday_hours numeric(3,1) DEFAULT 8.0 NOT NULL,
  sunday_hours numeric(3,1) DEFAULT 6.0 NOT NULL,
  preferred_focus_block integer DEFAULT 90 NOT NULL,
  minimum_break integer DEFAULT 15 NOT NULL,
  maximum_weekly_hours numeric(4,1) DEFAULT 32.0 NOT NULL,
  preferred_start_time time DEFAULT '08:00'::time NOT NULL,
  preferred_end_time time DEFAULT '22:00'::time NOT NULL,
  sleep_time time DEFAULT '23:00'::time NOT NULL,
  wake_time time DEFAULT '07:00'::time NOT NULL,
  energy_profile text CHECK (energy_profile IN ('MORNING', 'BALANCED', 'NIGHT_OWL')) DEFAULT 'BALANCED' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.recurring_activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  type text CHECK (type IN ('HABIT', 'ROUTINE', 'CHALLENGE', 'PRACTICE', 'MAINTENANCE')) DEFAULT 'HABIT' NOT NULL,
  frequency text CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')) DEFAULT 'DAILY' NOT NULL,
  days_of_week text[],
  estimated_minutes integer DEFAULT 30 NOT NULL,
  priority text CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM' NOT NULL,
  difficulty text CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')) DEFAULT 'MEDIUM' NOT NULL,
  active boolean DEFAULT true NOT NULL,
  preferred_time text CHECK (preferred_time IN ('MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME')) DEFAULT 'ANYTIME' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.recurring_activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recurring_activity_id uuid REFERENCES public.recurring_activities(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  duration_minutes integer DEFAULT 0 NOT NULL,
  completed boolean DEFAULT true NOT NULL,
  skipped boolean DEFAULT false NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(recurring_activity_id, date)
);

CREATE TABLE public.fixed_commitments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 60 NOT NULL,
  category text CHECK (category IN ('LECTURE', 'OFFICE', 'MEETING', 'TRAVEL', 'FAMILY', 'OTHER')) DEFAULT 'LECTURE' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.availability_exceptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  capacity_multiplier numeric(3,2) DEFAULT 0.00 NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.planning_decisions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_type text CHECK (event_type IN ('REBALANCE', 'DEADLINE_MOVE', 'MANUAL_OVERRIDE')) DEFAULT 'REBALANCE' NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- STEP 12: INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_modules_semester_id ON public.modules (semester_id);
CREATE INDEX IF NOT EXISTS idx_modules_user_id ON public.modules (user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_module_id ON public.assignments (module_id);
CREATE INDEX IF NOT EXISTS idx_exams_module_id ON public.exams (module_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_domain ON public.projects (user_id, domain_id);
CREATE INDEX IF NOT EXISTS idx_certifications_user_domain ON public.certifications (user_id, domain_id);
CREATE INDEX IF NOT EXISTS idx_life_events_user_date ON public.life_events (user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON public.tasks (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes (user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_items_user_id ON public.inbox_items (user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_user_id ON public.knowledge_files (user_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_id_scheduled ON public.time_blocks (user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_rec_act_user_id ON public.recurring_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_comm_user_id ON public.fixed_commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_avail_except_user_id ON public.availability_exceptions(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_dec_user_id ON public.planning_decisions(user_id);
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx ON public.knowledge_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS knowledge_embeddings_embedding_idx ON public.knowledge_embeddings USING hnsw (embedding vector_cosine_ops);


-- ==============================================================================
-- STEP 13: TRIGGERS
-- ==============================================================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'users','domains','skills','tasks','curriculum_modules','academic_semesters',
    'modules','module_results','timetable_sessions','assignments','exams',
    'projects','project_milestones','certifications','certification_topics',
    'certification_subtopics','certification_resources','competitions',
    'knowledge_files','knowledge_chunks','life_events','inbox_items','notes',
    'user_schedule_preferences','time_blocks','discussion_threads',
    'ai_memories','user_preferences','planning_capacity','recurring_activities',
    'fixed_commitments','availability_exceptions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
    ', tbl, tbl);
  END LOOP;
END $$;


-- ==============================================================================
-- STEP 14: PERMISSIONS (disable RLS for development)
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- Disable RLS on all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;


-- ==============================================================================
-- STEP 15: VERIFY
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM auth.users)        AS auth_users,
  (SELECT COUNT(*) FROM public.users)      AS public_users,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS total_tables;
