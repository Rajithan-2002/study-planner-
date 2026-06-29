import { Briefcase, Calendar, FileText, Trash2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { getDomains } from '@/app/actions/domains'
import { NewProjectButton } from '@/components/projects/new-project-button'
import { deleteProject } from '@/app/actions/projects'
import { TaskCheckbox } from '@/components/ui/TaskCheckbox'
import { QuickAddTask } from '@/components/projects/quick-add-task'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const userId = process.env.DEV_USER_ID

  if (!userId) {
    throw new Error('DEV_USER_ID is not configured in environment')
  }

  // Fetch projects
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      domain:domains(id, name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Fetch all tasks for progress calculations
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)

  const domains = await getDomains()

  const priorityColors: Record<string, string> = {
    LOW: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    MEDIUM: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
    HIGH: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
    CRITICAL: 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
  }

  const statusColors: Record<string, string> = {
    IDEA: 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    RESEARCHING: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30',
    ACTIVE: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
    COMPLETED: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30',
    ARCHIVED: 'text-slate-400 bg-slate-100 border-slate-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-800/80',
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Project Hub
          </h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Manage your active projects, academic milestones, and portfolio.
          </p>
        </div>
        <NewProjectButton domains={domains || []} />
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects?.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 dark:text-slate-400 font-semibold bg-white dark:bg-slate-900">
            No projects found. Create one to get started!
          </div>
        )}

        {projects?.map((project) => {
          // Filter tasks related to this project
          const projTasks = (tasks || []).filter(
            (t) => t.related_entity_type === 'PROJECT' && t.related_entity_id === project.id
          )
          
          const totalTasks = projTasks.length
          const completedTasks = projTasks.filter((t) => t.status === 'COMPLETED').length
          const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100

          return (
            <div
              key={project.id}
              className="group relative flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
            >
              
              {/* TOP HEADER */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {project.domain?.name && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {project.domain.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                    {project.name}
                  </h3>
                </div>
                
                <div className="flex gap-1.5 items-center shrink-0">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusColors[project.status || 'IDEA']}`}>
                    {project.status}
                  </span>
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${priorityColors[project.priority || 'LOW']}`}>
                    {project.priority}
                  </span>
                </div>
              </div>

              {/* DESCRIPTION */}
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {project.description || 'No description provided.'}
              </p>

              {/* PROGRESS BAR */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Milestone Progress</span>
                  <span className="text-blue-600 dark:text-blue-400">{completionPercentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* TASK LIST (MAX 3) */}
              <div className="mt-5 space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4 flex-1">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Project Tasks ({completedTasks}/{totalTasks})</span>
                </div>
                
                {projTasks.length === 0 ? (
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-600 italic py-1">
                    No active tasks. Add one below!
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {projTasks.slice(0, 3).map((t) => (
                      <TaskCheckbox key={t.id} taskId={t.id} title={t.title} status={t.status} />
                    ))}
                    {projTasks.length > 3 && (
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-8">
                        + {projTasks.length - 3} more tasks
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* QUICK TASK CREATION */}
              <div className="mt-4 pt-1">
                <QuickAddTask
                  relatedEntityType="PROJECT"
                  relatedEntityId={project.id}
                  domainId={project.domain_id}
                />
              </div>

              {/* NOTES DISPLAY */}
              {project.notes && (
                <div className="mt-4 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                    {project.notes}
                  </p>
                </div>
              )}

              {/* FOOTER */}
              <div className="mt-6 flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created {new Date(project.created_at).toLocaleDateString()}
                </span>
                
                <form action={async () => {
                  'use server'
                  await deleteProject(project.id)
                }}>
                  <button type="submit" className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}
