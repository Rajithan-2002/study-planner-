'use server'

import { createClient, getCurrentUserId } from '@/utils/supabase/server'

// Calculate Urgency Score (0-100) based on days to deadline
function calculateUrgency(targetDate: string | null): number {
  if (!targetDate) return 0
  const now = new Date()
  const target = new Date(targetDate)
  const diffTime = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 100 // Overdue
  if (diffDays === 0) return 95 // Today
  if (diffDays <= 3) return 80
  if (diffDays <= 7) return 60
  if (diffDays <= 14) return 40
  if (diffDays <= 30) return 20
  return 10
}

// Calculate Priority Multiplier
function getPriorityMultiplier(priority: string | null): number {
  switch (priority) {
    case 'CRITICAL': return 1.5
    case 'HIGH': return 1.2
    case 'MEDIUM': return 1.0
    case 'LOW': return 0.8
    default: return 1.0
  }
}

export async function getDashboardData() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    // 1. Fetch User Profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    // 2. Fetch all modules, projects, certifications, tasks, events, curriculum, milestones
    const { data: allModules } = await supabase.from('modules').select('*').eq('user_id', userId)
    const { data: allProjects } = await supabase.from('projects').select('*').eq('user_id', userId)
    const { data: allCerts } = await supabase.from('certifications').select('*').eq('user_id', userId)
    const { data: allTasks } = await supabase.from('tasks').select('*').eq('user_id', userId)
    const { data: allEvents } = await supabase.from('life_events').select('*').eq('user_id', userId)
    const { data: curriculum } = await supabase.from('curriculum_modules').select('credits')
    const { data: allMilestones } = await supabase.from('project_milestones').select('*')

    const modules = allModules || []
    const projects = allProjects || []
    const certs = allCerts || []
    const tasks = allTasks || []
    const events = allEvents || []
    const milestones = allMilestones || []
    const catalogTotalCredits = (curriculum || []).reduce((sum, m) => sum + (m.credits || 0), 0)
    const creditsTotal = catalogTotalCredits > 0 ? catalogTotalCredits : 120

    // 3. Today's Classes Timetable
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    let todaysClasses: any[] = []

    const ongoingModuleIds = modules.filter(m => m.status === 'ONGOING').map(m => m.id)
    if (ongoingModuleIds.length > 0) {
      const { data: sessions } = await supabase
        .from('timetable_sessions')
        .select('*')
        .in('module_id', ongoingModuleIds)
        .eq('day', todayStr)

      todaysClasses = (sessions || []).map(session => ({
        ...session,
        module: modules.find(m => m.id === session.module_id)
      })).sort((a, b) => a.start_time.localeCompare(b.start_time))
    }

    // 4. Focus Items / Top Priorities (Aggregated and sorted by score)
    let focusItems: any[] = []

    // Tasks Focus
    tasks.filter(t => t.status !== 'COMPLETED').forEach(t => {
      const urgency = calculateUrgency(t.due_date)
      const score = urgency * getPriorityMultiplier(t.priority)
      const isOverdue = t.due_date ? new Date(t.due_date) < new Date() : false
      const subtitle = isOverdue ? 'OVERDUE' : t.due_date ? `Due in ${Math.ceil((new Date(t.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days` : 'No deadline'
      focusItems.push({
        type: 'TASK',
        title: t.title,
        subtitle,
        score: score || 10,
        isOverdue
      })
    })

    // Events Focus
    events.forEach(e => {
      const urgency = calculateUrgency(e.event_date)
      const score = urgency * 1.3
      const isOverdue = new Date(e.event_date) < new Date()
      const subtitle = isOverdue ? 'EVENT PASSED' : `${e.type} on ${new Date(e.event_date).toLocaleDateString()}`
      focusItems.push({
        type: e.type,
        title: e.title,
        subtitle,
        score,
        isOverdue
      })
    })

    // Sort focus items by score descending
    focusItems.sort((a, b) => b.score - a.score)

    // 5. Timeline Events (Next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const timelineEvents = events
      .filter(e => {
        const d = new Date(e.event_date)
        return d >= new Date() && d <= nextWeek
      })
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

    // 6. Academic Stats
    const creditsCompleted = modules
      .filter(m => m.status === 'COMPLETED')
      .reduce((sum, m) => sum + (m.credits || 0), 0)

    // Calculate Highest Risk Module based on ongoing assignments
    let highestRiskModule = 'None'
    const ongoingModules = modules.filter(m => m.status === 'ONGOING')
    if (ongoingModules.length > 0) {
      const criticalModule = ongoingModules.find(m => m.priority === 'CRITICAL' || m.priority === 'HIGH')
      highestRiskModule = criticalModule ? criticalModule.code : (ongoingModules[0]?.code || 'None')
    }

    // 7. Projects Stats via Platform Dashboard Aggregator
    const { DashboardAggregator } = await import('@/lib/platform/dashboard/dashboard-aggregator')
    const snapshot = await DashboardAggregator.getSnapshot(userId)

    // 8. Certification Stats
    const activeCerts = certs.filter(c => c.status === 'ACTIVE')

    // Find next exam date
    let nextExamCert: any = null
    let minDiff = Infinity
    activeCerts.forEach(c => {
      if (c.exam_date) {
        const diff = new Date(c.exam_date).getTime() - new Date().getTime()
        if (diff > 0 && diff < minDiff) {
          minDiff = diff
          nextExamCert = c
        }
      }
    })

    const daysRemaining = nextExamCert && nextExamCert.exam_date
      ? Math.max(0, Math.ceil((new Date(nextExamCert.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : null

    // Readiness Score based on associated tasks completion rate
    let totalReadiness = 0
    if (activeCerts.length > 0) {
      activeCerts.forEach(c => {
        const certTasks = tasks.filter(t => t.related_entity_type === 'CERTIFICATION' && t.related_entity_id === c.id)
        if (certTasks.length === 0) {
          if (c.exam_date) {
            const days = Math.ceil((new Date(c.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            totalReadiness += Math.max(30, Math.min(95, 100 - days * 2))
          } else {
            totalReadiness += 50
          }
        } else {
          const completed = certTasks.filter(t => t.status === 'COMPLETED').length
          totalReadiness += (completed / certTasks.length) * 100
        }
      })
    }
    const readinessScore = activeCerts.length > 0 ? Math.round(totalReadiness / activeCerts.length) : 0

    // 9. Load Planning Capacity metrics
    const { PlanningCapacityEngine } = await import('@/lib/planning/engine')
    const remainingWorkItems = await PlanningCapacityEngine.calculateRemainingWork(userId)
    const activePlanningItems = remainingWorkItems.filter(i => i.remaining_hours > 0)

    const totalRemainingHours = activePlanningItems.reduce((sum, i) => sum + i.remaining_hours, 0)
    const totalEstimatedHours = activePlanningItems.reduce((sum, i) => sum + i.estimated_total_hours, 0)

    const dailyPlan = await PlanningCapacityEngine.buildDailyStudyPlan(userId)
    const todayRecommendedHours = Math.round((dailyPlan.totalPlannedMinutes / 60) * 10) / 10

    const capacities = await PlanningCapacityEngine.getCapacityPreferences(userId)
    const weeklyCapacityHours =
      capacities.monday_hours + capacities.tuesday_hours + capacities.wednesday_hours +
      capacities.thursday_hours + capacities.friday_hours + capacities.saturday_hours + capacities.sunday_hours

    const conflicts = await PlanningCapacityEngine.detectCapacityConflicts(userId)
    const planningHealth = conflicts.length > 0 ? Math.max(20, 100 - conflicts.length * 30) : 100

    let totalProbability = 0
    let countWithDeadlines = 0
    activePlanningItems.forEach(item => {
      if (item.deadline) {
        const daysLeft = Math.ceil((new Date(item.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        if (daysLeft > 0) {
          totalProbability += PlanningCapacityEngine.estimateCompletionProbability(item.remaining_hours, daysLeft, weeklyCapacityHours)
          countWithDeadlines++
        }
      }
    })
    const averageCompletionProbability = countWithDeadlines > 0 ? Math.round(totalProbability / countWithDeadlines) : 95

    // 10. Fetch pending actions count and recent logs summary
    const { count: pendingActionsCount } = await supabase
      .from('ai_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['WAITING_CONFIRMATION', 'PROPOSED'])

    const { data: recentLogs } = await supabase
      .from('action_execution_logs')
      .select('step_name, status, created_at, ai_actions!inner(user_id)')
      .eq('ai_actions.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    return {
      todaysClasses,
      focusItems: focusItems.slice(0, 5),
      timelineEvents,
      userProfile: snapshot.academic?.profile || userProfile,
      academicStats: {
        currentGpa: snapshot.academic?.gpa ?? userProfile?.current_gpa ?? 0,
        targetGpa: snapshot.academic?.profile?.target_gpa ?? userProfile?.target_gpa ?? 0,
        creditsCompleted,
        creditsTotal,
        highestRiskModule
      },
      projectStats: {
        activeCount: snapshot.projects?.activeCount ?? 0,
        overdueCount: snapshot.projects?.overdueCount ?? 0,
        healthScore: snapshot.projects?.averageProgress ?? 100
      },
      certStats: {
        activeCount: activeCerts.length,
        daysRemaining,
        nextExamDate: nextExamCert?.exam_date || null,
        readinessScore
      },
      automationStats: {
        pendingCount: pendingActionsCount || 0,
        recentLogs: recentLogs || []
      },
      planningStats: {
        totalRemainingHours,
        totalEstimatedHours,
        todayRecommendedHours,
        weeklyCapacityHours,
        planningHealth,
        averageCompletionProbability,
        dailyPlanAllocations: dailyPlan.allocations,
        conflicts
      }
    }
  } catch (err: any) {
    console.error('getDashboardData exception:', err)
    return {
      todaysClasses: [],
      focusItems: [],
      timelineEvents: [],
      userProfile: null,
      academicStats: { currentGpa: 0, targetGpa: 0, creditsCompleted: 0, creditsTotal: 120, highestRiskModule: 'None' },
      projectStats: { activeCount: 0, overdueCount: 0, healthScore: 100 },
      certStats: { activeCount: 0, daysRemaining: null, nextExamDate: null, readinessScore: 0 },
      automationStats: { pendingCount: 0, recentLogs: [] },
      heatMap: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => ({ day: d, count: 0 }))
    }
  }
}

