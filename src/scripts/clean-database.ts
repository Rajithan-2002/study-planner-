import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const tables = [
  'document_chunks',
  'competition_files',
  'knowledge_files',
  'competitions',
  'certification_resources',
  'certifications',
  'projects',
  'exams',
  'assignments',
  'timetable_sessions',
  'module_results',
  'modules',
  'academic_semesters',
  'curriculum_modules',
  'life_events',
  'device_tokens',
  'notifications',
  'discussion_messages',
  'discussion_threads',
  'ai_tool_logs',
  'activity_logs',
  'tasks',
  'skills',
  'domains',
  'notes',
  'study_sessions',
  'inbox_items',
  'users'
]

async function clean() {
  console.log('Starting database purge...')
  const devUserId = process.env.DEV_USER_ID
  
  for (const table of tables) {
    if (table === 'users') {
      console.log('Resetting dev user profile fields...')
      const { error: updateErr } = await supabase
        .from('users')
        .update({
          full_name: 'New Student',
          university: null,
          degree_name: null,
          graduation_year: null,
          career_goal: null,
          current_gpa: null,
          target_gpa: null,
          current_year: null,
          current_semester: null
        })
        .eq('id', devUserId || '')
      
      if (updateErr) {
        console.error('Failed to reset dev user profile:', updateErr.message)
      }

      console.log('Clearing other user profiles...')
      const { error: deleteErr } = await supabase
        .from('users')
        .delete()
        .neq('id', devUserId || '00000000-0000-0000-0000-000000000000')
      
      if (deleteErr) {
        console.error('Failed to clear other users:', deleteErr.message)
      }
      continue
    }

    console.log(`Clearing table: ${table}...`)
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Deletes all rows for uuid keys
    
    if (error) {
      // If it fails because of ID type or other issue, try clearing with a different filter
      const { error: error2 } = await supabase
        .from(table)
        .delete()
        .or('id.neq.00000000-0000-0000-0000-000000000000,id.is.null')
      
      if (error2) {
        console.error(`Failed to clear table ${table}:`, error.message, error2.message)
      }
    }
  }

  console.log('Database clean complete!')
}

clean()
