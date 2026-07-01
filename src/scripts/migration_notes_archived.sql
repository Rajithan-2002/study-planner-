-- ==============================================================================
-- LIFE OS MIGRATION: NOTES ARCHIVAL & INDEX OPTIMIZATION
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Upgrade the public.notes table with archival columns
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS is_archived boolean default false,
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS archived_by uuid references public.users(id) on delete set null;

-- 2. Create missing performance indexes for foreign keys & search queries
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes (user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_items_user_id ON public.inbox_items (user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_user_id ON public.knowledge_files (user_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_id_scheduled ON public.time_blocks (user_id, scheduled_at);

-- 3. Verify changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notes';
