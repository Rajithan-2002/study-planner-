import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { TimelineView } from '@/components/timeline/TimelineView'

export default async function TimelinePage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  // Fetch life events for the user
  const { data: events } = await supabase
    .from('life_events')
    .select('*')
    .eq('user_id', userId)
    .order('event_date', { ascending: true })

  // Fetch tasks for the user
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })

  // Fetch activity logs for the user
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)

  // Fetch lookups to resolve human-readable entity titles
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

  const logEvents = (logs || []).map(l => {
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

    return {
      id: l.id,
      title,
      type,
      event_date: l.created_at.split('T')[0],
      importance: 30
    }
  })

  // Combine life_events and mapped activity log events
  const allEvents = [...(events || []), ...logEvents].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
          Timeline Engine
        </h2>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Your central schedule for all upcoming deadlines, certification exams, academic milestones, and submissions.
        </p>
      </div>

      {/* TIMELINE CLIENT VIEWER */}
      <TimelineView initialEvents={allEvents} initialTasks={tasks || []} />

    </div>
  )
}
