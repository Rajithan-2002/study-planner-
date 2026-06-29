const fs = require('fs')

let schema = fs.readFileSync('schema.sql', 'utf8')

// 1. Add Drops
const drops = `
drop table if exists public.inbox_items cascade;
drop table if exists public.study_sessions cascade;
drop table if exists public.notes cascade;
`
schema = schema.replace('-- DROP ENUMS', drops + '\n-- DROP ENUMS')

// 2. Add New Tables
const newTables = `
-- NOTES
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null,
  content text,
  domain_id uuid references public.domains on delete set null,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STUDY SESSIONS
create table public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  module_id uuid references public.modules on delete set null,
  project_id uuid references public.projects on delete set null,
  certification_id uuid references public.certifications on delete set null,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  duration_minutes integer not null,
  session_type text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
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
`
schema = schema.replace('-- ==============================================================================\n-- 7. MISC & SOCIAL', newTables + '\n-- ==============================================================================\n-- 7. MISC & SOCIAL')

// 3. Update knowledge_files
const newKf = `create table public.knowledge_files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  domain_id uuid references public.domains on delete set null,
  file_name text not null,
  file_url text not null,
  file_type text,
  entity_type knowledge_entity_type default 'INBOX',
  entity_id uuid,
  tags text[],
  ai_category text,
  summary text,
  source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);`

schema = schema.replace(/create table public\.knowledge_files \([\s\S]*?\);/, newKf)

// 4. Add Triggers
const triggers = `
create trigger set_updated_at before update on public.notes for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.study_sessions for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.inbox_items for each row execute procedure public.set_current_timestamp_updated_at();
`
schema = schema.replace('-- ==============================================================================\n-- 9. PERMISSIONS', triggers + '\n-- ==============================================================================\n-- 9. PERMISSIONS')

// 5. Add RLS Disable
const rls = `
alter table public.notes disable row level security;
alter table public.study_sessions disable row level security;
alter table public.inbox_items disable row level security;
`
schema += rls

// Save to migration_v3.sql
fs.writeFileSync('src/scripts/migration_v3.sql', schema)
console.log('done')
