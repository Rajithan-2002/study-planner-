import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const userId = '07cd10d1-2f75-448e-ab8b-3aebbafe2064'
  
  console.log(`Inserting user ${userId} into public.users...`)
  
  const { data, error } = await supabase.from('users').insert({
    id: userId,
    email: 'dev@lifeos.com',
    full_name: 'Akhil Shetty',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80',
    university: 'State University',
    degree_name: 'Computer Science & Engineering',
    graduation_year: 2028,
    career_goal: 'Software Architect / AI Specialist',
    current_gpa: 8.24,
    target_gpa: 9.90,
    current_year: 2,
    current_semester: 2
  }).select()

  if (error) {
    console.error('Insert error:', error)
  } else {
    console.log('User inserted successfully:', data)
  }
}

run()
