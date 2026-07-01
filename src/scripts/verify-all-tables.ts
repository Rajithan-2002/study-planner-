import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const tablesToVerify = [
  'users',
  'domains',
  'skills',
  'tasks',
  'activity_logs',
  'ai_tool_logs',
  'curriculum_modules',
  'academic_semesters',
  'modules',
  'module_results',
  'timetable_sessions',
  'assignments',
  'exams',
  'projects',
  'certifications',
  'competitions',
  'knowledge_files',
  'life_events',
  'notes',
  'inbox_items'
]

async function run() {
  console.log('--- VERIFYING ALL SUPABASE TABLES ---')
  const results: Record<string, string> = {}
  
  for (const tableName of tablesToVerify) {
    try {
      const { error } = await supabase.from(tableName).select('id').limit(1)
      if (error) {
        // If error code is 42P01 (relation does not exist) or similar
        if (error.code === '42P01') {
          results[tableName] = '❌ MISSING'
        } else {
          results[tableName] = `✅ EXISTS (Notice: ${error.message})`
        }
      } else {
        results[tableName] = '✅ EXISTS & READY'
      }
    } catch (e: any) {
      results[tableName] = `❌ ERROR: ${e.message}`
    }
  }

  console.table(results)
}

run()
