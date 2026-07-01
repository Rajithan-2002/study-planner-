-- ==============================================================================
-- LIFE OS MIGRATION: PLANNING CENTER & CAPACITY ARCHITECTURE (V2)
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create planning_capacity Table
CREATE TABLE IF NOT EXISTS public.planning_capacity (
  user_id uuid references public.users(id) on delete cascade primary key,
  monday_hours numeric(3,1) default 4.0 not null,
  tuesday_hours numeric(3,1) default 4.0 not null,
  wednesday_hours numeric(3,1) default 4.0 not null,
  thursday_hours numeric(3,1) default 4.0 not null,
  friday_hours numeric(3,1) default 4.0 not null,
  saturday_hours numeric(3,1) default 8.0 not null,
  sunday_hours numeric(3,1) default 6.0 not null,
  preferred_focus_block integer default 90 not null, -- minutes
  minimum_break integer default 15 not null, -- minutes
  maximum_weekly_hours numeric(4,1) default 32.0 not null,
  preferred_start_time time default '08:00'::time not null,
  preferred_end_time time default '22:00'::time not null,
  sleep_time time default '23:00'::time not null,
  wake_time time default '07:00'::time not null,
  energy_profile text check (energy_profile in ('MORNING', 'BALANCED', 'NIGHT_OWL')) default 'BALANCED'::text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Update goals table to include priority_multiplier
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS priority_multiplier numeric(3,2) default 1.0 not null;

-- 3. Create recurring_activities Table
CREATE TABLE IF NOT EXISTS public.recurring_activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  type text check (type in ('HABIT', 'ROUTINE', 'CHALLENGE', 'PRACTICE', 'MAINTENANCE')) default 'HABIT'::text not null,
  frequency text check (frequency in ('DAILY', 'WEEKLY', 'MONTHLY')) default 'DAILY'::text not null,
  days_of_week text[], -- e.g. ['MONDAY', 'WEDNESDAY', 'FRIDAY']
  estimated_minutes integer default 30 not null,
  priority text check (priority in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) default 'MEDIUM'::text not null,
  difficulty text check (difficulty in ('EASY', 'MEDIUM', 'HARD')) default 'MEDIUM'::text not null,
  active boolean default true not null,
  preferred_time text check (preferred_time in ('MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME')) default 'ANYTIME'::text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
CREATE INDEX IF NOT EXISTS idx_rec_act_user_id ON public.recurring_activities(user_id);

-- 4. Create recurring_activity_logs Table
CREATE TABLE IF NOT EXISTS public.recurring_activity_logs (
  id uuid default gen_random_uuid() primary key,
  recurring_activity_id uuid references public.recurring_activities(id) on delete cascade not null,
  date date not null,
  duration_minutes integer default 0 not null,
  completed boolean default true not null,
  skipped boolean default false not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rec_act_logs_uniq ON public.recurring_activity_logs(recurring_activity_id, date);

-- 5. Create fixed_commitments Table
CREATE TABLE IF NOT EXISTS public.fixed_commitments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  scheduled_at timestamp with time zone not null,
  duration_minutes integer default 60 not null,
  category text check (category in ('LECTURE', 'OFFICE', 'MEETING', 'TRAVEL', 'FAMILY', 'OTHER')) default 'LECTURE'::text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
CREATE INDEX IF NOT EXISTS idx_fixed_comm_user_id ON public.fixed_commitments(user_id);

-- 6. Create availability_exceptions Table (Vacation Mode)
CREATE TABLE IF NOT EXISTS public.availability_exceptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  capacity_multiplier numeric(3,2) default 0.00 not null, -- 0.00 means full vacation, 0.50 means half capacity
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
CREATE INDEX IF NOT EXISTS idx_avail_except_user_id ON public.availability_exceptions(user_id);

-- 7. Create planning_decisions Table (History Logs)
CREATE TABLE IF NOT EXISTS public.planning_decisions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  event_type text check (event_type in ('REBALANCE', 'DEADLINE_MOVE', 'MANUAL_OVERRIDE')) default 'REBALANCE'::text not null,
  title text not null,
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
CREATE INDEX IF NOT EXISTS idx_plan_dec_user_id ON public.planning_decisions(user_id);
