import { Award, Calendar, ExternalLink, FileText, Trash2, BookOpen } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { getDomains } from '@/app/actions/domains'
import { NewCertButton } from '@/components/certifications/new-cert-button'
import { deleteCertification } from '@/app/actions/certifications'
import { TaskCheckbox } from '@/components/ui/TaskCheckbox'
import { QuickAddTask } from '@/components/projects/quick-add-task'

export default async function CertificationsPage() {
  const supabase = await createClient()
  const userId = process.env.DEV_USER_ID

  if (!userId) {
    throw new Error('DEV_USER_ID is not configured in environment')
  }

  // Fetch certifications
  const { data: certs } = await supabase
    .from('certifications')
    .select(`
      *,
      domain:domains(id, name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Fetch all tasks for readiness calculations
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)

  // Fetch all certification resources
  const { data: allResources } = await supabase
    .from('certification_resources')
    .select('*')

  const domains = await getDomains()

  const priorityColors: Record<string, string> = {
    LOW: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    MEDIUM: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
    HIGH: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
    CRITICAL: 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
  }

  const statusColors: Record<string, string> = {
    IDEA: 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
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
            Learning Journeys
          </h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Track your professional certifications, preparation tasks, and readiness metrics.
          </p>
        </div>
        <NewCertButton domains={domains || []} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {certs?.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 dark:text-slate-400 font-semibold bg-white dark:bg-slate-900">
            No certifications tracked. Add one to start your journey!
          </div>
        )}

        {certs?.map((cert) => {
          // Filter tasks related to this cert
          const certTasks = (tasks || []).filter(
            (t) => t.related_entity_type === 'CERTIFICATION' && t.related_entity_id === cert.id
          )
          
          const totalTasks = certTasks.length
          const completedTasks = certTasks.filter((t) => t.status === 'COMPLETED').length
          
          // Calculate readiness score
          let readinessPercentage = 0
          if (totalTasks === 0) {
            // Compute proxy score based on proximity to exam date if available
            if (cert.exam_date) {
              const days = Math.ceil((new Date(cert.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              readinessPercentage = Math.max(30, Math.min(95, 100 - days * 2))
            } else {
              readinessPercentage = 40 // Starting baseline
            }
          } else {
            readinessPercentage = Math.round((completedTasks / totalTasks) * 100)
          }

          // Filter resources associated with this cert
          const certResources = (allResources || []).filter((r) => r.certification_id === cert.id)

          // Proximity message
          let countdownText = ''
          if (cert.exam_date) {
            const days = Math.ceil((new Date(cert.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            countdownText = days < 0 ? 'Exam Overdue' : days === 0 ? 'Exam Today!' : `Exam in ${days} days`
          } else if (cert.target_date) {
            const days = Math.ceil((new Date(cert.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            countdownText = days < 0 ? 'Target Date Passed' : days === 0 ? 'Target Date Today!' : `Target: ${days} days left`
          }

          return (
            <div
              key={cert.id}
              className="group relative flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
            >
              
              {/* TOP HEADER */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {cert.domain?.name && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {cert.domain.name}
                      </span>
                    )}
                    {cert.provider && (
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        • {cert.provider}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                    {cert.name}
                  </h3>
                </div>
                
                <div className="flex gap-1.5 items-center shrink-0">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusColors[cert.status || 'IDEA']}`}>
                    {cert.status}
                  </span>
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${priorityColors[cert.priority || 'LOW']}`}>
                    {cert.priority}
                  </span>
                </div>
              </div>

              {/* DATES & COUNTDOWN */}
              <div className="mt-3 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <span>
                    {cert.exam_date 
                      ? `Exam: ${new Date(cert.exam_date).toLocaleDateString()}` 
                      : cert.target_date 
                        ? `Target: ${new Date(cert.target_date).toLocaleDateString()}` 
                        : 'No Target Date'}
                  </span>
                </div>
                {countdownText && (
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    countdownText.includes('Today') || countdownText.includes('Overdue') || countdownText.includes('Passed')
                      ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                  }`}>
                    {countdownText}
                  </span>
                )}
              </div>

              {/* READINESS / PROGRESS */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Exam Readiness</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{readinessPercentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${readinessPercentage}%` }}
                  />
                </div>
              </div>

              {/* PREPARATION TASKS */}
              <div className="mt-5 space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1.5">
                  <Award className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Preparation tasks</span>
                </div>

                {certTasks.length === 0 ? (
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-600 italic py-1">
                    No prep tasks created. Add one below!
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {certTasks.slice(0, 3).map((t) => (
                      <TaskCheckbox key={t.id} taskId={t.id} title={t.title} status={t.status} />
                    ))}
                    {certTasks.length > 3 && (
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-8">
                        + {certTasks.length - 3} more tasks
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* QUICK STUDY TASK ADDER */}
              <div className="mt-3">
                <QuickAddTask
                  relatedEntityType="CERTIFICATION"
                  relatedEntityId={cert.id}
                  domainId={cert.domain_id}
                />
              </div>

              {/* RESOURCES */}
              {certResources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Study Resources</span>
                  </div>
                  <div className="space-y-1.5">
                    {certResources.map((res) => (
                      <a
                        key={res.id}
                        href={res.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{res.title}</span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">{res.resource_type}</span>
                        </div>
                        <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTES */}
              {cert.notes && (
                <div className="mt-4 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                    {cert.notes}
                  </p>
                </div>
              )}

              {/* FOOTER */}
              <div className="mt-6 flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Added {new Date(cert.created_at).toLocaleDateString()}
                </span>
                
                <form action={async () => {
                  'use server'
                  await deleteCertification(cert.id)
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
