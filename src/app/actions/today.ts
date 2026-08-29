'use server'

import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { MASTER_MIT_SEMESTER_2_TIMETABLE, getTimetableForDegree } from '@/lib/academic/timetable-data'

export async function getTodayCommandCenterData() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: user } = await supabase.from('users').select('degree_name').eq('id', userId).maybeSingle()
    const masterTimetable = getTimetableForDegree(user?.degree_name)

    const now = new Date()
    const todayStr = now.toLocaleDateString('en-US', { weekday: 'long' })
    const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000))
    const tomorrowStr = tomorrow.toLocaleDateString('en-US', { weekday: 'long' })
    const dateStr = now.toISOString().split('T')[0]
    
    // 48 hours from now for immediate deadlines
    const next48Hours = new Date(now.getTime() + (48 * 60 * 60 * 1000))

    // 1. Fetch Today's & Tomorrow's Classes
    const { data: activeSemesters } = await supabase.from('academic_semesters').select('id').eq('user_id', userId)
    let todaysClasses: any[] = []
    let tomorrowsClasses: any[] = []

    if (activeSemesters && activeSemesters.length > 0) {
      const { data: modules } = await supabase.from('modules').select('id, name, code').in('semester_id', activeSemesters.map(s => s.id)).eq('user_id', userId)
      if (modules && modules.length > 0) {
        const { data: sessionsToday } = await supabase.from('timetable_sessions').select('*').in('module_id', modules.map(m => m.id)).eq('day', todayStr)
        todaysClasses = (sessionsToday || []).map(session => ({
          ...session,
          module: modules.find(m => m.id === session.module_id) || { name: session.code, code: session.code }
        })).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))

        const { data: sessionsTomorrow } = await supabase.from('timetable_sessions').select('*').in('module_id', modules.map(m => m.id)).eq('day', tomorrowStr)
        tomorrowsClasses = (sessionsTomorrow || []).map(session => ({
          ...session,
          module: modules.find(m => m.id === session.module_id) || { name: session.code, code: session.code }
        })).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
      }
    }

    // Fallback to Master Timetable filtered by Degree track if database sessions are empty
    if (todaysClasses.length === 0) {
      todaysClasses = masterTimetable.filter(m => m.day === todayStr).map((item, index) => ({
        id: `master-today-${index}`,
        day: item.day,
        start_time: item.start_time,
        end_time: item.end_time,
        location: item.location,
        session_type: item.session_type,
        lecturer: item.lecturer,
        module: { code: item.code, name: item.name }
      }))
    }

    if (tomorrowsClasses.length === 0) {
      tomorrowsClasses = masterTimetable.filter(m => m.day === tomorrowStr).map((item, index) => ({
        id: `master-tomorrow-${index}`,
        day: item.day,
        start_time: item.start_time,
        end_time: item.end_time,
        location: item.location,
        session_type: item.session_type,
        lecturer: item.lecturer,
        module: { code: item.code, name: item.name }
      }))
    }

    // 2. Fetch Tasks
    const { data: allTasks } = await supabase.from('tasks').select('*').eq('user_id', userId).neq('status', 'COMPLETED')
    
    const tasks = {
      critical: [] as any[],
      important: [] as any[],
      optional: [] as any[]
    }

    ;(allTasks || []).forEach(t => {
      if (!t.due_date) {
        tasks.optional.push(t)
        return
      }
      
      const dueDate = new Date(t.due_date)
      const isOverdue = dueDate < now && dueDate.toDateString() !== now.toDateString()
      const isDueToday = dueDate.toDateString() === now.toDateString()
      
      if (isOverdue || t.priority === 'CRITICAL') {
        tasks.critical.push(t)
      } else if (isDueToday || t.priority === 'HIGH') {
        tasks.important.push(t)
      } else {
        tasks.optional.push(t)
      }
    })

    // 3. Immediate Deadlines (Next 48 Hours)
    const { data: events } = await supabase.from('life_events').select('*').eq('user_id', userId)
    const { data: certs } = await supabase.from('certifications').select('*').eq('user_id', userId)

    const immediateDeadlines: any[] = []

    ;(events || []).forEach(e => {
      const eventDate = new Date(e.event_date)
      if (eventDate >= now && eventDate <= next48Hours) {
        immediateDeadlines.push({ title: e.title, type: e.type, date: e.event_date })
      }
    })

    ;(certs || []).forEach(c => {
      if (c.exam_date) {
        const examDate = new Date(c.exam_date)
        if (examDate >= now && examDate <= next48Hours) {
          immediateDeadlines.push({ title: `${c.name} Exam`, type: 'CERT_EXAM', date: c.exam_date })
        }
      }
    })

    // 4. Time Blocks
    const { data: timeBlocks } = await supabase
      .from('time_blocks')
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_at', `${dateStr}T00:00:00Z`)
      .lte('scheduled_at', `${dateStr}T23:59:59Z`)
      .order('scheduled_at', { ascending: true })

    // 5. Scheduler Preferences
    const { data: preferences } = await supabase
      .from('user_schedule_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    // 6. Conflicts
    const { data: conflicts } = await supabase
      .from('schedule_conflicts')
      .select('*')
      .eq('user_id', userId)

    // Check User Instructions & Active Leave Sprint Mode
    const { getUserInstructions } = await import('@/app/actions/instructions')
    const instructions = await getUserInstructions()

    if (instructions.isLeaveSprintActive) {
      todaysClasses = []
      tomorrowsClasses = []
    }

    // 7. Proposed Plans
    let { data: proposedPlans } = await supabase
      .from('generated_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', dateStr)
      .eq('status', 'PROPOSED')

    // If on leave sprint and no active proposed plan exists, propose automatically
    if (instructions.isLeaveSprintActive && (!proposedPlans || proposedPlans.length === 0)) {
      const { proposeDailyPlan } = await import('@/app/actions/scheduler')
      const propRes = await proposeDailyPlan(dateStr, 'LEAVE_7_DAY', true)
      if (propRes.success && propRes.data) {
        proposedPlans = [propRes.data]
      }
    }

    return {
      todaysClasses,
      tomorrowsClasses,
      tasks,
      immediateDeadlines: immediateDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      timeBlocks: timeBlocks || [],
      preferences: preferences || {
        preferred_focus_time: 'MORNING',
        max_daily_study_hours: 4.0,
        max_daily_project_hours: 3.0,
        buffer_minutes: 10,
        sleep_start_time: '23:00',
        sleep_end_time: '07:00',
        work_start_time: '08:00',
        work_end_time: '18:00'
      },
      conflicts: conflicts || [],
      proposedPlan: proposedPlans && proposedPlans.length > 0 ? proposedPlans[0] : null,
      isLeaveSprintActive: instructions.isLeaveSprintActive,
      instructions
    }
  } catch (err: any) {
    console.error('getTodayCommandCenterData exception:', err)
    return {
      todaysClasses: [],
      tomorrowsClasses: [],
      tasks: { critical: [], important: [], optional: [] },
      immediateDeadlines: [],
      timeBlocks: [],
      preferences: {
        preferred_focus_time: 'MORNING',
        max_daily_study_hours: 4.0,
        max_daily_project_hours: 3.0,
        buffer_minutes: 10,
        sleep_start_time: '23:00',
        sleep_end_time: '07:00',
        work_start_time: '08:00',
        work_end_time: '18:00'
      },
      conflicts: [],
      proposedPlan: null
    }
  }
}
