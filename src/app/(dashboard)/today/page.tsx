import { Clock, Target, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getTodayCommandCenterData } from '@/app/actions/today'
import { TaskCheckbox } from '@/components/ui/TaskCheckbox'
import { SchedulerHubView } from '@/components/scheduler/SchedulerHubView'
import { createClient, getCurrentUserId } from '@/utils/supabase/server'

export default async function TodayPage() {
  const data = await getTodayCommandCenterData()
  
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  // Fetch active projects & certifications for stopwatch
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Command Center
          </h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Intelligent Daily Planner, Focus Work blocks, and Rescheduling Queue.
          </p>
        </div>
      </div>

      {/* SCHEDULER WIDGET HUB */}
      <SchedulerHubView
        todaysClasses={data.todaysClasses}
        tasks={data.tasks}
        immediateDeadlines={data.immediateDeadlines}
        timeBlocks={data.timeBlocks}
        preferences={data.preferences}
        conflicts={data.conflicts}
        proposedPlan={data.proposedPlan}
        projects={projects || []}
        certifications={certifications || []}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: University Classes & Deadlines */}
        <div className="col-span-1 space-y-6 md:space-y-8">
          
          {/* Today's & Tomorrow's Class Schedule */}
          <div className="rounded-3xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Today's Classes</h3>
                  <p className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {data.todaysClasses.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 py-3 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl">No classes scheduled today.</p>
                ) : (
                  data.todaysClasses.map((cls: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{cls.module?.name || cls.code}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                          {cls.start_time?.substring(0, 5)} - {cls.end_time?.substring(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mt-2">
                        <span>{cls.session_type} • {cls.location}</span>
                        {cls.lecturer && <span className="font-bold text-slate-600 dark:text-slate-300">Lecturer: {cls.lecturer}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Tomorrow's Classes</h3>
                  <p className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                    {new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {(!data.tomorrowsClasses || data.tomorrowsClasses.length === 0) ? (
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 py-3 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl">No classes scheduled tomorrow.</p>
                ) : (
                  data.tomorrowsClasses.map((cls: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-2xl border border-purple-100 bg-purple-50/30 dark:bg-purple-950/10 dark:border-purple-900/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{cls.module?.name || cls.code}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 rounded">
                          {cls.start_time?.substring(0, 5)} - {cls.end_time?.substring(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mt-2">
                        <span>{cls.session_type} • {cls.location}</span>
                        {cls.lecturer && <span className="font-bold text-purple-700 dark:text-purple-300">Lecturer: {cls.lecturer}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Immediate Deadlines (48h) */}
          <div className="rounded-3xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Within 48 Hours</h3>
            </div>
            
            <div className="space-y-3">
              {data.immediateDeadlines.length === 0 ? (
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 text-center py-4">No immediate deadlines.</p>
              ) : (
                data.immediateDeadlines.map((deadline, idx) => {
                  const now = new Date()
                  const target = new Date(deadline.date)
                  const diffTime = target.getTime() - now.getTime()
                  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
                  
                  return (
                    <div key={idx} className="flex justify-between items-center p-3.5 rounded-2xl bg-red-50/40 border border-red-100/50 dark:bg-red-950/15 dark:border-red-900/20">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{deadline.title}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">{deadline.type}</span>
                      </div>
                      <span className="text-[10px] font-black text-red-650 bg-red-50 border border-red-100 dark:bg-red-950 dark:border-red-900/30 px-2 py-0.5 rounded shrink-0 ml-2">
                        {diffHours <= 0 ? 'OVERDUE' : `in ${diffHours}h`}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN: Tasks (Grouped by Urgency) */}
        <div className="col-span-2">
          <div className="rounded-3xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Task Queue</h3>
            </div>

            <div className="space-y-6">
              
              {/* Critical */}
              <div>
                <h4 className="text-[10px] font-black text-red-650 dark:text-red-400 uppercase tracking-widest mb-3">Critical Priority</h4>
                <div className="space-y-2">
                  {data.tasks.critical.length === 0 ? (
                    <p className="text-xs font-semibold text-slate-450 italic py-1">No critical tasks.</p>
                  ) : (
                    data.tasks.critical.map((t: any) => (
                      <div key={t.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-950/30 dark:border-slate-850 hover:bg-slate-100/50 transition-colors flex items-center justify-between">
                        <TaskCheckbox taskId={t.id} title={t.title} status={t.status} />
                        <p className="text-[9px] font-black uppercase tracking-wider text-red-605">{t.due_date ? 'OVERDUE / TODAY' : 'CRITICAL'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Important */}
              <div>
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Important Priority</h4>
                <div className="space-y-2">
                  {data.tasks.important.length === 0 ? (
                    <p className="text-xs font-semibold text-slate-450 italic py-1">No important tasks.</p>
                  ) : (
                    data.tasks.important.map((t: any) => (
                      <div key={t.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-950/30 dark:border-slate-850 hover:bg-slate-100/50 transition-colors flex items-center justify-between">
                        <TaskCheckbox taskId={t.id} title={t.title} status={t.status} />
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'HIGH'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Optional */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Optional Priority</h4>
                <div className="space-y-2">
                  {data.tasks.optional.length === 0 ? (
                    <p className="text-xs font-semibold text-slate-450 italic py-1">No optional tasks.</p>
                  ) : (
                    data.tasks.optional.map((t: any) => (
                      <div key={t.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-950/30 dark:border-slate-850 hover:bg-slate-100/50 transition-colors">
                        <TaskCheckbox taskId={t.id} title={t.title} status={t.status} />
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
