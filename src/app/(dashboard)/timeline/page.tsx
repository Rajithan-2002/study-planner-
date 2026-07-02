import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { TimelineView } from '@/components/timeline/TimelineView'

export default async function TimelinePage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  // Fetch unified events using TimelineAggregator
  const { TimelineAggregator } = await import('@/lib/timeline/aggregator')
  const allEvents = await TimelineAggregator.getUnifiedTimeline(userId)

  // Fetch tasks for the user
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })

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
