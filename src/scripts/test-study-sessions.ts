import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('study_sessions').select('*').limit(1)
  if (error) {
    console.error('Study Sessions table error:', error.message)
    console.log('Please execute the create_study_sessions.sql script in your Supabase SQL Editor!')
  } else {
    console.log('Study Sessions table exists and is accessible!', data)
  }
}

test()
