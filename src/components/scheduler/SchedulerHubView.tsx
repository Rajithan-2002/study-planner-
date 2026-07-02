'use client'

import { useState, useTransition } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle2, Plus, Sparkles, Settings, Loader2, ArrowRight, ShieldCheck, Heart, Trash2, Edit3, Lock, LockOpen } from 'lucide-react'
import { createTimeBlock, updateTimeBlock, deleteTimeBlock, toggleTimeBlockStatus, saveSchedulerPreferences, proposeDailyPlan, acceptDailyPlan, postponeTimeBlock } from '@/app/actions/scheduler'
import { calculateWorkload } from '@/lib/scheduler/engine'
import { useRouter } from 'next/navigation'
import { formatHours } from '@/lib/utils/time'

import { FocusStopwatch } from './FocusStopwatch'

interface SchedulerHubViewProps {
  todaysClasses: any[]
  tasks: any
  immediateDeadlines: any[]
  timeBlocks: any[]
  preferences: any
  conflicts: any[]
  proposedPlan: any
  projects?: { id: string; name: string }[]
  certifications?: { id: string; name: string }[]
}

export function SchedulerHubView({
  todaysClasses = [],
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
  
  // Tab/Panel states
  const [activeStrategy, setActiveStrategy] = useState('BALANCED')
  const [showPrefs, setShowPrefs] = useState(false)
  const [isAddingBlock, setIsAddingBlock] = useState(false)
  const [editingBlock, setEditingBlock] = useState<any>(null)

  // Form states
  const [blockForm, setBlockForm] = useState({
    title: '',
    type: 'DEEP_WORK',
    scheduled_at: '',
    duration_minutes: 45,
    is_locked: false
  })

  const [prefsForm, setPrefsForm] = useState({
    preferred_focus_time: preferences.preferred_focus_time || 'MORNING',
    max_daily_study_hours: preferences.max_daily_study_hours || 4.0,
    max_daily_project_hours: preferences.max_daily_project_hours || 3.0,
    buffer_minutes: preferences.buffer_minutes || 10,
    sleep_start_time: preferences.sleep_start_time || '23:00',
    sleep_end_time: preferences.sleep_end_time || '07:00',
    work_start_time: preferences.work_start_time || '08:00',
    work_end_time: preferences.work_end_time || '18:00'
  })

  // Calculate dynamic workload metrics using scheduler engine calculations
  const workload = calculateWorkload(timeBlocks)

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
      // Append modern time format
      const isoStr = new Date(`${new Date().toISOString().split('T')[0]}T${blockForm.scheduled_at}:00`).toISOString()
      fd.append('scheduled_at', isoStr)
      fd.append('duration_minutes', String(blockForm.duration_minutes))
      fd.append('is_locked', String(blockForm.is_locked))

      const res = await createTimeBlock(fd)
      if (res && res.success) {
        setIsAddingBlock(false)
        setBlockForm({ title: '', type: 'DEEP_WORK', scheduled_at: '', duration_minutes: 45, is_locked: false })
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

  const handleToggleBlock = (id: string, status: string) => {
    startTransition(async () => {
      await toggleTimeBlockStatus(id, status)
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

  const workloadZoneColors: Record<string, string> = {
    GREEN: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
    YELLOW: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
    RED: 'text-red-600 bg-red-50 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      
      {/* LEFT COLUMN: CRITICAL ALERTS & WORKLOAD STATUS */}
      <div className="col-span-1 space-y-6">
        
        {/* WORKLOAD ANALYTICS & HEALTH */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Workload Analytics</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Study Hours</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatHours(workload.studyHours)}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Project Hours</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatHours(workload.projectHours)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 rounded-2xl border border-transparent font-bold text-xs bg-slate-50 dark:bg-slate-950">
            <span className="text-slate-500">Scheduler Health:</span>
            <span className={`px-2.5 py-0.5 rounded border text-[10px] uppercase font-black ${workloadZoneColors[workload.zone]}`}>
              {workload.zone} ZONE ({formatHours(workload.totalHours)})
            </span>
          </div>
        </div>

        {/* FOCUS STOPWATCH RUNTIME */}
        <FocusStopwatch projects={projects} certifications={certifications} />

        {/* ALERTS / CONFLICTS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Scheduling Warnings</h3>
            <span className="text-[10px] font-black uppercase bg-red-50 text-red-650 px-2 py-0.5 rounded">
              {conflicts.length} alerts
            </span>
          </div>

          {conflicts.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>No scheduling conflicts or overloads detected.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {conflicts.map((c, idx) => (
                <div key={idx} className="flex gap-2 p-3.5 bg-red-50/40 dark:bg-red-950/20 text-red-650 dark:text-red-400 text-xs rounded-2xl border border-red-100 dark:border-red-900/30">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-extrabold">{c.title}</p>
                    <p className="text-[11px] mt-0.5 opacity-90 leading-snug">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SETTINGS / AVAILABILITY PANELS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Availability Profile</h3>
            <button
              onClick={() => setShowPrefs(!showPrefs)}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Settings className="h-4 w-4" />
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
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Buffer Time (mins)</label>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Work Start</label>
                  <input
                    type="time"
                    value={prefsForm.work_start_time}
                    onChange={e => setPrefsForm({ ...prefsForm, work_start_time: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Work End</label>
                  <input
                    type="time"
                    value={prefsForm.work_end_time}
                    onChange={e => setPrefsForm({ ...prefsForm, work_end_time: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPrefs(false)} className="text-[10px] font-bold text-slate-550">Cancel</button>
                <button type="submit" disabled={isPending} className="px-3 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">
                  Save Settings
                </button>
              </div>
            </form>
          ) : (
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
              <p>⚡ Preferred focus: <strong className="text-slate-800 dark:text-white">{preferences.preferred_focus_time}</strong></p>
              <p>⏱️ Shift windows: <strong className="text-slate-800 dark:text-white">{preferences.work_start_time} - {preferences.work_end_time}</strong></p>
              <p>🛡️ Rescheduling Buffer: <strong className="text-slate-800 dark:text-white">{preferences.buffer_minutes} mins</strong></p>
            </div>
          )}
        </div>

      </div>

      {/* MID & RIGHT COLUMN: DAILY AGENDA WORKSPACE */}
      <div className="col-span-2 space-y-6">
        
        {/* STRATEGY & PROPOSALS CONTROL TRAY */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">Scheduling Strategy:</span>
            <select
              value={activeStrategy}
              onChange={e => setActiveStrategy(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-emerald-600 dark:text-emerald-400 outline-none cursor-pointer"
            >
              <option value="BALANCED">Balanced Allocation</option>
              <option value="DEADLINE_FIRST">Deadline Prioritization</option>
              <option value="STUDY_FIRST">Academic Study Focus</option>
              <option value="PROJECT_FIRST">Project Milestones Focus</option>
            </select>
          </div>

          <button
            onClick={handleProposePlan}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Propose Today\'s Plan'}
          </button>
        </div>

        {/* PROPOSED PLAN REVIEW BANNER */}
        {proposedPlan && (
          <div className="bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-900/30 p-5 rounded-3xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-500" /> Suggested Daily Plan Generated
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review the proposed blocks layout based on your focus window and task deadlines.</p>
              </div>
              <button
                onClick={() => handleAcceptPlan(proposedPlan.id)}
                disabled={isPending}
                className="flex items-center gap-1 px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Accept Plan <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* PREVIEW PROPOSED TIMELINE */}
            <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Proposed Timeline blocks</p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/85">
                {(proposedPlan.plan_data || []).map((b: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{b.title}</span>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>{new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>{b.duration_minutes}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TIME BLOCKS AGENDA CALENDAR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Today's Active Schedule</h3>
            <button
              onClick={() => setIsAddingBlock(!isAddingBlock)}
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Time Block
            </button>
          </div>

          {/* ADD TIME BLOCK INLINE FORM */}
          {isAddingBlock && (
            <form onSubmit={handleCreateBlock} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
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

          {/* CHRONOLOGICAL LIST */}
          <div className="space-y-3">
            {timeBlocks.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl text-slate-400 italic">
                No active calendar items scheduled for today. Run proposal strategies to automatically generate time blocks.
              </div>
            ) : (
              timeBlocks.map((block, idx) => {
                const isCompleted = block.status === 'COMPLETED'
                const blockTime = new Date(block.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                return (
                  <div
                    key={block.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isCompleted
                        ? 'bg-slate-50 border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-850 opacity-70'
                        : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => handleToggleBlock(block.id, block.status)}
                        className="text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
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
                          <span className="text-blue-500 font-bold">{block.type}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {blockTime} ({block.duration_minutes}m)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
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

      </div>

    </div>
  )
}
