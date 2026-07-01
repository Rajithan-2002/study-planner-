import { z } from 'zod'
import { tool } from 'ai'
import { createClient, getCurrentUserId } from '@/utils/supabase/server'

async function logToolUsage(toolName: string, input: any, output: any, success: boolean = true, error: string | null = null, durationMs: number = 0) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    await supabase.from('ai_tool_logs').insert({
      user_id: userId,
      tool_name: toolName,
      input: { arguments: input },
      output: { response: output, success, error, duration_ms: durationMs }
    })
  } catch (e) {
    console.error('Failed to log tool usage:', e)
  }
}

export const get_today_focus = tool({
  description: 'Aggregates today\'s timetable, upcoming deadlines, high priority projects, pending certifications, competitions within 7 days, and tasks due today. This is the most important operational tool to answer "what should I do today".',
  parameters: z.object({}),
  execute: async () => {
    const startTime = Date.now()
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const now = new Date()

    let todaysClasses: any[] = []
    let tasks: any[] = []
    let projects: any[] = []
    let certs: any[] = []
    let events: any[] = []
    let assignments: any[] = []
    let exams: any[] = []
    let success = true
    let errorMsg: string | null = null

    try {
      // 1. Timetable classes
      const { data: semesters } = await supabase.from('academic_semesters').select('id').eq('user_id', userId)
      if (semesters && semesters.length > 0) {
        const { data: modules } = await supabase.from('modules').select('id, name, code').in('semester_id', semesters.map(s => s.id)).eq('status', 'ONGOING')
        if (modules && modules.length > 0) {
          const { data: sessions } = await supabase.from('timetable_sessions').select('start_time, end_time, location, session_type, module_id').in('module_id', modules.map(m => m.id)).eq('day', todayStr)
          todaysClasses = (sessions || []).map(s => ({
            ...s,
            module: modules.find(m => m.id === s.module_id)
          }))
        }
      }

      // 2. Pending Tasks
      const { data: tData } = await supabase.from('tasks').select('title, priority, due_date, status').eq('user_id', userId).neq('status', 'COMPLETED')
      tasks = tData || []

      // 3. Projects
      const { data: pData } = await supabase.from('projects').select('name, status, priority').eq('user_id', userId).neq('status', 'COMPLETED')
      projects = pData || []

      // 4. Certifications
      const { data: cData } = await supabase.from('certifications').select('name, provider, target_date, exam_date, status').eq('user_id', userId).eq('status', 'ACTIVE')
      certs = cData || []

      // 5. Life Events (Next 7 days)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const { data: eData } = await supabase.from('life_events')
        .select('title, type, event_date, importance')
        .eq('user_id', userId)
        .gte('event_date', now.toISOString())
        .lte('event_date', nextWeek.toISOString())
      events = eData || []

      // 6. Assignments
      if (semesters && semesters.length > 0) {
        const { data: activeModules } = await supabase.from('modules').select('id').in('semester_id', semesters.map(s => s.id))
        if (activeModules && activeModules.length > 0) {
          const { data: ass } = await supabase.from('assignments').select('name, deadline, status, weight').in('module_id', activeModules.map(m => m.id)).eq('status', 'PENDING')
          assignments = ass || []
        }
      }

      // 7. Exams
      if (semesters && semesters.length > 0) {
        const { data: activeModules } = await supabase.from('modules').select('id').in('semester_id', semesters.map(s => s.id))
        if (activeModules && activeModules.length > 0) {
          const { data: ex } = await supabase.from('exams').select('name, exam_date, status, weight').in('module_id', activeModules.map(m => m.id)).eq('status', 'PENDING')
          exams = ex || []
        }
      }
    } catch (err: any) {
      success = false
      errorMsg = err.message
      console.error('Error running get_today_focus tool:', err)
    }

    const output = {
      todays_classes: todaysClasses,
      pending_tasks: tasks,
      active_projects: projects,
      active_certifications: certs,
      upcoming_life_events: events,
      pending_assignments: assignments,
      upcoming_exams: exams
    }

    const duration = Date.now() - startTime
    await logToolUsage('get_today_focus', {}, output, success, errorMsg, duration)
    return output
  }
} as any)

export const get_projects = tool({
  description: 'Read active projects and their priorities.',
  parameters: z.object({
    status: z.enum(['IDEA', 'RESEARCHING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
  }),
  execute: async ({ status, priority }: any) => {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    let query = supabase.from('projects').select('name, status, priority, description').eq('user_id', userId || '')
    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)

    const { data } = await query
    await logToolUsage('get_projects', { status, priority }, data)
    return data
  }
} as any)

export const get_domains = tool({
  description: 'Retrieve domains and their associated projects/certifications.',
  parameters: z.object({}),
  execute: async () => {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data } = await supabase.from('domains').select('id, name').eq('user_id', userId || '')
    await logToolUsage('get_domains', {}, data)
    return data
  }
} as any)

export const get_certifications = tool({
  description: 'Read certification pipeline and status.',
  parameters: z.object({
    status: z.enum(['IDEA', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional()
  }),
  execute: async ({ status }: any) => {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    let query = supabase.from('certifications').select('name, provider, target_date, exam_date, status, priority').eq('user_id', userId || '')
    if (status) query = query.eq('status', status)

    const { data } = await query
    await logToolUsage('get_certifications', { status }, data)
    return data
  }
} as any)

export const get_upcoming_deadlines = tool({
  description: 'Read upcoming life events, exams, milestones, and deadlines.',
  parameters: z.object({
    days: z.number().optional().default(30)
  }),
  execute: async ({ days }: any) => {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const { data } = await supabase.from('life_events')
      .select('title, type, event_date, importance')
      .eq('user_id', userId || '')
      .gte('event_date', new Date().toISOString())
      .lte('event_date', futureDate.toISOString())
      .order('event_date', { ascending: true })

    await logToolUsage('get_upcoming_deadlines', { days }, data)
    return data
  }
} as any)

export const get_academic_status = tool({
  description: 'Query current modules, pending assignments, and upcoming exams.',
  parameters: z.object({}),
  execute: async () => {
    const startTime = Date.now()
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    let semesters: any[] = []
    let modules: any[] = []
    let assignments: any[] = []
    let exams: any[] = []
    let results: any[] = []
    let success = true
    let errorMsg: string | null = null

    try {
      const { data: semData } = await supabase.from('academic_semesters').select('id, year, semester').eq('user_id', userId)
      semesters = semData || []
      const semesterIds = semesters.map(s => s.id)

      if (semesterIds.length > 0) {
        const { data: mods } = await supabase.from('modules').select('id, code, name, status, grade, credits').in('semester_id', semesterIds)
        modules = mods || []

        const moduleIds = modules.map(m => m.id)
        if (moduleIds.length > 0) {
          const { data: ass } = await supabase.from('assignments').select('*').in('module_id', moduleIds)
          const { data: exs } = await supabase.from('exams').select('*').in('module_id', moduleIds)
          const { data: res } = await supabase.from('module_results').select('*').in('module_id', moduleIds)

          assignments = ass || []
          exams = exs || []
          results = res || []
        }
      }
    } catch (err: any) {
      success = false
      errorMsg = err.message
      console.error('Error running get_academic_status tool:', err)
    }

    const output = {
      semesters,
      modules,
      assignments,
      exams,
      module_results: results
    }

    const duration = Date.now() - startTime
    await logToolUsage('get_academic_status', {}, output, success, errorMsg, duration)
    return output
  }
} as any)

export const search_knowledge = tool({
  description: 'Keyword search against knowledge files (PDFs, notes).',
  parameters: z.object({
    keyword: z.string()
  }),
  execute: async ({ keyword }: any) => {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: files } = await supabase.from('knowledge_files')
      .select('id, file_name, file_type, entity_type')
      .eq('user_id', userId || '')
      .ilike('file_name', `%${keyword}%`)

    const { data: notes } = await supabase.from('notes')
      .select('id, title, content')
      .eq('user_id', userId || '')
      .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)

    const data = [
      ...(files || []).map(f => ({ id: f.id, name: f.file_name, type: 'FILE', file_type: f.file_type, category: f.entity_type })),
      ...(notes || []).map(n => ({ id: n.id, name: n.title, type: 'NOTE', content: n.content }))
    ]

    await logToolUsage('search_knowledge', { keyword }, data)
    return data
  }
} as any)

export const generate_weekly_review = tool({
  description: 'Summarize tasks completed, projects updated, deadlines approaching, and certification progress for the past 7 days.',
  parameters: z.object({}),
  execute: async () => {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    // 1. Projects updated
    const { data: projectsUpdated } = await supabase.from('projects')
      .select('name, status, priority')
      .eq('user_id', userId || '')
      .gte('updated_at', lastWeek.toISOString())

    // 2. Certifications updated
    const { data: certsUpdated } = await supabase.from('certifications')
      .select('name, status, priority')
      .eq('user_id', userId || '')
      .gte('updated_at', lastWeek.toISOString())

    // 3. Completed Tasks in the last 7 days
    const { data: completedTasks } = await supabase.from('tasks')
      .select('title, priority, updated_at')
      .eq('user_id', userId || '')
      .eq('status', 'COMPLETED')
      .gte('updated_at', lastWeek.toISOString())

    const output = { 
      projectsUpdated: projectsUpdated || [], 
      certsUpdated: certsUpdated || [],
      completedTasksCount: completedTasks?.length || 0,
      completedTasks: completedTasks || []
    }
    
    await logToolUsage('generate_weekly_review', {}, output)
    return output
  }
} as any)

export const recommend_next_action = tool({
  description: 'Strategic planner: evaluate deadlines, priorities, and workload to recommend what the user should focus on this week.',
  parameters: z.object({}),
  execute: async () => {
    // In a full implementation, we fetch all open tasks, exams, and high priority projects, then score them.
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: events } = await supabase.from('life_events').select('title, type, event_date, importance').eq('user_id', userId || '').gte('event_date', new Date().toISOString()).limit(5)
    const { data: projects } = await supabase.from('projects').select('name, priority').eq('user_id', userId || '').in('priority', ['HIGH', 'CRITICAL']).limit(5)

    const output = { strategic_recommendations: 'Based on upcoming events and high priority projects.', events, projects }
    await logToolUsage('recommend_next_action', {}, output)
    return output
  }
} as any)

export const process_inbox_item = tool({
  description: 'Analyze an uploaded knowledge hub item (competition poster, cert screenshot) and propose actions (e.g. create project idea).',
  parameters: z.object({
    file_name: z.string(),
    file_content_summary: z.string().describe('Extracted text or summary of the file')
  }),
  execute: async ({ file_name, file_content_summary }: any) => {
    // Simulated processing
    const output = { 
      status: 'Processed', 
      detected_type: file_name.includes('cert') ? 'Certification' : 'Resource',
      suggested_actions: ['Add to Knowledge Hub', 'Create Life Event Reminder'] 
    }
    await logToolUsage('process_inbox_item', { file_name, file_content_summary }, output)
    return output
  }
} as any)

// DANGEROUS WRITE TOOLS

export const create_task = tool({
  description: 'Proposes creating a new task. Returns a proposal card the user can confirm with one click. Do NOT execute DB writes yourself — just call this tool with the task details.',
  parameters: z.object({
    title: z.string().describe('Title of the task'),
    description: z.string().nullable().optional().describe('Optional detailed description'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).nullable().optional().describe('Priority level'),
    due_date: z.string().nullable().optional().describe('ISO date string YYYY-MM-DD')
  }),
  execute: async ({ title, description, priority, due_date }: any) => {
    // Return a proposal — the UI ActionCard will perform the actual insert when the user clicks "Add to Life OS"
    await logToolUsage('create_task', { title, description, priority, due_date }, { proposed: true })
    return { proposed: true, title, description: description || null, priority: priority || 'MEDIUM', due_date: due_date || null }
  }
} as any)

export const create_life_event = tool({
  description: 'Proposes creating a new life event. Returns a proposal card the user can confirm with one click.',
  parameters: z.object({
    title: z.string().describe('Title of the event'),
    type: z.enum(['EXAM', 'ASSIGNMENT', 'CERT_EXAM', 'PROJECT_MILESTONE', 'COMPETITION', 'INTERNSHIP_DEADLINE']).describe('Type of life event'),
    event_date: z.string().describe('ISO date string YYYY-MM-DD'),
    importance: z.number().nullable().optional().describe('0-100 scale importance')
  }),
  execute: async ({ title, type, event_date, importance }: any) => {
    // Return a proposal — the UI ActionCard will perform the actual insert when the user clicks "Add to Life OS"
    await logToolUsage('create_life_event', { title, type, event_date, importance }, { proposed: true })
    return { proposed: true, title, type, event_date, importance: importance || 50 }
  }
} as any)

export const add_timetable_schedule = tool({
  description: 'Proposes importing structured class schedule sessions into the users timetable and dashboards. You MUST ask for user confirmation first.',
  parameters: z.object({
    sessions: z.array(z.object({
      module_name: z.string().describe('Name of the course/module'),
      module_code: z.string().nullable().optional().describe('Course code e.g. INTE 22303'),
      day: z.string().describe('Day of week e.g. Monday, Tuesday'),
      start_time: z.string().describe('24h time string HH:MM:SS e.g. 09:00:00'),
      end_time: z.string().describe('24h time string HH:MM:SS e.g. 11:00:00'),
      location: z.string().nullable().optional().describe('Room or lab location'),
      session_type: z.string().nullable().optional().describe('LECTURE or PRACTICAL')
    })).describe('Array of class sessions extracted from timetable')
  }),
  execute: async ({ sessions }: any) => {
    try {
      const { importTimetableSchedule } = await import('@/app/actions/academic')
      const res = await importTimetableSchedule(sessions)
      await logToolUsage('add_timetable_schedule', { count: sessions?.length }, { success: res.success })
      return res
    } catch (e: any) {
      console.error('add_timetable_schedule tool execution failed:', e)
      await logToolUsage('add_timetable_schedule', { count: sessions?.length }, { success: false, error: e.message })
      return { success: false, error: e.message }
    }
  }
} as any)

export const get_notes = tool({
  description: 'Retrieves all active notes and snippets recorded in the user\'s second brain repository. Use this to answer queries about what notes the user has created.',
  parameters: z.object({}),
  execute: async () => {
    const startTime = Date.now()
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    let success = true
    let errorMsg: string | null = null
    let output: any[] = []

    try {
      const { data, error } = await supabase.from('notes')
        .select('id, title, content, tags, created_at, domain_id, is_archived')
        .eq('user_id', userId || '')
        .order('created_at', { ascending: false })

      if (error) throw error
      output = (data || []).filter(n => !n.is_archived && !(n.tags && n.tags.includes('archived')))
    } catch (err: any) {
      success = false
      errorMsg = err.message
      console.error('Error running get_notes tool:', err)
    }

    const duration = Date.now() - startTime
    await logToolUsage('get_notes', {}, output, success, errorMsg, duration)
    return output
  }
} as any)

