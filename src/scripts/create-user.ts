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
  const email = 'dev@lifeos.com'
  const password = 'password123'
  
  console.log(`Signing up user ${email}...`)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Akhil Shetty',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80',
      }
    }
  })

  if (error) {
    console.error('Sign up error:', error.message)
    console.log('Trying to log in instead...')
    const { data: logData, error: logError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (logError) {
      console.error('Log in error:', logError.message)
    } else {
      console.log('Login success! User ID:', logData.user?.id)
      console.log('Please copy this User ID to your .env.local file as DEV_USER_ID.')
    }
  } else {
    console.log('Sign up success! User:', data.user)
    console.log('User ID:', data.user?.id)
    console.log('Please copy this User ID to your .env.local file as DEV_USER_ID.')
  }
}

run()
