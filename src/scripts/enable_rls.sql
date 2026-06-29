-- ==============================================================================
-- LIFE OS V2 : ROW LEVEL SECURITY (RLS) POLICIES
-- Run this script in your Supabase SQL Editor to enable user isolation.
-- ==============================================================================

-- 1. Enable RLS on every table
alter table public.users enable row level security;
alter table public.domains enable row level security;
alter table public.skills enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_logs enable row level security;
alter table public.ai_tool_logs enable row level security;
alter table public.discussion_threads enable row level security;
alter table public.discussion_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.device_tokens enable row level security;
alter table public.curriculum_modules enable row level security;
alter table public.academic_semesters enable row level security;
alter table public.modules enable row level security;
alter table public.module_results enable row level security;
alter table public.timetable_sessions enable row level security;
alter table public.assignments enable row level security;
alter table public.exams enable row level security;
alter table public.projects enable row level security;
alter table public.certifications enable row level security;
alter table public.certification_resources enable row level security;
alter table public.competitions enable row level security;
alter table public.knowledge_files enable row level security;
alter table public.competition_files enable row level security;
alter table public.life_events enable row level security;
alter table public.document_chunks enable row level security;
alter table public.notes enable row level security;
alter table public.study_sessions enable row level security;
alter table public.inbox_items enable row level security;

-- 2. Drop existing policies to prevent conflicts
drop policy if exists "Users can manage their own profile" on public.users;
drop policy if exists "Users can manage their own domains" on public.domains;
drop policy if exists "Users can manage their own skills" on public.skills;
drop policy if exists "Users can manage their own tasks" on public.tasks;
drop policy if exists "Users can manage their own activity_logs" on public.activity_logs;
drop policy if exists "Users can manage their own ai_tool_logs" on public.ai_tool_logs;
drop policy if exists "Users can manage their own discussion_threads" on public.discussion_threads;
drop policy if exists "Users can manage messages of their own threads" on public.discussion_messages;
drop policy if exists "Users can manage their own notifications" on public.notifications;
drop policy if exists "Users can manage their own device_tokens" on public.device_tokens;
drop policy if exists "Allow read access to all" on public.curriculum_modules;
drop policy if exists "Users can manage their own academic_semesters" on public.academic_semesters;
drop policy if exists "Users can manage their own modules" on public.modules;
drop policy if exists "Users can manage results of their own modules" on public.module_results;
drop policy if exists "Users can manage sessions of their own modules" on public.timetable_sessions;
drop policy if exists "Users can manage assignments of their own modules" on public.assignments;
drop policy if exists "Users can manage exams of their own modules" on public.exams;
drop policy if exists "Users can manage their own projects" on public.projects;
drop policy if exists "Users can manage their own certifications" on public.certifications;
drop policy if exists "Users can manage resources of their own certifications" on public.certification_resources;
drop policy if exists "Users can manage their own competitions" on public.competitions;
drop policy if exists "Users can manage their own knowledge_files" on public.knowledge_files;
drop policy if exists "Users can manage files of their own competitions" on public.competition_files;
drop policy if exists "Users can manage their own life_events" on public.life_events;
drop policy if exists "Users can manage chunks of their own files" on public.document_chunks;
drop policy if exists "Users can manage their own notes" on public.notes;
drop policy if exists "Users can manage their own study_sessions" on public.study_sessions;
drop policy if exists "Users can manage their own inbox_items" on public.inbox_items;

-- 3. Create RLS Policies

-- USERS
create policy "Users can manage their own profile" on public.users
    for all using (id = auth.uid());

-- CURRICULUM MODULES (Read-only for all users)
create policy "Allow read access to all" on public.curriculum_modules
    for select using (true);

-- DIRECTLY USER-OWNED TABLES
create policy "Users can manage their own domains" on public.domains
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own skills" on public.skills
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own tasks" on public.tasks
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own activity_logs" on public.activity_logs
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own ai_tool_logs" on public.ai_tool_logs
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own discussion_threads" on public.discussion_threads
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own notifications" on public.notifications
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own device_tokens" on public.device_tokens
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own academic_semesters" on public.academic_semesters
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own modules" on public.modules
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own projects" on public.projects
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own certifications" on public.certifications
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own competitions" on public.competitions
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own knowledge_files" on public.knowledge_files
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own life_events" on public.life_events
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own notes" on public.notes
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own study_sessions" on public.study_sessions
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage their own inbox_items" on public.inbox_items
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- RELATIONAL / CHILD TABLES (Protected by querying ancestor ownership)

create policy "Users can manage results of their own modules" on public.module_results
    for all using (
        exists (
            select 1 from public.modules 
            where modules.id = module_results.module_id 
            and modules.user_id = auth.uid()
        )
    );

create policy "Users can manage sessions of their own modules" on public.timetable_sessions
    for all using (
        exists (
            select 1 from public.modules 
            where modules.id = timetable_sessions.module_id 
            and modules.user_id = auth.uid()
        )
    );

create policy "Users can manage assignments of their own modules" on public.assignments
    for all using (
        exists (
            select 1 from public.modules 
            where modules.id = assignments.module_id 
            and modules.user_id = auth.uid()
        )
    );

create policy "Users can manage exams of their own modules" on public.exams
    for all using (
        exists (
            select 1 from public.modules 
            where modules.id = exams.module_id 
            and modules.user_id = auth.uid()
        )
    );

create policy "Users can manage resources of their own certifications" on public.certification_resources
    for all using (
        exists (
            select 1 from public.certifications 
            where certifications.id = certification_resources.certification_id 
            and certifications.user_id = auth.uid()
        )
    );

create policy "Users can manage files of their own competitions" on public.competition_files
    for all using (
        exists (
            select 1 from public.competitions 
            where competitions.id = competition_files.competition_id 
            and competitions.user_id = auth.uid()
        )
    );

create policy "Users can manage chunks of their own files" on public.document_chunks
    for all using (
        exists (
            select 1 from public.knowledge_files 
            where knowledge_files.id = document_chunks.file_id 
            and knowledge_files.user_id = auth.uid()
        )
    );

create policy "Users can manage messages of their own threads" on public.discussion_messages
    for all using (
        exists (
            select 1 from public.discussion_threads 
            where discussion_threads.id = discussion_messages.thread_id 
            and discussion_threads.user_id = auth.uid()
        )
    );

-- 4. SUPABASE STORAGE POLICIES (For 'knowledge' bucket isolation)
-- Allow authenticated users to manage files within their own folder (which matches their user ID)

create policy "Allow authenticated uploads" on storage.objects
    for insert with check (
        bucket_id = 'knowledge' 
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Allow authenticated select" on storage.objects
    for select using (
        bucket_id = 'knowledge'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Allow authenticated deletes" on storage.objects
    for delete using (
        bucket_id = 'knowledge'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

