-- ==============================================================================
-- LIFE OS V2 : SCHEMA ROLLBACK V3
-- Reverts changes made by migration_v3.sql.
-- Run this in your Supabase SQL Editor if you need to rollback.
-- ==============================================================================

DROP TABLE IF EXISTS public.inbox_items CASCADE;
DROP TABLE IF EXISTS public.study_sessions CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;

ALTER TABLE public.knowledge_files 
DROP COLUMN IF EXISTS tags,
DROP COLUMN IF EXISTS ai_category,
DROP COLUMN IF EXISTS summary,
DROP COLUMN IF EXISTS source;
