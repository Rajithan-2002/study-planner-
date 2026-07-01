import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedTestUser() {
  console.log('Seeding Test User...')
  
  const emails = ['test.user@gmail.com', 'test@gmail.com', 'student@gmail.com']
  const password = 'test@gmail.com'
  let userId = null
  let activeEmail = ''

  for (const email of emails) {
    console.log(`Trying email: ${email}...`)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authData?.user?.id) {
      userId = authData.user.id
      activeEmail = email
      break
    }

    const { data: loginData } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (loginData?.user?.id) {
      userId = loginData.user.id
      activeEmail = email
      break
    }
  }

  if (!userId) {
    console.error('Could not auto-create auth user via public anon key.')
    return
  }

  console.log(`Authenticated User (${activeEmail}) ID:`, userId)

  // Upsert Public User Profile
  const { error: profileErr } = await supabase.from('users').upsert({
    id: userId,
    full_name: 'Test Student',
    email: activeEmail,
    degree_name: 'Computer Science (BSc)',
    university: 'State University',
    graduation_year: 2028,
    current_gpa: 3.5
  })

  if (profileErr) console.error('Error updating public user profile:', profileErr)

  // Ensure Academic Semesters exist
  const defaultSems = [
    { user_id: userId, year: 1, semester: 1 },
    { user_id: userId, year: 1, semester: 2 },
    { user_id: userId, year: 2, semester: 1 },
    { user_id: userId, year: 2, semester: 2 },
  ]
  await supabase.from('academic_semesters').upsert(defaultSems)

  console.log(`✅ Test User ${activeEmail} successfully seeded!`)
}

seedTestUser()
