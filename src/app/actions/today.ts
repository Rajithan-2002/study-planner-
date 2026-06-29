'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'

export async function getTodayCommandCenterData() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const now = new Date()
    
    // 48 hours from now for immediate deadlines
    const next48Hours = new Date(now.getTime() + (48 * 60 * 60 * 1000))

    // 1. Fetch Today's Classes
    const { data: activeSemesters } = await supabase.from('academic_semesters').select('id').eq('user_id', userId)
    let todaysClasses: any[] = []
    if (activeSemesters && activeSemesters.length > 0) {
      const { data: modules } = await supabase.from('modules').select('id, name, code').in('semester_id', activeSemesters.map(s => s.id)).eq('status', 'ONGOING').eq('user_id', userId)
      if (modules && modules.length > 0) {
        const { data: sessions } = await supabase.from('timetable_sessions').select('*').in('module_id', modules.map(m => m.id)).eq('day', todayStr)
        todaysClasses = (sessions || []).map(session => ({
          ...session,
          module: modules.find(m => m.id === session.module_id)
        })).sort((a, b) => a.start_time.localeCompare(b.start_time))
      }
    }

    // 2. Fetch Tasks (Due today, overdue, or upcoming)
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

    // 4. Study Blocks based on upcoming exams (from module workspace planner logic)
    const studyBlocks: any[] = []
    // Filter exams by modules belonging to user
    const { data: userModules } = await supabase.from('modules').select('id, name, code').eq('user_id', userId)
    
    if (userModules && userModules.length > 0) {
      const { data: upcomingExams } = await supabase
        .from('exams')
        .select('*')
        .in('module_id', userModules.map(m => m.id))
        .gte('exam_date', now.toISOString())
        .order('exam_date', { ascending: true })
        .limit(2)
      
      if (upcomingExams && upcomingExams.length > 0) {
        upcomingExams.forEach(exam => {
          const mod = userModules.find(m => m.id === exam.module_id)
          if (mod) {
            const progress = Math.min((exam.weight || 0) * 1.5, 100); 
            const hours = Math.max(1, Math.round((100 - progress) / 20));
            studyBlocks.push({
              moduleId: mod.id,
              moduleName: mod.name,
              moduleCode: mod.code,
              examName: exam.name,
              hours: hours,
              progress: progress
            })
          }
        })
      }
    }

    // 5. Fetch Completed Study Sessions for Today (Defensively)
    let todaySessionsCount = 0
    try {
      const startOfToday = new Date()
      startOfToday.setHours(0,0,0,0)
      const { data: todaySessions, error: err } = await supabase
        .from('study_sessions')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startOfToday.toISOString())
      
      if (!err && todaySessions) {
        todaySessionsCount = todaySessions.length
      }
    } catch (e) {
      console.warn('Could not query study_sessions.', e)
    }

    return {
      todaysClasses,
      tasks,
      immediateDeadlines: immediateDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      studyBlocks,
      todaySessionsCount
    }
  } catch (err: any) {
    console.error('getTodayCommandCenterData exception:', err)
    return {
      todaysClasses: [],
      tasks: { critical: [], important: [], optional: [] },
      immediateDeadlines: [],
      studyBlocks: [],
      todaySessionsCount: 0
    }
  }
}

export async function saveStudySession(moduleId: string | null, durationMinutes: number) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        module_id: moduleId || null,
        duration_minutes: durationMinutes
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting study session:', error.message)
      return { success: false, error: error.message }
    }

    await logActivity('LOG_STUDY_SESSION', 'STUDY_SESSION', data.id)

    return { success: true, data }
  } catch (e: any) {
    console.error('Study session insert exception:', e)
    return { success: false, error: e.message || 'Unknown database error' }
  }
}
