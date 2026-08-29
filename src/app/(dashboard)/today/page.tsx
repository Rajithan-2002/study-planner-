import { getTodayCommandCenterData } from '@/app/actions/today'
import { SchedulerHubView } from '@/components/scheduler/SchedulerHubView'
import { createClient, getCurrentUserId } from '@/utils/supabase/server'

export default async function TodayPage() {
  const data = await getTodayCommandCenterData()
  
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', userId)
    .eq('is_archived', false)

  const { data: certifications } = await supabase
    .from('certifications')
    .select('id, name')
    .eq('user_id', userId)
    .neq('status', 'COMPLETED')

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Command Center
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Intelligent Daily Workload Hub, Strategy Controls, and Task Management.
          </p>
        </div>
      </div>

      {/* UNIFIED 2-COLUMN ENTERPRISE DASHBOARD HUB */}
      <SchedulerHubView
        todaysClasses={data.todaysClasses}
        tomorrowsClasses={data.tomorrowsClasses}
        tasks={data.tasks}
        immediateDeadlines={data.immediateDeadlines}
        timeBlocks={data.timeBlocks}
        preferences={data.preferences}
        conflicts={data.conflicts}
        proposedPlan={data.proposedPlan}
        projects={projects || []}
        certifications={certifications || []}
      />
    </div>
  )
}
