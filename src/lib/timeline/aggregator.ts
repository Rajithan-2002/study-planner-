import { createClient } from '@/utils/supabase/server'

export class TimelineAggregator {
  static async getUnifiedTimeline(userId: string): Promise<any[]> {
    const supabase = await createClient()

    // 1. Fetch life events
    const { data: lifeEvents } = await supabase
      .from('life_events')
      .select('*')
      .eq('user_id', userId)

    // 2. Fetch activity logs
    const { data: activityLogs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100) // limit to recent actions

    // 3. Fetch reflections
    const { data: reflections } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    // 4. Fetch memories
    const { data: memories } = await supabase
      .from('ai_memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    // 5. Fetch completed work sessions
    const { data: workSessions } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(50)

    // Fetch lookups for activity log titles
    const { data: projLookup } = await supabase.from('projects').select('id, title').eq('user_id', userId)
    const { data: certLookup } = await supabase.from('certifications').select('id, title').eq('user_id', userId)
    const { data: taskLookup } = await supabase.from('tasks').select('id, title').eq('user_id', userId)
    const { data: noteLookup } = await supabase.from('notes').select('id, title').eq('user_id', userId)
    const { data: fileLookup } = await supabase.from('knowledge_files').select('id, file_name').eq('user_id', userId)

    const lookups: Record<string, string> = {}
    projLookup?.forEach(p => { lookups[p.id] = p.title })
    certLookup?.forEach(c => { lookups[c.id] = c.title })
    taskLookup?.forEach(t => { lookups[t.id] = t.title })
    noteLookup?.forEach(n => { lookups[n.id] = n.title })
    fileLookup?.forEach(f => { lookups[f.id] = f.file_name })

    const events: any[] = []

    // Map life events (standard types)
    if (lifeEvents) {
      lifeEvents.forEach(e => {
        events.push({
          id: e.id,
          title: e.title,
          type: e.type,
          event_date: e.event_date ? e.event_date.split('T')[0] : new Date().toISOString().split('T')[0],
          importance: e.importance || 50
        })
      })
    }

    // Map activity logs
    if (activityLogs) {
      activityLogs.forEach(l => {
        const entityName = l.entity_id ? lookups[l.entity_id] : null
        let title = l.action
        let type = 'PROJECT_MILESTONE'

        if (l.action === 'CREATE_PROJECT') {
          title = entityName ? `Started Project: ${entityName}` : 'Started a new Project'
          type = 'PROJECT_MILESTONE'
        } else if (l.action === 'ARCHIVE_PROJECT') {
          title = entityName ? `Archived Project: ${entityName}` : 'Archived a Project'
          type = 'PROJECT_MILESTONE'
        } else if (l.action === 'CREATE_CERTIFICATION') {
          title = entityName ? `Enrolled in Certification: ${entityName}` : 'Enrolled in Certification'
          type = 'CERT_EXAM'
        } else if (l.action === 'CREATE_TASK') {
          title = entityName ? `Added Task: ${entityName}` : 'Added a new Task'
          type = 'ASSIGNMENT'
        } else if (l.action === 'CREATE_NOTE') {
          title = entityName ? `Recorded Note: ${entityName}` : 'Recorded a new Note'
          type = 'ASSIGNMENT'
        } else if (l.action === 'UPLOAD_FILE') {
          title = entityName ? `Uploaded Document: ${entityName}` : 'Uploaded a Document'
          type = 'ASSIGNMENT'
        } else if (l.action === 'LOG_WORK_SESSION') {
          title = `Logged Work Session`
          type = 'PROJECT_MILESTONE'
        } else if (l.action === 'LOG_STUDY_SESSION') {
          title = `Logged Study Session`
          type = 'CERT_EXAM'
        } else if (l.action === 'CREATE_DOMAIN') {
          title = `Created Domain`
          type = 'PROJECT_MILESTONE'
        } else {
          title = `${l.action.replace(/_/g, ' ').toLowerCase()}`
          title = title.charAt(0).toUpperCase() + title.slice(1)
        }

        events.push({
          id: l.id,
          title,
          type,
          event_date: l.created_at ? l.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          importance: 30
        })
      })
    }

    // Map reflections
    if (reflections) {
      reflections.forEach(r => {
        events.push({
          id: r.id,
          title: `Reflected: ${r.content.substring(0, 60)}${r.content.length > 60 ? '...' : ''}`,
          type: 'COMPETITION', // Map to competition style (amber/yellow box)
          event_date: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          importance: 60
        })
      })
    }

    // Map memories
    if (memories) {
      memories.forEach(m => {
        events.push({
          id: m.id,
          title: `Ingested memory: ${m.content.substring(0, 60)}${m.content.length > 60 ? '...' : ''}`,
          type: 'INTERNSHIP_DEADLINE', // blue box
          event_date: m.created_at ? m.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          importance: 50
        })
      })
    }

    // Map completed work sessions
    if (workSessions) {
      workSessions.forEach(w => {
        const entityName = w.entity_id ? lookups[w.entity_id] : null
        const entityStr = entityName ? `for "${entityName}"` : ''
        events.push({
          id: w.id,
          title: `Logged Focus Time: ${w.duration_minutes}m ${entityStr}`,
          type: 'PROJECT_MILESTONE',
          event_date: w.completed_at ? w.completed_at.split('T')[0] : new Date().toISOString().split('T')[0],
          importance: 40
        })
      })
    }

    // Sort chronologically (newest first)
    return events.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
  }
}
