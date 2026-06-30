import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const userId = '07cd10d1-2f75-448e-ab8b-3aebbafe2064'

async function run() {
  console.log('Seeding student data...')

  // 1. Create Domains
  const domainsToCreate = [
    { user_id: userId, name: 'Cloud Security' },
    { user_id: userId, name: 'Software Engineering' },
    { user_id: userId, name: 'Artificial Intelligence' },
    { user_id: userId, name: 'Academics' }
  ]
  const { data: domains, error: domErr } = await supabase.from('domains').insert(domainsToCreate).select()
  if (domErr) console.error('Error seeding domains:', domErr)
  console.log('Domains seeded:', domains?.length)

  const cloudDomain = domains?.find(d => d.name === 'Cloud Security')?.id
  const seDomain = domains?.find(d => d.name === 'Software Engineering')?.id
  const aiDomain = domains?.find(d => d.name === 'Artificial Intelligence')?.id
  const acadDomain = domains?.find(d => d.name === 'Academics')?.id

  // 2. Create Semesters
  const semestersToCreate = [
    { user_id: userId, year: 1, semester: 1 },
    { user_id: userId, year: 1, semester: 2 },
    { user_id: userId, year: 2, semester: 1 },
    { user_id: userId, year: 2, semester: 2 }
  ]
  const { data: semesters, error: semErr } = await supabase.from('academic_semesters').insert(semestersToCreate).select()
  if (semErr) console.error('Error seeding semesters:', semErr)
  console.log('Semesters seeded:', semesters?.length)

  const semY1S1 = semesters?.find(s => s.year === 1 && s.semester === 1)?.id
  const semY1S2 = semesters?.find(s => s.year === 1 && s.semester === 2)?.id
  const semY2S1 = semesters?.find(s => s.year === 2 && s.semester === 1)?.id
  const semY2S2 = semesters?.find(s => s.year === 2 && s.semester === 2)?.id

  // Get Curriculum Modules to link
  const { data: currModules } = await supabase.from('curriculum_modules').select('*')
  console.log('Found curriculum modules:', currModules?.length)

  // 3. Create Student Modules
  const modulesToCreate: any[] = []
  if (currModules) {
    for (const cm of currModules) {
      let semId = null
      let status = 'NOT_STARTED'
      let grade = null
      
      if (cm.year === 1 && cm.semester === 1) {
        semId = semY1S1
        status = 'COMPLETED'
        grade = 'A'
      } else if (cm.year === 1 && cm.semester === 2) {
        semId = semY1S2
        status = 'COMPLETED'
        grade = 'B+'
      } else if (cm.year === 2 && cm.semester === 1) {
        semId = semY2S1
        status = 'COMPLETED'
        grade = 'A-'
      } else if (cm.year === 2 && cm.semester === 2) {
        semId = semY2S2
        // Make AI and Data Structures and Web Apps ongoing / results pending
        if (cm.course_code === 'INTE 22303') {
          status = 'ONGOING'
        } else if (cm.course_code === 'INTE 22343') {
          status = 'ONGOING'
        } else if (cm.course_code === 'INTE 22253') {
          status = 'ONGOING'
        } else {
          status = 'ONGOING'
        }
      } else {
        // Years 3 & 4 are not yet selected/completed, so skip or leave empty
        continue
      }

      modulesToCreate.push({
        user_id: userId,
        curriculum_module_id: cm.id,
        semester_id: semId,
        code: cm.course_code,
        name: cm.course_name,
        credits: cm.credits,
        status,
        grade,
        is_selected: true
      })
    }
  }

  const { data: studentMods, error: smErr } = await supabase.from('modules').insert(modulesToCreate).select()
  if (smErr) console.error('Error seeding student modules:', smErr)
  console.log('Student modules seeded:', studentMods?.length)

  const modAI = studentMods?.find(m => m.code === 'INTE 22303')?.id
  const modDSA = studentMods?.find(m => m.code === 'INTE 22343')?.id

  // 4. Create Timetable Sessions
  const sessionsToCreate = [
    { module_id: modAI, day: 'Monday', start_time: '08:00:00', end_time: '09:30:00', location: 'CS-201, Room 301', session_type: 'LECTURE' },
    { module_id: modDSA, day: 'Monday', start_time: '13:00:00', end_time: '14:30:00', location: 'CS-203, Lab 2', session_type: 'PRACTICAL' },
    { module_id: modAI, day: 'Tuesday', start_time: '09:00:00', end_time: '10:30:00', location: 'CS-201, Room 301', session_type: 'LECTURE' },
    { module_id: modDSA, day: 'Tuesday', start_time: '11:00:00', end_time: '12:30:00', location: 'CS-203, Lab 2', session_type: 'LECTURE' }
  ]
  const { data: sessions, error: sessErr } = await supabase.from('timetable_sessions').insert(sessionsToCreate).select()
  if (sessErr) console.error('Error seeding sessions:', sessErr)
  console.log('Sessions seeded:', sessions?.length)

  // 5. Create Projects
  const projectsToCreate = [
    { user_id: userId, domain_id: cloudDomain, name: 'Cloud Security Audit Tool', description: 'Automated compliance audits for multi-cloud configurations', status: 'ACTIVE', priority: 'HIGH' },
    { user_id: userId, domain_id: seDomain, name: 'Portfolio Website', description: 'Premium developer portfolio using Next.js & Tailwind', status: 'ACTIVE', priority: 'MEDIUM' }
  ]
  const { data: projects, error: projErr } = await supabase.from('projects').insert(projectsToCreate).select()
  if (projErr) console.error('Error seeding projects:', projErr)
  console.log('Projects seeded:', projects?.length)

  const cloudProjId = projects?.find(p => p.name.includes('Cloud'))?.id

  // 6. Create Certifications
  const certsToCreate = [
    { user_id: userId, domain_id: cloudDomain, name: 'AZ-500: Microsoft Azure Security Technologies', provider: 'Microsoft', cost: 165.00, target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), exam_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), status: 'ACTIVE', priority: 'MEDIUM' }
  ]
  const { data: certs, error: certErr } = await supabase.from('certifications').insert(certsToCreate).select()
  if (certErr) console.error('Error seeding certifications:', certErr)
  console.log('Certifications seeded:', certs?.length)

  // 7. Create Tasks
  const tasksToCreate = [
    { user_id: userId, domain_id: acadDomain, title: 'Finish AI Assignment 2', description: 'Implement Q-learning and SARSA algorithm', status: 'PENDING', priority: 'HIGH', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), related_entity_type: 'MODULE', related_entity_id: modAI },
    { user_id: userId, domain_id: cloudDomain, title: 'Study AZ-500 Module 3', description: 'Review network security group rules and Azure Bastion configuration', status: 'PENDING', priority: 'MEDIUM', due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), related_entity_type: 'CERTIFICATION', related_entity_id: certs?.[0]?.id },
    { user_id: userId, domain_id: cloudDomain, title: 'Update Cloud Project Documentation', description: 'Write architecture diagram explanation', status: 'PENDING', priority: 'HIGH', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), related_entity_type: 'PROJECT', related_entity_id: cloudProjId }
  ]
  const { data: tasks, error: taskErr } = await supabase.from('tasks').insert(tasksToCreate).select()
  if (taskErr) console.error('Error seeding tasks:', taskErr)
  console.log('Tasks seeded:', tasks?.length)

  // 8. Create Life Events
  const eventsToCreate = [
    { user_id: userId, title: 'AI Assignment 2 Due', type: 'ASSIGNMENT', event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), importance: 80, related_entity_id: modAI },
    { user_id: userId, title: 'AZ-500 Exam', type: 'CERT_EXAM', event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), importance: 90, related_entity_id: certs?.[0]?.id },
    { user_id: userId, title: 'Cloud Project Milestone', type: 'PROJECT_MILESTONE', event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), importance: 70, related_entity_id: cloudProjId },
    { user_id: userId, title: 'AI Midterm Exam', type: 'EXAM', event_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), importance: 90, related_entity_id: modAI },
    { user_id: userId, title: 'Hackathon 2025 Submission', type: 'COMPETITION', event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), importance: 85 }
  ]
  const { data: events, error: eventErr } = await supabase.from('life_events').insert(eventsToCreate).select()
  if (eventErr) console.error('Error seeding events:', eventErr)
  console.log('Life events seeded:', events?.length)

  console.log('Seed completed successfully!')
}

run()
