const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envLocal = fs.readFileSync(path.join(__dirname, '../../.env.local'), 'utf8')
const envVars = {}
envLocal.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
const activeUserId = '92984610-edd1-4c3b-8507-e6865568b3c8' // The active user ID from output

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: semesters } = await supabase.from('academic_semesters').select('*').eq('user_id', activeUserId)
  console.log('ACTIVE USER SEMESTERS:', semesters)
  
  if (semesters && semesters.length > 0) {
    const { data: modules } = await supabase.from('modules').select('*').in('semester_id', semesters.map(s => s.id))
    console.log('ACTIVE USER MODULES:', modules)
    
    if (modules && modules.length > 0) {
      const { data: sessions } = await supabase.from('timetable_sessions').select('*').in('module_id', modules.map(m => m.id))
      console.log('ACTIVE USER TIMETABLE SESSIONS:', sessions)
    }
  }
}
check()
