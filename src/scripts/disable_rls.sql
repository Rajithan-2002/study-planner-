-- ==============================================================================
-- LIFE OS V2 : DISABLE ROW LEVEL SECURITY (RLS)
-- Run this script in your Supabase SQL Editor to disable RLS for local development.
-- ==============================================================================

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
alter table public.notes disable row level security;
alter table public.study_sessions disable row level security;
alter table public.inbox_items disable row level security;
