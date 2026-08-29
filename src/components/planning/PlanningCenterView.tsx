'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, Clock, AlertTriangle, CheckCircle2, Plus, Sparkles, Settings, Loader2, 
  ArrowRight, ShieldCheck, Heart, Trash2, Edit3, Target, CalendarDays, BarChart3, 
  HelpCircle, Compass, History, Activity, Play, Check, X, ShieldAlert
} from 'lucide-react'
import { 
  savePlanningCapacity, createGoal, deleteGoal, createRecurringActivity, 
  toggleRecurringActivity, deleteRecurringActivity, logRecurringActivity, 
  createFixedCommitment, deleteFixedCommitment, createAvailabilityException, 
  deleteAvailabilityException, runPlanningSimulationAction
} from '@/app/actions/planning'
import { formatHours } from '@/lib/utils/time'
import { useToast } from '@/components/ui/Toast'

interface PlanningCenterViewProps {
  dailyPlan: any
  weeklyPlan: any
  conflicts: any[]
  capacity: any
  goals: any[]
  recurring: any[]
  recurringLogs: any[]
  fixed: any[]
  vacation: any[]
  decisions: any[]
  certifications: any[]
  projects: any[]
}

export function PlanningCenterView({
  dailyPlan,
  weeklyPlan,
  conflicts,
  capacity,
  goals,
  recurring,
  recurringLogs,
  fixed,
  vacation,
  decisions,
  certifications,
  projects
}: PlanningCenterViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'capacity' | 'habits' | 'fixed' | 'goals' | 'simulator' | 'history'>('today')

  // Form states
  const [capacityForm, setCapacityForm] = useState({
    monday_hours: capacity?.monday_hours ?? 4.0,
    tuesday_hours: capacity?.tuesday_hours ?? 4.0,
    wednesday_hours: capacity?.wednesday_hours ?? 4.0,
    thursday_hours: capacity?.thursday_hours ?? 4.0,
    friday_hours: capacity?.friday_hours ?? 4.0,
    saturday_hours: capacity?.saturday_hours ?? 8.0,
    sunday_hours: capacity?.sunday_hours ?? 6.0,
    preferred_focus_block: capacity?.preferred_focus_block ?? 90,
    minimum_break: capacity?.minimum_break ?? 15,
    maximum_weekly_hours: capacity?.maximum_weekly_hours ?? 32.0,
    preferred_start_time: capacity?.preferred_start_time ?? '08:00',
    preferred_end_time: capacity?.preferred_end_time ?? '22:00',
    sleep_time: capacity?.sleep_time ?? '23:00',
    wake_time: capacity?.wake_time ?? '07:00',
    energy_profile: capacity?.energy_profile ?? 'BALANCED'
  })

  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    target_date: '',
    priority_multiplier: 1.2
  })

  const [recurringForm, setRecurringForm] = useState({
    title: '',
    description: '',
    type: 'HABIT',
    frequency: 'DAILY',
    days_of_week: [] as string[],
    estimated_minutes: 30,
    priority: 'MEDIUM',
    difficulty: 'MEDIUM',
    preferred_time: 'ANYTIME'
  })

  const [fixedForm, setFixedForm] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 60,
    category: 'LECTURE'
  })

  const [vacationForm, setVacationForm] = useState({
    start_date: '',
    end_date: '',
    capacity_multiplier: 0.0,
    notes: ''
  })

  // Simulation states
  const [simForm, setSimForm] = useState({
    selectedEntityId: '',
    estimatedHours: 100,
    deadlineStr: '',
    weeklyAdjust: 0
  })

  const [simulationResult, setSimulationResult] = useState<any>(null)
  const [simulating, setSimulating] = useState(false)

  // Handlers
  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(capacityForm).forEach(([key, val]) => fd.append(key, String(val)))
      const res = await savePlanningCapacity(fd)
      if (res.success) router.refresh()
    })
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(goalForm).forEach(([key, val]) => fd.append(key, String(val)))
      const res = await createGoal(fd)
      if (res.success) {
        setGoalForm({ title: '', description: '', target_date: '', priority_multiplier: 1.2 })
        router.refresh()
      }
    })
  }

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Remove goal?')) return
    startTransition(async () => {
      await deleteGoal(id)
      router.refresh()
    })
  }

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.append('title', recurringForm.title)
      fd.append('description', recurringForm.description)
      fd.append('type', recurringForm.type)
      fd.append('frequency', recurringForm.frequency)
      fd.append('days_of_week', JSON.stringify(recurringForm.days_of_week))
      fd.append('estimated_minutes', String(recurringForm.estimated_minutes))
      fd.append('priority', recurringForm.priority)
      fd.append('difficulty', recurringForm.difficulty)
      fd.append('preferred_time', recurringForm.preferred_time)

      const res = await createRecurringActivity(fd)
      if (res.success) {
        setRecurringForm({
          title: '', description: '', type: 'HABIT', frequency: 'DAILY',
          days_of_week: [], estimated_minutes: 30, priority: 'MEDIUM',
          difficulty: 'MEDIUM', preferred_time: 'ANYTIME'
        })
        router.refresh()
      }
    })
  }

  const handleToggleRecurring = async (id: string, active: boolean) => {
    startTransition(async () => {
      await toggleRecurringActivity(id, active)
      router.refresh()
    })
  }

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm('Delete this routine/habit?')) return
    startTransition(async () => {
      await deleteRecurringActivity(id)
      router.refresh()
    })
  }

  const handleLogRecurring = async (activityId: string, completed: boolean, skipped: boolean) => {
    const todayStr = new Date().toISOString().split('T')[0]
    startTransition(async () => {
      await logRecurringActivity(activityId, todayStr, completed, skipped)
      router.refresh()
    })
  }

  const handleCreateFixed = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(fixedForm).forEach(([key, val]) => fd.append(key, String(val)))
      const res = await createFixedCommitment(fd)
      if (res.success) {
        setFixedForm({ title: '', description: '', scheduled_at: '', duration_minutes: 60, category: 'LECTURE' })
        router.refresh()
      }
    })
  }

  const handleDeleteFixed = async (id: string) => {
    if (!confirm('Remove fixed commitment?')) return
    startTransition(async () => {
      await deleteFixedCommitment(id)
      router.refresh()
    })
  }

  const handleCreateVacation = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(vacationForm).forEach(([key, val]) => fd.append(key, String(val)))
      const res = await createAvailabilityException(fd)
      if (res.success) {
        setVacationForm({ start_date: '', end_date: '', capacity_multiplier: 0.0, notes: '' })
        router.refresh()
      }
    })
  }

  const handleDeleteVacation = async (id: string) => {
    if (!confirm('Remove vacation mode exception?')) return
    startTransition(async () => {
      await deleteAvailabilityException(id)
      router.refresh()
    })
  }

  const runSimulation = async (e: React.FormEvent) => {
    e.preventDefault()
    setSimulating(true)
    try {
      let finalHours = simForm.estimatedHours
      let finalDeadline = simForm.deadlineStr

      if (simForm.selectedEntityId) {
        const cert = certifications.find(c => c.id === simForm.selectedEntityId)
        const proj = projects.find(p => p.id === simForm.selectedEntityId)
        if (cert) {
          finalHours = Math.max(0, Number(cert.estimated_total_hours ?? 0) - Number(cert.completed_hours ?? 0))
          finalDeadline = cert.target_exam_date || cert.exam_date || cert.target_date || ''
        } else if (proj) {
          finalHours = Math.max(0, Number(proj.estimated_total_hours ?? 0) - Number(proj.completed_hours ?? 0))
          finalDeadline = proj.target_completion_date || ''
        }
      }

      if (!finalDeadline) {
        toast('Please select an entity with a deadline or specify a custom deadline date.', 'error')
        setSimulating(false)
        return
      }

      const res = await runPlanningSimulationAction(
        finalHours,
        finalDeadline,
        Number(simForm.weeklyAdjust)
      )
      setSimulationResult(res)
    } catch (err) {
      console.error(err)
    } finally {
      setSimulating(false)
    }
  }

  // Calculate Streak & Consistency stats for active habits
  const getHabitStats = (habitId: string) => {
    const habitLogs = recurringLogs.filter(l => l.recurring_activity_id === habitId)
    const completedCount = habitLogs.filter(l => l.completed).length
    const skippedCount = habitLogs.filter(l => l.skipped).length
    
    // Simple streak check going back
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(today.getDate() - i)
      const dStr = d.toISOString().split('T')[0]
      const log = habitLogs.find(l => l.date === dStr)
      if (log && log.completed) {
        streak++
      } else if (log && log.skipped) {
        // Skips do not break streak
      } else {
        if (i > 0) break // break if not today and no log
      }
    }

    return {
      completedCount,
      skippedCount,
      streak,
      consistency: habitLogs.length > 0 ? Math.round((completedCount / habitLogs.length) * 100) : 0
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 font-sans text-slate-800 dark:text-slate-100">
      
      {/* 1. HEADER */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-4 md:flex md:items-center md:justify-between md:space-y-0">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="h-3 w-3" /> Core Planning & Capacity
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2 bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Unified Planning Center
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Your intelligent resource engine. Real-time availability balancing, simulations, and commitments tracking.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Weekly Capacity</span>
              <span className="text-lg font-black text-indigo-400">{formatHours(weeklyPlan.weeklyCapacityHours)}</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Today Allocations</span>
              <span className="text-lg font-black text-emerald-400">{formatHours(dailyPlan.totalPlannedMinutes / 60)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CAPACITY CONFLICT BANNER */}
      {conflicts.map((conflict, idx) => (
        <div key={idx} className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-4 shadow-sm animate-in slide-in-from-top">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-sm font-black text-amber-900 dark:text-amber-300 flex items-center gap-2">
              {conflict.title} <span className="px-2 py-0.5 rounded bg-amber-200/50 dark:bg-amber-900/50 text-[10px] text-amber-700 font-extrabold uppercase">Overloaded</span>
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-400/85">
              {conflict.description}
            </p>
            <div className="pt-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              💡 Suggestions:
              <ul className="list-disc pl-4 mt-1 font-semibold text-amber-800 dark:text-amber-400/80 space-y-0.5">
                {conflict.suggestions.map((s: string, sIdx: number) => <li key={sIdx}>{s}</li>)}
              </ul>
            </div>
          </div>
        </div>
      ))}

      {/* 3. TABS NAVIGATION */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'today', label: 'Today\'s Plan', icon: Clock },
          { id: 'weekly', label: 'Weekly Planner', icon: CalendarDays },
          { id: 'capacity', label: 'Capacity Workspace', icon: Settings },
          { id: 'habits', label: 'Habits & Routines', icon: Heart },
          { id: 'fixed', label: 'Fixed Commitments', icon: Calendar },
          { id: 'goals', label: 'Goals Mapping', icon: Target },
          { id: 'simulator', label: 'Simulator', icon: HelpCircle },
          { id: 'history', label: 'Audit History', icon: History }
        ].map(t => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                active 
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md' 
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* 4. TABS SUB-VIEWS */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[400px]">
        {isPending && (
          <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-950/20 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        )}

        {/* ==================== TODAY'S PLAN TABS ==================== */}
        {activeTab === 'today' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Flexible Day Allocations</h2>
              <p className="text-xs text-slate-500">Chronological slots allocated automatically for today by the planning engine.</p>
            </div>

            <div className="space-y-3">
              {dailyPlan.allocations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No allocations scheduled for today. Fill capacities or estimated hours for projects/certs!
                </div>
              ) : (
                dailyPlan.allocations.map((alloc: any, idx: number) => {
                  let typeBadgeColor = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  if (alloc.type === 'FIXED') typeBadgeColor = 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                  if (alloc.type === 'RECURRING') typeBadgeColor = 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400'
                  if (alloc.type === 'PROJECT') typeBadgeColor = 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
                  if (alloc.type === 'CERTIFICATION') typeBadgeColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'

                  return (
                    <div 
                      key={idx} 
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                          <Clock className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">{alloc.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${typeBadgeColor}`}>
                              {alloc.type}
                            </span>
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{alloc.reason}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="block text-xs font-black text-slate-950 dark:text-slate-50">{alloc.allocated_minutes}m</span>
                          <span className="block text-[9px] text-slate-400 font-extrabold uppercase">{alloc.energy_zone} energy</span>
                        </div>
                        {alloc.type === 'RECURRING' && (
                          <button
                            onClick={() => handleLogRecurring(alloc.id, false, true)}
                            title="Skip this activity today"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ==================== WEEKLY PLANNER TABS ==================== */}
        {activeTab === 'weekly' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Weekly Allocations</h2>
              <p className="text-xs text-slate-500">Distribution of available study hours for this week.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Weekly allocations list */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Hour Allocations</h3>
                {weeklyPlan.distributions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No active workload distribution this week.
                  </div>
                ) : (
                  weeklyPlan.distributions.map((dist: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">{dist.name}</span>
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {formatHours(dist.weekly_allocated_hours)} / week
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (dist.weekly_allocated_hours / Math.max(1, dist.remaining_hours)) * 100)}%` }}
                        />
                      </div>
                      <span className="block text-[10px] text-slate-400 mt-1 font-semibold">
                        Remaining: {formatHours(dist.remaining_hours)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Vacation Mode Exceptions */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-orange-500" /> Vacation Exceptions
                  </h3>
                  
                  <form onSubmit={handleCreateVacation} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Start Date</label>
                        <input
                          required
                          type="date"
                          value={vacationForm.start_date}
                          onChange={e => setVacationForm({ ...vacationForm, start_date: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">End Date</label>
                        <input
                          required
                          type="date"
                          value={vacationForm.end_date}
                          onChange={e => setVacationForm({ ...vacationForm, end_date: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Capacity Scale</label>
                        <select
                          value={vacationForm.capacity_multiplier}
                          onChange={e => setVacationForm({ ...vacationForm, capacity_multiplier: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                        >
                          <option value="0.00">0% (Full Vacation)</option>
                          <option value="0.25">25% (Minimal Work)</option>
                          <option value="0.50">50% (Half Capacity)</option>
                          <option value="0.75">75% (Relaxed Week)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Exception Notes</label>
                        <input
                          type="text"
                          placeholder="e.g. Travel, exams, holidays"
                          value={vacationForm.notes}
                          onChange={e => setVacationForm({ ...vacationForm, notes: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add Exception
                    </button>
                  </form>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-850 space-y-2">
                    {vacation.map((v: any) => (
                      <div key={v.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {v.start_date} to {v.end_date}
                          </span>
                          <span className="block text-[9px] text-slate-400 font-medium">
                            Scale: {v.capacity_multiplier * 100}% • {v.notes || 'No description'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteVacation(v.id)}
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== CAPACITY WORKSPACE TABS ==================== */}
        {activeTab === 'capacity' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Capacity Preferences</h2>
              <p className="text-xs text-slate-500">Configure daily hour limits, sleep windows, focus sizes, and energy profiles.</p>
            </div>

            <form onSubmit={handleSaveCapacity} className="space-y-6">
              
              {/* Daily hours limits Mon - Sun */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Daily Study Limits (hours)</h3>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    { id: 'monday_hours', label: 'Mon' },
                    { id: 'tuesday_hours', label: 'Tue' },
                    { id: 'wednesday_hours', label: 'Wed' },
                    { id: 'thursday_hours', label: 'Thu' },
                    { id: 'friday_hours', label: 'Fri' },
                    { id: 'saturday_hours', label: 'Sat' },
                    { id: 'sunday_hours', label: 'Sun' }
                  ].map(day => (
                    <div key={day.id} className="text-center">
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">{day.label}</label>
                      <input
                        required
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={capacityForm[day.id as keyof typeof capacityForm]}
                        onChange={e => setCapacityForm({ ...capacityForm, [day.id]: Number(e.target.value) })}
                        className="w-full text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-1 py-2 text-xs font-bold focus:border-indigo-500 outline-none dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-750 dark:text-slate-350 mb-1">Max Weekly Target (hrs)</label>
                  <input
                    required
                    type="number"
                    value={capacityForm.maximum_weekly_hours}
                    onChange={e => setCapacityForm({ ...capacityForm, maximum_weekly_hours: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs font-semibold focus:border-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-750 dark:text-slate-350 mb-1">Preferred Block (mins)</label>
                  <input
                    required
                    type="number"
                    step="15"
                    value={capacityForm.preferred_focus_block}
                    onChange={e => setCapacityForm({ ...capacityForm, preferred_focus_block: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs font-semibold focus:border-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-750 dark:text-slate-350 mb-1">Minimum Break (mins)</label>
                  <input
                    required
                    type="number"
                    value={capacityForm.minimum_break}
                    onChange={e => setCapacityForm({ ...capacityForm, minimum_break: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs font-semibold focus:border-indigo-500 outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-755 mb-1">Preferred Start</label>
                  <input
                    required
                    type="time"
                    value={capacityForm.preferred_start_time}
                    onChange={e => setCapacityForm({ ...capacityForm, preferred_start_time: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs font-semibold focus:border-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-755 mb-1">Preferred End</label>
                  <input
                    required
                    type="time"
                    value={capacityForm.preferred_end_time}
                    onChange={e => setCapacityForm({ ...capacityForm, preferred_end_time: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs font-semibold focus:border-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-755 mb-1">Energy Profile</label>
                  <select
                    value={capacityForm.energy_profile}
                    onChange={e => setCapacityForm({ ...capacityForm, energy_profile: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs font-semibold focus:border-indigo-500 outline-none dark:text-white"
                  >
                    <option value="MORNING">Morning Person</option>
                    <option value="BALANCED">Balanced Profile</option>
                    <option value="NIGHT_OWL">Night Owl</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* ==================== HABITS & ROUTINES TABS ==================== */}
        {activeTab === 'habits' && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Habits & Routines</h2>
                <p className="text-xs text-slate-500">Manage permanent repeating commitments and check daily logs.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form creation */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Add Repeating Routine</h3>
                <form onSubmit={handleCreateRecurring} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Solve LeetCode problem"
                      value={recurringForm.title}
                      onChange={e => setRecurringForm({ ...recurringForm, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="Goal or instruction"
                      value={recurringForm.description}
                      onChange={e => setRecurringForm({ ...recurringForm, description: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                      <select
                        value={recurringForm.type}
                        onChange={e => setRecurringForm({ ...recurringForm, type: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                      >
                        <option value="HABIT">HABIT</option>
                        <option value="ROUTINE">ROUTINE</option>
                        <option value="CHALLENGE">CHALLENGE</option>
                        <option value="PRACTICE">PRACTICE</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Frequency</label>
                      <select
                        value={recurringForm.frequency}
                        onChange={e => setRecurringForm({ ...recurringForm, frequency: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                      >
                        <option value="DAILY">DAILY</option>
                        <option value="WEEKLY">WEEKLY</option>
                      </select>
                    </div>
                  </div>

                  {recurringForm.frequency === 'WEEKLY' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Days of Week</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => {
                          const isSelected = recurringForm.days_of_week.includes(day)
                          return (
                            <button
                              type="button"
                              key={day}
                              onClick={() => {
                                const nextDays = isSelected
                                  ? recurringForm.days_of_week.filter(d => d !== day)
                                  : [...recurringForm.days_of_week, day]
                                setRecurringForm({ ...recurringForm, days_of_week: nextDays })
                              }}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estimated Mins</label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        value={recurringForm.estimated_minutes}
                        onChange={e => setRecurringForm({ ...recurringForm, estimated_minutes: Number(e.target.value) })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Time Profile</label>
                      <select
                        value={recurringForm.preferred_time}
                        onChange={e => setRecurringForm({ ...recurringForm, preferred_time: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                      >
                        <option value="MORNING">Morning</option>
                        <option value="AFTERNOON">Afternoon</option>
                        <option value="EVENING">Evening</option>
                        <option value="ANYTIME">Anytime</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Add Routine
                  </button>
                </form>
              </div>

              {/* Listings */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Active Rutines & Streaks</h3>
                <div className="space-y-3">
                  {recurring.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No routine commitments created yet. Add one on the left!
                    </div>
                  ) : (
                    recurring.map(rec => {
                      const stats = getHabitStats(rec.id)
                      const isLoggedToday = recurringLogs.some(
                        l => l.recurring_activity_id === rec.id && l.date === new Date().toISOString().split('T')[0]
                      )
                      return (
                        <div key={rec.id} className="p-4 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rec.title}</h4>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[8px] font-bold text-slate-500 uppercase">
                                {rec.type}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">{rec.description || 'No description'}</p>
                            
                            <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 font-medium">
                              <span>⏱ {rec.estimated_minutes} mins</span>
                              <span>🔥 Streak: {stats.streak} days</span>
                              <span>📈 Consistency: {stats.consistency}%</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleLogRecurring(rec.id, true, false)}
                              disabled={isLoggedToday}
                              className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isLoggedToday 
                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
                              }`}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecurring(rec.id)}
                              className="p-1 rounded text-slate-450 hover:text-red-500 cursor-pointer"
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
        )}

        {/* ==================== FIXED COMMITMENTS TABS ==================== */}
        {activeTab === 'fixed' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fixed Commitments</h2>
              <p className="text-xs text-slate-500">University lectures, office work hours, and calendar blocks that cannot be overridden.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form creation */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Log Fixed Block</h3>
                <form onSubmit={handleCreateFixed} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Midterm exam / Office hours"
                      value={fixedForm.title}
                      onChange={e => setFixedForm({ ...fixedForm, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Scheduled Date & Time</label>
                    <input
                      required
                      type="datetime-local"
                      value={fixedForm.scheduled_at}
                      onChange={e => setFixedForm({ ...fixedForm, scheduled_at: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duration (mins)</label>
                      <input
                        required
                        type="number"
                        min="10"
                        value={fixedForm.duration_minutes}
                        onChange={e => setFixedForm({ ...fixedForm, duration_minutes: Number(e.target.value) })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                      <select
                        value={fixedForm.category}
                        onChange={e => setFixedForm({ ...fixedForm, category: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                      >
                        <option value="LECTURE">LECTURE</option>
                        <option value="OFFICE">OFFICE</option>
                        <option value="MEETING">MEETING</option>
                        <option value="TRAVEL">TRAVEL</option>
                        <option value="FAMILY">FAMILY</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Lock Time Slot
                  </button>
                </form>
              </div>

              {/* Listings */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Scheduled Fixed Commitments</h3>
                <div className="space-y-2">
                  {fixed.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No fixed commitments scheduled.
                    </div>
                  ) : (
                    fixed.map(f => (
                      <div key={f.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-slate-200">{f.title}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            ⏰ {new Date(f.scheduled_at).toLocaleString()} • ⏱ {f.duration_minutes}m • [{f.category}]
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteFixed(f.id)}
                          className="p-1 rounded text-slate-450 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== GOALS MAPPING TABS ==================== */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Goal-Based Prioritization</h2>
              <p className="text-xs text-slate-500">Define high-level goals and apply multiplier boosts to related projects or certifications.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form creation */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Create Goal Pointer</h3>
                <form onSubmit={handleCreateGoal} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Goal Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Become Cloud Security Specialist"
                      value={goalForm.title}
                      onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="Brief outcome description"
                      value={goalForm.description}
                      onChange={e => setGoalForm({ ...goalForm, description: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Date</label>
                      <input
                        type="date"
                        value={goalForm.target_date}
                        onChange={e => setGoalForm({ ...goalForm, target_date: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Booster Multiplier</label>
                      <input
                        required
                        type="number"
                        min="1.0"
                        max="3.0"
                        step="0.1"
                        value={goalForm.priority_multiplier}
                        onChange={e => setGoalForm({ ...goalForm, priority_multiplier: Number(e.target.value) })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Add Goal
                  </button>
                </form>
              </div>

              {/* Listings */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Active Goals</h3>
                <div className="space-y-3">
                  {goals.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No high-level goals defined. Create one on the left to prioritize related work!
                    </div>
                  ) : (
                    goals.map(g => (
                      <div key={g.id} className="p-4 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">{g.title}</h4>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400 text-[8px] font-extrabold">
                              BOOST: {g.priority_multiplier}x
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{g.description || 'No description'}</p>
                          {g.target_date && (
                            <span className="block text-[9px] text-slate-400 font-bold mt-1">
                              📅 Target: {g.target_date}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="p-1 rounded text-slate-450 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== SIMULATOR TABS ==================== */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Planning Simulator Engine</h2>
              <p className="text-xs text-slate-500">Run sandbox simulations to evaluate deadline feasibilities before modifying active schedules.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form */}
              <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Configure Sandbox</h3>
                
                <form onSubmit={runSimulation} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                      Select Project / Certification to Test
                    </label>
                    <select
                      value={simForm.selectedEntityId}
                      onChange={e => setSimForm({ ...simForm, selectedEntityId: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs font-semibold focus:border-indigo-500 outline-none dark:text-white"
                    >
                      <option value="">-- Run Custom Simulation --</option>
                      <optgroup label="Active Certifications">
                        {certifications.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </optgroup>
                      <optgroup label="Active Projects">
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </optgroup>
                    </select>
                  </div>

                  {!simForm.selectedEntityId && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estimated Hours</label>
                        <input
                          type="number"
                          value={simForm.estimatedHours}
                          onChange={e => setSimForm({ ...simForm, estimatedHours: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Deadline</label>
                        <input
                          type="date"
                          value={simForm.deadlineStr}
                          onChange={e => setSimForm({ ...simForm, deadlineStr: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                      Hypothetical Weekly Capacity Adjustment
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="1"
                        value={simForm.weeklyAdjust}
                        onChange={e => setSimForm({ ...simForm, weeklyAdjust: Number(e.target.value) })}
                        className="flex-1 accent-indigo-650"
                      />
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 w-16 text-right">
                        {simForm.weeklyAdjust > 0 ? `+${simForm.weeklyAdjust}` : simForm.weeklyAdjust} hrs/wk
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={simulating}
                    className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                    Simulate Plan
                  </button>
                </form>
              </div>

              {/* Simulation Result */}
              <div>
                {simulationResult ? (
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Simulation Projections</h3>
                    
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3 bg-white dark:bg-slate-850 rounded-2xl shadow-sm border border-slate-150">
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Weekly Target</span>
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatHours(simulationResult.weeklyHoursRequired)}</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-850 rounded-2xl shadow-sm border border-slate-150">
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Feasible?</span>
                        <span className={`text-xl font-black ${simulationResult.feasible ? 'text-emerald-500' : 'text-red-500'}`}>
                          {simulationResult.feasible ? 'YES' : 'NO'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Completion Probability</span>
                        <span>{simulationResult.completionProbability}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-850 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full ${
                            simulationResult.completionProbability > 80 ? 'bg-emerald-500' : (simulationResult.completionProbability > 50 ? 'bg-amber-500' : 'bg-red-500')
                          }`}
                          style={{ width: `${simulationResult.completionProbability}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-150/60 dark:border-slate-800/80 text-xs leading-relaxed text-slate-600 dark:text-slate-350">
                      💡 <span className="font-extrabold">Recommendation:</span> {simulationResult.recommendation}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center border border-dashed border-slate-250 rounded-3xl p-8 text-center text-slate-400 text-xs">
                    Configure the sandbox on the left and click "Simulate Plan" to render projections.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ==================== AUDIT HISTORY TABS ==================== */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Planning Decision Log</h2>
              <p className="text-xs text-slate-500">History log tracking when the planning engine rebalances work allocations.</p>
            </div>

            <div className="relative border-l border-slate-250 dark:border-slate-800 ml-4 pl-6 space-y-6">
              {decisions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No automated planning logs found. Rebalancing occurs on page loads or mutations.
                </div>
              ) : (
                decisions.map(d => (
                  <div key={d.id} className="relative">
                    <span className="absolute -left-[31px] top-1 bg-white dark:bg-slate-950 p-0.5 rounded-full border-2 border-indigo-650">
                      <Activity className="h-3 w-3 text-indigo-650" />
                    </span>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                        {new Date(d.created_at).toLocaleString()}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{d.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{d.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
