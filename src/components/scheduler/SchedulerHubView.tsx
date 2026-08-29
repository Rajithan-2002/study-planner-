'use client'

import { useState, useTransition, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  Settings, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Trash2, 
  Lock, 
  LockOpen,
  Activity,
  GraduationCap
} from 'lucide-react'
import { 
  createTimeBlock, 
  deleteTimeBlock, 
  toggleTimeBlockStatus, 
  saveSchedulerPreferences, 
  proposeDailyPlan, 
  acceptDailyPlan, 
  postponeTimeBlock,
  saveSpecialPlan,
  getSpecialPlans
} from '@/app/actions/scheduler'
import { calculateWorkload } from '@/lib/scheduler/engine'
import { useRouter } from 'next/navigation'
import { formatHours } from '@/lib/utils/time'
import { TaskCheckbox } from '@/components/ui/TaskCheckbox'

interface SchedulerHubViewProps {
  todaysClasses?: any[]
  tomorrowsClasses?: any[]
  tasks?: { critical: any[]; important: any[]; optional: any[] }
  immediateDeadlines?: any[]
  timeBlocks: any[]
  preferences: any
  conflicts: any[]
  proposedPlan: any
  projects?: { id: string; name: string }[]
  certifications?: { id: string; name: string }[]
}

export function SchedulerHubView({
  todaysClasses = [],
  tomorrowsClasses = [],
  tasks = { critical: [], important: [], optional: [] },
  immediateDeadlines = [],
  timeBlocks = [],
  preferences,
  conflicts = [],
  proposedPlan,
  projects = [],
  certifications = []
}: SchedulerHubViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Strategy & preferences states
  const [activeStrategy, setActiveStrategy] = useState('BALANCED')
  const [showPrefs, setShowPrefs] = useState(false)
  const [isAddingBlock, setIsAddingBlock] = useState(false)

  // Special Plan Modal State
  const [isCreatingSpecial, setIsCreatingSpecial] = useState(false)
  const [specialPlans, setSpecialPlans] = useState<any[]>([])
  const [specialForm, setSpecialForm] = useState({
    name: 'Custom Study Plan',
    dailyHours: 6,
    tasks: [
      { name: '', hours: 2, note: '' }
    ]
  })

  // Form states
  const [blockForm, setBlockForm] = useState({
    title: '',
    type: 'DEEP_WORK',
    scheduled_at: '',
    duration_minutes: 45,
    is_locked: false
  })

  const [prefsForm, setPrefsForm] = useState({
    preferred_focus_time: preferences?.preferred_focus_time || 'EVENING',
    max_daily_study_hours: preferences?.max_daily_study_hours || 4.0,
    max_daily_project_hours: preferences?.max_daily_project_hours || 3.0,
    buffer_minutes: preferences?.buffer_minutes || 10,
    sleep_start_time: preferences?.sleep_start_time || '23:00',
    sleep_end_time: preferences?.sleep_end_time || '07:00',
    work_start_time: preferences?.work_start_time || '08:00',
    work_end_time: preferences?.work_end_time || '18:00'
  })

  useEffect(() => {
    getSpecialPlans().then(plans => {
      setSpecialPlans(plans)
    })
  }, [])

  const activeWorkloadBlocks = timeBlocks.length > 0 ? timeBlocks : (proposedPlan?.plan_data || [])
  const workload = calculateWorkload(activeWorkloadBlocks)

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === 'CREATE_NEW_SPECIAL') {
      setIsCreatingSpecial(true)
    } else {
      setActiveStrategy(val)
    }
  }

  const handleProposePlan = () => {
    startTransition(async () => {
      const todayStr = new Date().toISOString().split('T')[0]
      const res = await proposeDailyPlan(todayStr, activeStrategy)
      if (res && res.success) {
        router.refresh()
      }
    })
  }

  const handleAcceptPlan = (planId: string) => {
    startTransition(async () => {
      const res = await acceptDailyPlan(planId)
      if (res && res.success) {
        router.refresh()
      }
    })
  }

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.append('title', blockForm.title)
      fd.append('type', blockForm.type)
      const isoStr = new Date(`${new Date().toISOString().split('T')[0]}T${blockForm.scheduled_at}:00`).toISOString()
      fd.append('scheduled_at', isoStr)
      fd.append('duration_minutes', String(blockForm.duration_minutes))
      fd.append('is_locked', String(blockForm.is_locked))

      const res = await createTimeBlock(fd)
      if (res && res.success) {
        setIsAddingBlock(false)
        router.refresh()
      }
    })
  }

  const handleToggleBlock = (id: string, currentStatus: string) => {
    startTransition(async () => {
      await toggleTimeBlockStatus(id, currentStatus)
      router.refresh()
    })
  }

  const handleDeleteBlock = (id: string) => {
    if (!confirm('Remove this block?')) return
    startTransition(async () => {
      await deleteTimeBlock(id)
      router.refresh()
    })
  }

  const handlePostponeBlock = (id: string) => {
    if (!confirm('Postpone this block to tomorrow?')) return
    startTransition(async () => {
      const res = await postponeTimeBlock(id)
      if (res && res.success) {
        router.refresh()
      }
    })
  }

  const handleSavePrefs = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.append('preferred_focus_time', prefsForm.preferred_focus_time)
      fd.append('max_daily_study_hours', String(prefsForm.max_daily_study_hours))
      fd.append('max_daily_project_hours', String(prefsForm.max_daily_project_hours))
      fd.append('buffer_minutes', String(prefsForm.buffer_minutes))
      fd.append('sleep_start_time', prefsForm.sleep_start_time)
      fd.append('sleep_end_time', prefsForm.sleep_end_time)
      fd.append('work_start_time', prefsForm.work_start_time)
      fd.append('work_end_time', prefsForm.work_end_time)

      const res = await saveSchedulerPreferences(fd)
      if (res && res.success) {
        setShowPrefs(false)
        router.refresh()
      }
    })
  }

  const handleCreateSpecialSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await saveSpecialPlan(specialForm.name, specialForm.dailyHours, specialForm.tasks)
      if (res && res.success && res.data) {
        setIsCreatingSpecial(false)
        const updatedPlans = await getSpecialPlans()
        setSpecialPlans(updatedPlans)
        const newStrat = `SPECIAL_${res.data.id}`
        setActiveStrategy(newStrat)
        await proposeDailyPlan(new Date().toISOString().split('T')[0], newStrat)
        router.refresh()
      }
    })
  }

  const workloadZoneColors: Record<string, string> = {
    GREEN: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
    YELLOW: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
    RED: 'text-red-600 bg-red-50 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT PRIMARY WORKSTATION COLUMN (7 COLS / ~60-65%) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* STRATEGY & PROPOSAL CONTROL TRAY */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase shrink-0">Strategy:</span>
            <select
              value={activeStrategy}
              onChange={handleStrategyChange}
              className="bg-transparent text-xs font-extrabold text-emerald-600 dark:text-emerald-400 outline-none cursor-pointer truncate max-w-[260px]"
            >
              <option value="BALANCED">⚖️ Balanced (capacity-based)</option>
              {specialPlans.map(p => (
                <option key={p.id} value={`SPECIAL_${p.id}`}>
                  ✨ Special: {p.plan_data?.name || 'Custom Plan'} ({p.plan_data?.dailyHours || 8}h/day)
                </option>
              ))}
              <option value="CREATE_NEW_SPECIAL">➕ + Create Special / AI Custom Plan...</option>
            </select>
          </div>

          <button
            onClick={handleProposePlan}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Propose Today\'s Plan'}
          </button>
        </div>

        {/* PROPOSED PLAN REVIEW BANNER */}
        {proposedPlan && (
          <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 p-5 rounded-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-500" /> Suggested Daily Plan Generated
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review the proposed study time allocations based on your chosen strategy.</p>
              </div>
              <button
                onClick={() => handleAcceptPlan(proposedPlan.id)}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors cursor-pointer shrink-0"
              >
                Accept Plan <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* PREVIEW PROPOSED WORKLOAD */}
            <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Proposed Workload Allocations</p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(proposedPlan.plan_data || []).map((b: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{b.title}</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {b.duration_minutes >= 60 ? formatHours(b.duration_minutes / 60) : `${b.duration_minutes} mins`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TODAY'S ACTIVE SCHEDULE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" /> Today's Active Schedule
            </h3>
            <button
              onClick={() => setIsAddingBlock(!isAddingBlock)}
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Time Block
            </button>
          </div>

          {/* ADD INLINE FORM */}
          {isAddingBlock && (
            <form onSubmit={handleCreateBlock} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Block Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Practice Lab exercise"
                    value={blockForm.title}
                    onChange={e => setBlockForm({ ...blockForm, title: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-350 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Block Type</label>
                  <select
                    value={blockForm.type}
                    onChange={e => setBlockForm({ ...blockForm, type: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-350 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
                  >
                    <option value="DEEP_WORK">Deep Work</option>
                    <option value="STUDY">Study Prep</option>
                    <option value="PROJECT">Project Tasks</option>
                    <option value="BREAK">Short Break</option>
                    <option value="EXERCISE">Exercise / Health</option>
                    <option value="PERSONAL">Personal Agenda</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={blockForm.scheduled_at}
                    onChange={e => setBlockForm({ ...blockForm, scheduled_at: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-350 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={blockForm.duration_minutes}
                    onChange={e => setBlockForm({ ...blockForm, duration_minutes: Number(e.target.value) })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-350 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-4 pl-3">
                  <input
                    type="checkbox"
                    id="lockBlock"
                    checked={blockForm.is_locked}
                    onChange={e => setBlockForm({ ...blockForm, is_locked: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="lockBlock" className="text-[10px] font-bold text-slate-500 cursor-pointer">Lock block</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50">
                <button type="button" onClick={() => setIsAddingBlock(false)} className="text-[10px] font-bold text-slate-500">Cancel</button>
                <button type="submit" disabled={isPending} className="px-4 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">
                  Save Block
                </button>
              </div>
            </form>
          )}

          {/* ACTIVE WORKLOAD LIST */}
          <div className="space-y-3">
            {timeBlocks.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 italic text-xs">
                No active calendar items scheduled for today. Run proposal strategies to automatically generate time blocks.
              </div>
            ) : (
              timeBlocks.map((block) => {
                const isCompleted = block.status === 'COMPLETED'

                return (
                  <div
                    key={block.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isCompleted
                        ? 'bg-slate-50 border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800 opacity-70'
                        : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => handleToggleBlock(block.id, block.status)}
                        className="text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-700 hover:border-emerald-500" />
                        )}
                      </button>
                      
                      <div className="min-w-0">
                        <span className={`text-sm font-bold block ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {block.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mt-1">
                          <span className="text-emerald-500 font-bold">{block.type}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3 text-emerald-500" /> {block.duration_minutes >= 60 ? formatHours(block.duration_minutes / 60) : `${block.duration_minutes} mins`} allocated</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {block.is_locked ? (
                        <span title="Locked item"><Lock className="h-3.5 w-3.5 text-slate-400" /></span>
                      ) : (
                        <span title="Flexible block"><LockOpen className="h-3.5 w-3.5 text-slate-300" /></span>
                      )}
                      
                      <button
                        onClick={() => handlePostponeBlock(block.id)}
                        title="Postpone block to Tomorrow"
                        className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-md transition-colors cursor-pointer"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* TASK QUEUE PANEL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Task Queue</h3>
          </div>

          <div className="space-y-5">
            {/* Critical */}
            <div>
              <h4 className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2.5">Critical Priority</h4>
              <div className="space-y-2">
                {tasks.critical.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400 italic py-1">No critical tasks.</p>
                ) : (
                  tasks.critical.map((t: any) => (
                    <div key={t.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950/30 dark:border-slate-800 hover:bg-slate-100/50 transition-colors flex items-center justify-between">
                      <TaskCheckbox taskId={t.id} title={t.title} status={t.status} />
                      <p className="text-[9px] font-black uppercase tracking-wider text-red-500">{t.due_date ? 'OVERDUE / TODAY' : 'CRITICAL'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Important */}
            <div>
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2.5">Important Priority</h4>
              <div className="space-y-2">
                {tasks.important.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400 italic py-1">No important tasks.</p>
                ) : (
                  tasks.important.map((t: any) => (
                    <div key={t.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950/30 dark:border-slate-800 hover:bg-slate-100/50 transition-colors flex items-center justify-between">
                      <TaskCheckbox taskId={t.id} title={t.title} status={t.status} />
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'HIGH'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Optional */}
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Optional Priority</h4>
              <div className="space-y-2">
                {tasks.optional.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400 italic py-1">No optional tasks.</p>
                ) : (
                  tasks.optional.map((t: any) => (
                    <div key={t.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950/30 dark:border-slate-800 hover:bg-slate-100/50 transition-colors">
                      <TaskCheckbox taskId={t.id} title={t.title} status={t.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT SIDEBAR COLUMN (4 COLS / ~35-40%) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* UNIFIED SYSTEM HEALTH & WORKLOAD CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" /> Workload & Health
            </h3>
            <span className={`px-2.5 py-0.5 rounded border text-[10px] uppercase font-black ${workloadZoneColors[workload.zone]}`}>
              {workload.zone} ({formatHours(workload.totalHours)})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Study Time</span>
              <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">{formatHours(workload.studyHours)}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Project Time</span>
              <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">{formatHours(workload.projectHours)}</span>
            </div>
          </div>

          {/* WARNINGS */}
          {conflicts.length > 0 ? (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {conflicts.map((c, idx) => (
                <div key={idx} className="flex gap-2 p-3 bg-red-50/40 dark:bg-red-950/20 text-red-650 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900/30">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-extrabold">{c.title}</p>
                    <p className="text-[11px] mt-0.5 opacity-90 leading-snug">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Zero scheduling conflicts detected</span>
            </div>
          )}

          {/* AVAILABILITY PROFILE SETTINGS */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Availability Profile</span>
              <button
                onClick={() => setShowPrefs(!showPrefs)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>

            {showPrefs ? (
              <form onSubmit={handleSavePrefs} className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Focus Target</label>
                    <select
                      value={prefsForm.preferred_focus_time}
                      onChange={e => setPrefsForm({ ...prefsForm, preferred_focus_time: e.target.value })}
                      className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
                    >
                      <option value="MORNING">Morning Focus</option>
                      <option value="AFTERNOON">Afternoon Focus</option>
                      <option value="EVENING">Evening Focus</option>
                      <option value="NIGHT">Night Owl Focus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Buffer Time</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={prefsForm.buffer_minutes}
                      onChange={e => setPrefsForm({ ...prefsForm, buffer_minutes: Number(e.target.value) })}
                      className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowPrefs(false)} className="text-[10px] font-bold text-slate-550">Cancel</button>
                  <button type="submit" disabled={isPending} className="px-3 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Save</button>
                </div>
              </form>
            ) : (
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                <p>⚡ Focus window: <strong className="text-slate-800 dark:text-white">{preferences?.preferred_focus_time || 'EVENING'}</strong></p>
                <p>⏱️ Shift: <strong className="text-slate-800 dark:text-white">{preferences?.work_start_time || '08:00'} - {preferences?.work_end_time || '18:00'}</strong></p>
              </div>
            )}
          </div>
        </div>

        {/* UNIFIED ACADEMIC CLASSES & UPCOMING DEADLINES CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <GraduationCap className="h-4 w-4 text-blue-500" />
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Campus & Timetable Schedule</h3>
          </div>

          {/* Today's Classes */}
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider block mb-2">
              Today ({new Date().toLocaleDateString('en-US', { weekday: 'short' })})
            </span>
            {todaysClasses.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400 py-2 text-center bg-slate-50 dark:bg-slate-950 rounded-xl">No classes scheduled today.</p>
            ) : (
              <div className="space-y-2">
                {todaysClasses.map((cls: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{cls.module?.name || cls.code}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                        {cls.start_time?.substring(0, 5)} - {cls.end_time?.substring(0, 5)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{cls.session_type} • {cls.location}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tomorrow's Classes */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider block mb-2">
              Tomorrow ({new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'short' })})
            </span>
            {(!tomorrowsClasses || tomorrowsClasses.length === 0) ? (
              <p className="text-xs font-semibold text-slate-400 py-2 text-center bg-slate-50 dark:bg-slate-950 rounded-xl">No classes scheduled tomorrow.</p>
            ) : (
              <div className="space-y-2">
                {tomorrowsClasses.map((cls: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 dark:bg-purple-950/20 dark:border-purple-900/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{cls.module?.name || cls.code}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded">
                        {cls.start_time?.substring(0, 5)} - {cls.end_time?.substring(0, 5)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{cls.session_type} • {cls.location}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Immediate Deadlines */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider">
                Within 48 Hours
              </span>
            </div>
            {immediateDeadlines.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400 text-center py-2">No immediate deadlines.</p>
            ) : (
              <div className="space-y-2">
                {immediateDeadlines.map((deadline, idx) => {
                  const now = new Date()
                  const target = new Date(deadline.date)
                  const diffHours = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60))
                  
                  return (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-red-50/40 border border-red-100/50 dark:bg-red-950/15 dark:border-red-900/20">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{deadline.title}</span>
                      <span className="text-[9px] font-black text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded shrink-0">
                        {diffHours <= 0 ? 'OVERDUE' : `in ${diffHours}h`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CREATE SPECIAL PLAN MODAL */}
      {isCreatingSpecial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" /> Create Custom Special Strategy Plan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure target hours and task priorities for your custom sprint plan.</p>
              </div>
              <button onClick={() => setIsCreatingSpecial(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateSpecialSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next 7 Days Leave Plan"
                    value={specialForm.name}
                    onChange={e => setSpecialForm({ ...specialForm, name: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Daily Budget (hrs)</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={specialForm.dailyHours}
                    onChange={e => setSpecialForm({ ...specialForm, dailyHours: Number(e.target.value) })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 outline-none dark:text-white"
                  />
                </div>
              </div>

              {/* TASK ITEMS LIST */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Plan Tasks & Prioritized Time</label>
                  <button
                    type="button"
                    onClick={() => setSpecialForm({
                      ...specialForm,
                      tasks: [...specialForm.tasks, { name: 'New Task', hours: 1, note: '' }]
                    })}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    + Add Task
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {specialForm.tasks.map((task, tIdx) => (
                    <div key={tIdx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-750">
                      <input
                        type="text"
                        placeholder="Task name"
                        value={task.name}
                        onChange={e => {
                          const newTasks = [...specialForm.tasks]
                          newTasks[tIdx].name = e.target.value
                          setSpecialForm({ ...specialForm, tasks: newTasks })
                        }}
                        className="flex-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 outline-none dark:text-white"
                      />
                      <div className="w-24 flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="12"
                          value={task.hours}
                          onChange={e => {
                            const newTasks = [...specialForm.tasks]
                            newTasks[tIdx].hours = Number(e.target.value)
                            setSpecialForm({ ...specialForm, tasks: newTasks })
                          }}
                          className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 outline-none dark:text-white text-center"
                        />
                        <span className="text-[10px] font-bold text-slate-400">hrs</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newTasks = specialForm.tasks.filter((_, i) => i !== tIdx)
                          setSpecialForm({ ...specialForm, tasks: newTasks })
                        }}
                        className="text-red-400 hover:text-red-600 p-1 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingSpecial(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
                >
                  {isPending ? 'Saving Plan...' : 'Save & Activate Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
