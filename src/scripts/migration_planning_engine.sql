-- ==============================================================================
-- LIFE OS MIGRATION: INTELLIGENT PLANNING & CAPACITY ENGINE
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  target_date timestamp with time zone,
  status text default 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'ARCHIVED'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

-- 2. Upgrade public.projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS estimated_total_hours numeric(5,2) default 0,
ADD COLUMN IF NOT EXISTS completed_hours numeric(5,2) default 0,
ADD COLUMN IF NOT EXISTS difficulty text default 'MEDIUM',
ADD COLUMN IF NOT EXISTS minimum_weekly_hours numeric(5,2),
ADD COLUMN IF NOT EXISTS maximum_weekly_hours numeric(5,2),
ADD COLUMN IF NOT EXISTS flexible_schedule boolean default true,
ADD COLUMN IF NOT EXISTS goal_id uuid references public.goals(id) on delete set null;

-- 3. Upgrade public.certifications table
ALTER TABLE public.certifications
ADD COLUMN IF NOT EXISTS estimated_total_hours numeric(5,2) default 0,
ADD COLUMN IF NOT EXISTS completed_hours numeric(5,2) default 0,
ADD COLUMN IF NOT EXISTS difficulty text default 'MEDIUM',
ADD COLUMN IF NOT EXISTS flexible_schedule boolean default true,
ADD COLUMN IF NOT EXISTS target_exam_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS goal_id uuid references public.goals(id) on delete set null;

-- 4. Upgrade public.assignments table
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS estimated_total_hours numeric(5,2) default 0,
ADD COLUMN IF NOT EXISTS completed_hours numeric(5,2) default 0,
ADD COLUMN IF NOT EXISTS difficulty text default 'MEDIUM',
ADD COLUMN IF NOT EXISTS deadline_type text default 'HARD', -- 'HARD', 'SOFT'
ADD COLUMN IF NOT EXISTS goal_id uuid references public.goals(id) on delete set null;

-- 5. Upgrade public.exams table
ALTER TABLE public.exams
ADD COLUMN IF NOT EXISTS estimated_total_hours numeric(5,2) default 0,
ADD COLUMN IF NOT EXISTS completed_hours numeric(5,2) default 0,
ADD COLUMN IF NOT EXISTS difficulty text default 'MEDIUM',
ADD COLUMN IF NOT EXISTS deadline_type text default 'HARD', -- 'HARD', 'SOFT'
ADD COLUMN IF NOT EXISTS goal_id uuid references public.goals(id) on delete set null;

-- 6. Upgrade public.tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS goal_id uuid references public.goals(id) on delete set null;

-- 7. Upgrade public.modules table
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS goal_id uuid references public.goals(id) on delete set null;

-- 8. Add Capacity Fields to public.user_schedule_preferences
ALTER TABLE public.user_schedule_preferences
ADD COLUMN IF NOT EXISTS weekday_hours numeric(3,1) default 4.0,
ADD COLUMN IF NOT EXISTS saturday_hours numeric(3,1) default 8.0,
ADD COLUMN IF NOT EXISTS sunday_hours numeric(3,1) default 6.0,
ADD COLUMN IF NOT EXISTS max_weekly_hours numeric(4,1) default 32.0,
ADD COLUMN IF NOT EXISTS preferred_focus_block_minutes integer default 90,
ADD COLUMN IF NOT EXISTS minimum_break_minutes integer default 15,
ADD COLUMN IF NOT EXISTS energy_levels jsonb default '{"morning": "HIGH", "afternoon": "MEDIUM", "evening": "MEDIUM", "night": "LOW"}'::jsonb;

-- 9. Create public.work_sessions table
CREATE TABLE IF NOT EXISTS public.work_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  entity_type text not null, -- 'PROJECT', 'CERTIFICATION', 'ASSIGNMENT', 'EXAM', 'TASK'
  entity_id uuid not null,
  duration_minutes integer not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'COMPLETED', -- 'STARTED', 'PAUSED', 'COMPLETED', 'INTERRUPTED'
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON public.work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_entity ON public.work_sessions(entity_type, entity_id);

-- 10. Trigger function to automatically update completed_hours in targets
CREATE OR REPLACE FUNCTION public.fn_sync_work_session_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_entity_id uuid;
  v_entity_type text;
  v_total_mins integer;
  v_total_hours numeric(5,2);
BEGIN
  -- Determine the entity and type being updated
  IF TG_OP = 'DELETE' THEN
    v_entity_id := OLD.entity_id;
    v_entity_type := OLD.entity_type;
  ELSE
    v_entity_id := NEW.entity_id;
    v_entity_type := NEW.entity_type;
  END IF;

  -- Calculate total minutes completed for this entity
  SELECT COALESCE(SUM(duration_minutes), 0)
  INTO v_total_mins
  FROM public.work_sessions
  WHERE entity_id = v_entity_id AND entity_type = v_entity_type AND status = 'COMPLETED';

  -- Convert to hours (rounded to 2 decimal places)
  v_total_hours := ROUND((v_total_mins::numeric / 60.0), 2);

  -- Update target entities
  IF v_entity_type = 'PROJECT' THEN
    UPDATE public.projects
    SET completed_hours = v_total_hours, updated_at = now()
    WHERE id = v_entity_id;
  ELSIF v_entity_type = 'CERTIFICATION' THEN
    UPDATE public.certifications
    SET completed_hours = v_total_hours, updated_at = now()
    WHERE id = v_entity_id;
  ELSIF v_entity_type = 'ASSIGNMENT' THEN
    UPDATE public.assignments
    SET completed_hours = v_total_hours, updated_at = now()
    WHERE id = v_entity_id;
  ELSIF v_entity_type = 'EXAM' THEN
    UPDATE public.exams
    SET completed_hours = v_total_hours, updated_at = now()
    WHERE id = v_entity_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 11. Attach triggers to work_sessions table
DROP TRIGGER IF EXISTS trg_sync_work_session_hours_ins_upd ON public.work_sessions;
CREATE TRIGGER trg_sync_work_session_hours_ins_upd
AFTER INSERT OR UPDATE OF duration_minutes, entity_id, entity_type, status ON public.work_sessions
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_work_session_hours();

DROP TRIGGER IF EXISTS trg_sync_work_session_hours_del ON public.work_sessions;
CREATE TRIGGER trg_sync_work_session_hours_del
AFTER DELETE ON public.work_sessions
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_work_session_hours();
