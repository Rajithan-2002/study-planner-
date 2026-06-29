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
  const { data: users, error: usersErr } = await supabase.from('users').select('*')
  console.log('Public Users:', users)
  if (usersErr) console.error('Users error:', usersErr)

  const { data: CM, error: cmErr } = await supabase.from('curriculum_modules').select('count')
  console.log('Curriculum count:', CM)
}

run()
