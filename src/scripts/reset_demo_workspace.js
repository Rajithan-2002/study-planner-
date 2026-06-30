const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local
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
const userId = envVars.DEV_USER_ID

if (!supabaseUrl || !supabaseKey || !userId) {
  console.error('Missing configuration variables in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetDemoWorkspace() {
  console.log(`Starting clean workspace seed for Demo User: ${userId}...`)

  try {
    // 1. Wipe old records (strictly scoped to the demo user)
    await Promise.all([
      supabase.from('time_blocks').delete().eq('user_id', userId),
      supabase.from('tasks').delete().eq('user_id', userId),
      supabase.from('work_sessions').delete().eq('user_id', userId),
      supabase.from('projects').delete().eq('user_id', userId),
      supabase.from('certifications').delete().eq('user_id', userId),
      supabase.from('goals').delete().eq('user_id', userId),
      supabase.from('fixed_commitments').delete().eq('user_id', userId),
      supabase.from('recurring_activities').delete().eq('user_id', userId),
      supabase.from('availability_exceptions').delete().eq('user_id', userId),
      supabase.from('planning_decisions').delete().eq('user_id', userId),
      supabase.from('planning_capacity').delete().eq('user_id', userId)
    ])
    console.log('Successfully wiped old demo records.')

    // 2. Seed Capacity preferences
    const { error: capErr } = await supabase.from('planning_capacity').insert({
      user_id: userId,
      monday_hours: 4.0,
      tuesday_hours: 4.0,
      wednesday_hours: 4.0,
      thursday_hours: 4.0,
      friday_hours: 4.0,
      saturday_hours: 8.0,
      sunday_hours: 6.0,
      preferred_focus_block: 90,
      minimum_break: 15,
      maximum_weekly_hours: 32.0,
      preferred_start_time: '08:00:00',
      preferred_end_time: '22:00:00',
      sleep_time: '23:00:00',
      wake_time: '07:00:00',
      energy_profile: 'BALANCED'
    })
    if (capErr) throw capErr
    console.log('Capacity seeded.')

    // 3. Seed Goals
    const { data: goals, error: goalErr } = await supabase.from('goals').insert([
      { user_id: userId, title: 'Become Cloud Security Specialist', description: 'Master Cloud Networking and Security domains', priority_multiplier: 1.5, status: 'ACTIVE' },
      { user_id: userId, title: 'Graduate First Class Honours', description: 'Acquire high grades in all core and optional modules', priority_multiplier: 1.2, status: 'ACTIVE' }
    ]).select()
    if (goalErr) throw goalErr
    console.log('Goals seeded.')

    const cloudGoal = goals.find(g => g.title.includes('Cloud'))
    const cloudGoalId = cloudGoal ? cloudGoal.id : null

    // 4. Seed Certifications (5 active certs)
    const { error: certErr } = await supabase.from('certifications').insert([
      { user_id: userId, name: 'AWS Certified Solutions Architect - Associate', provider: 'AWS', estimated_total_hours: 120, completed_hours: 10, target_exam_date: '2026-09-15', priority: 'HIGH', difficulty: 'MEDIUM', status: 'ACTIVE', goal_id: cloudGoalId, is_archived: false },
      { user_id: userId, name: 'Azure Security Technologies (AZ-500)', provider: 'Microsoft', estimated_total_hours: 140, completed_hours: 0, target_exam_date: '2026-11-20', priority: 'CRITICAL', difficulty: 'HARD', status: 'ACTIVE', goal_id: cloudGoalId, is_archived: false },
      { user_id: userId, name: 'CCNA 200-301 Exam Prep', provider: 'Cisco', estimated_total_hours: 160, completed_hours: 45, target_exam_date: '2026-08-30', priority: 'MEDIUM', difficulty: 'MEDIUM', status: 'ACTIVE', goal_id: cloudGoalId, is_archived: false },
      { user_id: userId, name: 'Certified Kubernetes Administrator (CKA)', provider: 'CNCF', estimated_total_hours: 100, completed_hours: 0, target_exam_date: '2026-12-10', priority: 'MEDIUM', difficulty: 'HARD', status: 'ACTIVE', goal_id: cloudGoalId, is_archived: false },
      { user_id: userId, name: 'Google Cloud Professional Architect', provider: 'Google', estimated_total_hours: 110, completed_hours: 0, target_exam_date: '2027-01-15', priority: 'LOW', difficulty: 'HARD', status: 'ACTIVE', is_archived: false }
    ])
    if (certErr) throw certErr
    console.log('Certifications seeded.')

    // 5. Seed Projects
    const { error: projErr } = await supabase.from('projects').insert([
      { user_id: userId, name: 'Advanced AI Portfolio Website', description: 'Showcase academic, project and certification milestones', estimated_total_hours: 90, completed_hours: 15, target_completion_date: '2026-10-01', priority: 'HIGH', difficulty: 'MEDIUM', status: 'ACTIVE', goal_id: cloudGoalId, is_archived: false }
    ])
    if (projErr) throw projErr
    console.log('Projects seeded.')

    // 6. Seed Recurring Commitments
    const { error: recErr } = await supabase.from('recurring_activities').insert([
      { user_id: userId, title: 'Solve daily Leetcode problem', description: 'Solve 1 Medium problem every morning', type: 'PRACTICE', frequency: 'DAILY', estimated_minutes: 30, priority: 'HIGH', difficulty: 'MEDIUM', preferred_time: 'MORNING' },
      { user_id: userId, title: 'Gym Workout Routine', description: 'Weight lifting and core fitness training', type: 'ROUTINE', frequency: 'WEEKLY', days_of_week: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], estimated_minutes: 90, priority: 'MEDIUM', difficulty: 'MEDIUM', preferred_time: 'EVENING' },
      { user_id: userId, title: 'Daily Reflective Journal', description: 'Reflect on time spent and learning metrics', type: 'HABIT', frequency: 'DAILY', estimated_minutes: 15, priority: 'LOW', difficulty: 'EASY', preferred_time: 'EVENING' }
    ])
    if (recErr) throw recErr
    console.log('Recurring activities seeded.')

    // 7. Seed Fixed Commitments
    const mondayText = new Date()
    // Find next Monday
    mondayText.setDate(mondayText.getDate() + ((1 + 7 - mondayText.getDay()) % 7))
    mondayText.setHours(9, 0, 0, 0)

    const { error: fixErr } = await supabase.from('fixed_commitments').insert([
      { user_id: userId, title: 'University Cloud Security Lecture', description: 'Mandatory core theory class', scheduled_at: mondayText.toISOString(), duration_minutes: 120, category: 'LECTURE' }
    ])
    if (fixErr) throw fixErr
    console.log('Fixed commitments seeded.')

    // 8. Seed Timetable Sessions dynamically matched by code for the active user
    const { data: userModules } = await supabase.from('modules').select('id, code').eq('user_id', userId)
    if (userModules && userModules.length > 0) {
      const sessionSeeds = []
      
      const moduleMap = {}
      userModules.forEach(m => {
        moduleMap[m.code] = m.id
      })

      // Clean old sessions
      await supabase.from('timetable_sessions').delete().in('module_id', userModules.map(m => m.id))

      // Seed sessions
      if (moduleMap['INTE 22343']) {
        sessionSeeds.push({ module_id: moduleMap['INTE 22343'], day: 'Monday', start_time: '08:30:00', end_time: '10:00:00', location: 'CS-201, Room 301', session_type: 'LECTURE' })
      }
      if (moduleMap['INTE 22303']) {
        sessionSeeds.push({ module_id: moduleMap['INTE 22303'], day: 'Monday', start_time: '11:00:00', end_time: '12:30:00', location: 'CS-203, Lab 2', session_type: 'LECTURE' })
      }
      if (moduleMap['INTE 22253']) {
        sessionSeeds.push({ module_id: moduleMap['INTE 22253'], day: 'Tuesday', start_time: '09:00:00', end_time: '10:30:00', location: 'CS-201, Room 301', session_type: 'LECTURE' })
      }
      if (moduleMap['INTE 22283']) {
        sessionSeeds.push({ module_id: moduleMap['INTE 22283'], day: 'Tuesday', start_time: '13:00:00', end_time: '14:30:00', location: 'CS-203, Lab 2', session_type: 'PRACTICAL' })
      }
      if (moduleMap['INTE 22263']) {
        sessionSeeds.push({ module_id: moduleMap['INTE 22263'], day: 'Wednesday', start_time: '08:00:00', end_time: '09:30:00', location: 'Lab 4', session_type: 'LECTURE' })
      }
      if (moduleMap['INTE 22313']) {
        sessionSeeds.push({ module_id: moduleMap['INTE 22313'], day: 'Wednesday', start_time: '10:30:00', end_time: '12:00:00', location: 'Room 303', session_type: 'LECTURE' })
      }
      if (moduleMap['INTE 22293']) {
        sessionSeeds.push({ module_id: moduleMap['INTE 22293'], day: 'Thursday', start_time: '09:00:00', end_time: '10:30:00', location: 'CS-201', session_type: 'LECTURE' })
      }

      if (sessionSeeds.length > 0) {
        const { error: sessionErr } = await supabase.from('timetable_sessions').insert(sessionSeeds)
        if (sessionErr) throw sessionErr
        console.log('Timetable sessions seeded dynamically.')
      }
    }

    console.log('Demo workspace reset completed successfully! 🎉')
  } catch (err) {
    console.error('Failed to reset/seed demo workspace:', err)
  }
}

resetDemoWorkspace()
