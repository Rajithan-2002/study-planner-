import { createClient } from '@/utils/supabase/server'

export interface PlanningItem {
  id: string
  name: string
  type: 'PROJECT' | 'CERTIFICATION' | 'ASSIGNMENT' | 'EXAM' | 'TASK'
  estimated_total_hours: number
  completed_hours: number
  remaining_hours: number
  deadline?: string
  priority: string
  difficulty: string
  flexible_schedule: boolean
  goal_id?: string | null
  priority_multiplier?: number
}

export interface CapacityPreferences {
  monday_hours: number
  tuesday_hours: number
  wednesday_hours: number
  thursday_hours: number
  friday_hours: number
  saturday_hours: number
  sunday_hours: number
  preferred_focus_block: number
  minimum_break: number
  maximum_weekly_hours: number
  preferred_start_time: string
  preferred_end_time: string
  sleep_time: string
  wake_time: string
  energy_profile: 'MORNING' | 'BALANCED' | 'NIGHT_OWL'
}

export class PlanningCapacityEngine {
  
  // 1. Fetch capacity preferences
  static async getCapacityPreferences(userId: string): Promise<CapacityPreferences> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('planning_capacity')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) {
      return {
        monday_hours: 4.0,
        tuesday_hours: 4.0,
        wednesday_hours: 4.0,
        thursday_hours: 4.0,
        friday_hours: 4.0,
        saturday_hours: 8.0,
        sunday_hours: 6.0,
        preferred_focus_block: 90,
        minimum_break: 15,
        maximum_weekly_hours: 32.0,
        preferred_start_time: '08:00',
        preferred_end_time: '22:00',
        sleep_time: '23:00',
        wake_time: '07:00',
        energy_profile: 'BALANCED'
      }
    }

    return {
      monday_hours: Number(data.monday_hours ?? 4.0),
      tuesday_hours: Number(data.tuesday_hours ?? 4.0),
      wednesday_hours: Number(data.wednesday_hours ?? 4.0),
      thursday_hours: Number(data.thursday_hours ?? 4.0),
      friday_hours: Number(data.friday_hours ?? 4.0),
      saturday_hours: Number(data.saturday_hours ?? 8.0),
      sunday_hours: Number(data.sunday_hours ?? 6.0),
      preferred_focus_block: Number(data.preferred_focus_block ?? 90),
      minimum_break: Number(data.minimum_break ?? 15),
      maximum_weekly_hours: Number(data.maximum_weekly_hours ?? 32.0),
      preferred_start_time: data.preferred_start_time || '08:00',
      preferred_end_time: data.preferred_end_time || '22:00',
      sleep_time: data.sleep_time || '23:00',
      wake_time: data.wake_time || '07:00',
      energy_profile: data.energy_profile || 'BALANCED'
    }
  }

  // 2. Fetch and calculate remaining work for all entities
  static async calculateRemainingWork(userId: string): Promise<PlanningItem[]> {
    const supabase = await createClient()

    // Query active projects, certifications, assignments, exams, and general tasks
    const [projectsRes, certsRes, assignmentsRes, examsRes, tasksRes, goalsRes] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', userId).eq('is_archived', false).neq('status', 'COMPLETED'),
      supabase.from('certifications').select('*').eq('user_id', userId).eq('is_archived', false).eq('status', 'ACTIVE'),
      supabase.from('assignments').select('*, modules!inner(user_id)').eq('modules.user_id', userId).eq('status', 'PENDING'),
      supabase.from('exams').select('*, modules!inner(user_id)').eq('modules.user_id', userId).eq('status', 'PENDING'),
      supabase.from('tasks').select('*').eq('user_id', userId).eq('status', 'PENDING'),
      supabase.from('goals').select('id, priority_multiplier').eq('user_id', userId)
    ])

    const goalMultipliers = new Map<string, number>()
    if (goalsRes.data) {
      goalsRes.data.forEach(g => goalMultipliers.set(g.id, Number(g.priority_multiplier ?? 1.0)))
    }

    const items: PlanningItem[] = []

    // Map projects
    if (projectsRes.data) {
      projectsRes.data.forEach(p => {
        const est = Number(p.estimated_total_hours ?? 0)
        const comp = Number(p.completed_hours ?? 0)
        const goalMult = p.goal_id ? goalMultipliers.get(p.goal_id) : 1.0
        items.push({
          id: p.id,
          name: p.name,
          type: 'PROJECT',
          estimated_total_hours: est,
          completed_hours: comp,
          remaining_hours: Math.max(0, est - comp),
          deadline: p.target_completion_date || undefined,
          priority: p.priority || 'MEDIUM',
          difficulty: p.difficulty || 'MEDIUM',
          flexible_schedule: p.flexible_schedule ?? true,
          goal_id: p.goal_id,
          priority_multiplier: goalMult
        })
      })
    }

    // Map certifications
    if (certsRes.data) {
      certsRes.data.forEach(c => {
        const est = Number(c.estimated_total_hours ?? 0)
        const comp = Number(c.completed_hours ?? 0)
        const goalMult = c.goal_id ? goalMultipliers.get(c.goal_id) : 1.0
        items.push({
          id: c.id,
          name: c.name,
          type: 'CERTIFICATION',
          estimated_total_hours: est,
          completed_hours: comp,
          remaining_hours: Math.max(0, est - comp),
          deadline: c.target_exam_date || c.exam_date || c.target_date || undefined,
          priority: c.priority || 'MEDIUM',
          difficulty: c.difficulty || 'MEDIUM',
          flexible_schedule: c.flexible_schedule ?? true,
          goal_id: c.goal_id,
          priority_multiplier: goalMult
        })
      })
    }

    // Map academic assignments
    if (assignmentsRes.data) {
      assignmentsRes.data.forEach(a => {
        const est = Number(a.estimated_total_hours ?? 0)
        const comp = Number(a.completed_hours ?? 0)
        const goalMult = a.goal_id ? goalMultipliers.get(a.goal_id) : 1.0
        items.push({
          id: a.id,
          name: a.name,
          type: 'ASSIGNMENT',
          estimated_total_hours: est,
          completed_hours: comp,
          remaining_hours: Math.max(0, est - comp),
          deadline: a.deadline || undefined,
          priority: a.priority || 'MEDIUM',
          difficulty: a.difficulty || 'MEDIUM',
          flexible_schedule: true,
          goal_id: a.goal_id,
          priority_multiplier: goalMult
        })
      })
    }

    // Map academic exams
    if (examsRes.data) {
      examsRes.data.forEach(e => {
        const est = Number(e.estimated_total_hours ?? 0)
        const comp = Number(e.completed_hours ?? 0)
        items.push({
          id: e.id,
          name: e.name,
          type: 'EXAM',
          estimated_total_hours: est,
          completed_hours: comp,
          remaining_hours: Math.max(0, est - comp),
          deadline: e.exam_date || undefined,
          priority: e.priority || 'MEDIUM',
          difficulty: e.difficulty || 'MEDIUM',
          flexible_schedule: true,
          goal_id: e.goal_id
        })
      })
    }

    // Map general tasks
    if (tasksRes.data) {
      tasksRes.data.forEach(t => {
        const est = Number(t.estimated_total_hours ?? 1.5) // default 1.5h for normal tasks
        const comp = Number(t.completed_hours ?? 0)
        const goalMult = t.goal_id ? goalMultipliers.get(t.goal_id) : 1.0
        items.push({
          id: t.id,
          name: t.title,
          type: 'TASK',
          estimated_total_hours: est,
          completed_hours: comp,
          remaining_hours: Math.max(0, est - comp),
          deadline: t.due_date || undefined,
          priority: t.priority || 'MEDIUM',
          difficulty: 'MEDIUM',
          flexible_schedule: true,
          goal_id: t.goal_id,
          priority_multiplier: goalMult
        })
      })
    }

    return items
  }

  // 3. Compute priority weights (with Goal boosting)
  static calculatePriorityWeights(item: PlanningItem): number {
    let score = 0

    // Priority Score
    switch (item.priority.toUpperCase()) {
      case 'CRITICAL': score += 50; break
      case 'HIGH': score += 35; break
      case 'MEDIUM': score += 20; break
      case 'LOW': score += 10; break
    }

    // Difficulty Score
    switch (item.difficulty.toUpperCase()) {
      case 'HARD': score += 15; break
      case 'MEDIUM': score += 10; break
      case 'EASY': score += 5; break
    }

    // Deadline Proximity Score
    if (item.deadline) {
      const daysLeft = Math.ceil((new Date(item.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft < 0) {
        score += 100
      } else if (daysLeft === 0) {
        score += 90
      } else if (daysLeft <= 3) {
        score += 70
      } else if (daysLeft <= 7) {
        score += 50
      } else if (daysLeft <= 30) {
        score += 25
      } else {
        score += 5
      }
    } else {
      score += 10
    }

    // Boost with Goal multiplier
    if (item.priority_multiplier) {
      score = score * item.priority_multiplier
    }

    return Math.round(score)
  }

  // 4. Calculate dynamic daily requirement
  static calculateDailyRequirement(remainingHours: number, deadline?: string): number {
    if (!deadline) return 0
    const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 0) return remainingHours
    return Math.round((remainingHours / daysLeft) * 10) / 10
  }

  // 5. Estimate probability of completion
  static estimateCompletionProbability(remainingHours: number, daysLeft: number, weeklyCapacity: number): number {
    if (remainingHours <= 0) return 100
    if (daysLeft <= 0) return 0
    const expectedAvailableHours = (daysLeft / 7) * weeklyCapacity
    return Math.min(100, Math.max(0, Math.round((expectedAvailableHours / remainingHours) * 100)))
  }

  // 6. Build flexible daily study plan incorporating 7-layer priority logic
  static async buildDailyStudyPlan(userId: string): Promise<{
    date: string
    availableCapacityHours: number
    allocations: Array<{
      id: string
      name: string
      type: string
      allocated_minutes: number
      reason: string
      energy_zone: string
    }>
    totalPlannedMinutes: number
    remainingMinutes: number
  }> {
    const supabase = await createClient()
    const capacities = await this.getCapacityPreferences(userId)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const weekdayUpper = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() // 'MONDAY', etc.
    const weekdayLower = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() // 'monday', etc.

    // Layer 0: Vacation Mode Exceptions check
    const { data: vacation } = await supabase
      .from('availability_exceptions')
      .select('capacity_multiplier')
      .eq('user_id', userId)
      .lte('start_date', todayStr)
      .gte('end_date', todayStr)
      .maybeSingle()

    const capacityMultiplier = vacation ? Number(vacation.capacity_multiplier ?? 0.0) : 1.0

    // Fetch capacity hour for this day
    let baseCapacityHours = 4.0
    switch (weekdayLower) {
      case 'monday': baseCapacityHours = capacities.monday_hours; break
      case 'tuesday': baseCapacityHours = capacities.tuesday_hours; break
      case 'wednesday': baseCapacityHours = capacities.wednesday_hours; break
      case 'thursday': baseCapacityHours = capacities.thursday_hours; break
      case 'friday': baseCapacityHours = capacities.friday_hours; break
      case 'saturday': baseCapacityHours = capacities.saturday_hours; break
      case 'sunday': baseCapacityHours = capacities.sunday_hours; break
    }
    const finalCapacityHours = baseCapacityHours * capacityMultiplier
    let capacityMinutes = finalCapacityHours * 60
    
    const allocations: any[] = []
    let totalPlannedMinutes = 0

    // LAYER 1: Fixed Commitments
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()
    const { data: fixed } = await supabase
      .from('fixed_commitments')
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_at', startOfDay)
      .lte('scheduled_at', endOfDay)

    if (fixed) {
      fixed.forEach(f => {
        const mins = Number(f.duration_minutes ?? 60)
        allocations.push({
          id: f.id,
          name: f.title,
          type: 'FIXED',
          allocated_minutes: mins,
          reason: `Fixed commitment (${f.category})`,
          energy_zone: 'anytime'
        })
        totalPlannedMinutes += mins
      })
    }
    capacityMinutes = Math.max(0, capacityMinutes - totalPlannedMinutes)

    // LAYER 1.5: Timetable Lectures / Classes
    const { data: activeSemesters } = await supabase.from('academic_semesters').select('id').eq('user_id', userId)
    if (activeSemesters && activeSemesters.length > 0) {
      const { data: modules } = await supabase.from('modules').select('id, name, code').in('semester_id', activeSemesters.map(s => s.id)).eq('user_id', userId)
      if (modules && modules.length > 0) {
        const todayWeekday = today.toLocaleDateString('en-US', { weekday: 'long' })
        const { data: sessionsToday } = await supabase
          .from('timetable_sessions')
          .select('*')
          .in('module_id', modules.map(m => m.id))
          .eq('day', todayWeekday)
          
        if (sessionsToday && sessionsToday.length > 0) {
          sessionsToday.forEach(session => {
            const mod = modules.find(m => m.id === session.module_id)
            const label = mod ? `${mod.code} - ${mod.name}` : session.code || 'Lecture'
            
            // Calculate duration in minutes
            let mins = 120 // default 2 hours
            if (session.start_time && session.end_time) {
              try {
                const [sh, sm] = session.start_time.split(':').map(Number)
                const [eh, em] = session.end_time.split(':').map(Number)
                mins = (eh * 60 + em) - (sh * 60 + sm)
              } catch (e) {
                // Keep default
              }
            }
            
            allocations.push({
              id: session.id,
              name: label,
              type: 'LECTURE',
              allocated_minutes: mins,
              reason: `Lecture: ${session.session_type || 'Class'} at ${session.location || 'University'}`,
              energy_zone: 'anytime'
            })
            totalPlannedMinutes += mins
            capacityMinutes = Math.max(0, capacityMinutes - mins)
          })
        }
      }
    }

    // LAYER 2: Recurring Activities (subtracting skipped logs)
    const { data: recurring } = await supabase
      .from('recurring_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)

    if (recurring && recurring.length > 0) {
      const { data: recLogs } = await supabase
        .from('recurring_activity_logs')
        .select('*')
        .in('recurring_activity_id', recurring.map(r => r.id))
        .eq('date', todayStr)

      recurring.forEach(r => {
        const matchesDay = r.frequency === 'DAILY' || (r.frequency === 'WEEKLY' && r.days_of_week?.includes(weekdayUpper))
        if (!matchesDay) return

        const log = recLogs?.find(l => l.recurring_activity_id === r.id)
        if (log?.skipped) return // recycled/skipped activity frees up capacity

        const mins = Number(r.estimated_minutes ?? 30)
        allocations.push({
          id: r.id,
          name: r.title,
          type: 'RECURRING',
          allocated_minutes: mins,
          reason: `Recurring ${r.type.toLowerCase()}`,
          energy_zone: r.preferred_time?.toLowerCase() || 'anytime'
        })
        totalPlannedMinutes += mins
        capacityMinutes = Math.max(0, capacityMinutes - mins)
      })
    }

    // LAYERS 3-6: Flexible Work Allocation (Academic -> Projects -> Certs -> General Tasks)
    const items = await this.calculateRemainingWork(userId)
    const itemsWithWeights = items.map(item => ({
      item,
      weight: this.calculatePriorityWeights(item),
      daysLeft: item.deadline ? Math.ceil((new Date(item.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
    })).filter(x => x.item.remaining_hours > 0)

    // Order items inside the remaining capacity by type weightings
    const typeOrder = { ASSIGNMENT: 1, EXAM: 1, PROJECT: 2, CERTIFICATION: 3, TASK: 4 }
    itemsWithWeights.sort((a, b) => {
      const ordA = typeOrder[a.item.type] || 9
      const ordB = typeOrder[b.item.type] || 9
      if (ordA !== ordB) return ordA - ordB
      return b.weight - a.weight // fallback to priority weight
    })

    if (capacityMinutes > 0 && itemsWithWeights.length > 0) {
      const totalWeight = itemsWithWeights.reduce((sum, x) => sum + x.weight, 0)
      itemsWithWeights.forEach(({ item, weight, daysLeft }) => {
        if (capacityMinutes <= 0) return
        const share = totalWeight > 0 ? weight / totalWeight : 0
        let allocatedMins = Math.round(capacityMinutes * share)
        const remainingMins = item.remaining_hours * 60

        if (allocatedMins > remainingMins) {
          allocatedMins = remainingMins
        }
        if (allocatedMins < 15) return // minimum timeblock threshold

        let reason = ''
        if (daysLeft !== null) {
          reason = daysLeft < 0 ? 'Overdue deadline.' : `Due in ${daysLeft} days.`
        } else {
          reason = `Flexible scheduling allocation.`
        }

        allocations.push({
          id: item.id,
          name: item.name,
          type: item.type,
          allocated_minutes: allocatedMins,
          reason,
          energy_zone: item.difficulty === 'HARD' ? 'morning' : (item.difficulty === 'MEDIUM' ? 'afternoon' : 'evening')
        })
        totalPlannedMinutes += allocatedMins
        capacityMinutes = Math.max(0, capacityMinutes - allocatedMins)
      })
    }

    return {
      date: todayStr,
      availableCapacityHours: finalCapacityHours,
      allocations,
      totalPlannedMinutes,
      remainingMinutes: capacityMinutes
    }
  }

  // 7. Generate weekly workload distribution incorporating all 7 layers
  static async buildWeeklyPlan(userId: string): Promise<any> {
    const capacities = await this.getCapacityPreferences(userId)
    const items = await this.calculateRemainingWork(userId)
    const baseWeeklyCapacity = 
      capacities.monday_hours + capacities.tuesday_hours + capacities.wednesday_hours +
      capacities.thursday_hours + capacities.friday_hours + capacities.saturday_hours + capacities.sunday_hours

    // Compute active vacation exceptions
    const supabase = await createClient()
    const { data: vacations } = await supabase
      .from('availability_exceptions')
      .select('*')
      .eq('user_id', userId)

    let finalWeeklyCapacity = baseWeeklyCapacity
    if (vacations && vacations.length > 0) {
      const today = new Date()
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today.getTime() + (i * 24 * 60 * 60 * 1000))
        const checkDateStr = checkDate.toISOString().split('T')[0]
        const activeVac = vacations.find(v => v.start_date <= checkDateStr && v.end_date >= checkDateStr)
        if (activeVac) {
          const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
          let dayHours = 4.0
          switch (dayName) {
            case 'monday': dayHours = capacities.monday_hours; break
            case 'tuesday': dayHours = capacities.tuesday_hours; break
            case 'wednesday': dayHours = capacities.wednesday_hours; break
            case 'thursday': dayHours = capacities.thursday_hours; break
            case 'friday': dayHours = capacities.friday_hours; break
            case 'saturday': dayHours = capacities.saturday_hours; break
            case 'sunday': dayHours = capacities.sunday_hours; break
          }
          finalWeeklyCapacity -= (dayHours * (1.0 - Number(activeVac.capacity_multiplier ?? 0.0)))
        }
      }
    }

    const activeItems = items.filter(i => i.remaining_hours > 0)
    const itemsWithWeights = activeItems.map(item => ({
      item,
      weight: this.calculatePriorityWeights(item)
    }))

    const totalWeight = itemsWithWeights.reduce((sum, x) => sum + x.weight, 0)
    const distributions = itemsWithWeights.map(({ item, weight }) => {
      const share = totalWeight > 0 ? weight / totalWeight : 0
      const allocatedHours = Math.round((finalWeeklyCapacity * share) * 10) / 10
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        weekly_allocated_hours: Math.min(item.remaining_hours, allocatedHours),
        remaining_hours: item.remaining_hours
      }
    })

    return {
      weeklyCapacityHours: Math.round(finalWeeklyCapacity * 10) / 10,
      distributions
    }
  }

  // 8. Rebalance plans (saves audit event to planning_decisions)
  static async rebalancePlans(userId: string): Promise<boolean> {
    const supabase = await createClient()
    await supabase.from('planning_decisions').insert({
      user_id: userId,
      event_type: 'REBALANCE',
      title: 'Automated Planning Engine Rebalance',
      description: 'Distributed remaining flexible work sessions according to updated Mon-Sun availability capacities and active goal priority weights.'
    })
    return true
  }

  // 9. Run planning simulation ("Can I finish AWS before November?")
  static async runPlanningSimulation(
    userId: string, 
    estimatedHours: number, 
    deadlineStr: string,
    weeklyAdjust: number = 0
  ): Promise<{
    feasible: boolean
    weeklyHoursRequired: number
    weeklyCapacity: number
    completionProbability: number
    daysLeft: number
    recommendation: string
  }> {
    const capacities = await this.getCapacityPreferences(userId)
    const activeItems = await this.calculateRemainingWork(userId)
    
    const today = new Date()
    const deadline = new Date(deadlineStr)
    const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    const baseWeeklyCapacity = 
      capacities.monday_hours + capacities.tuesday_hours + capacities.wednesday_hours +
      capacities.thursday_hours + capacities.friday_hours + capacities.saturday_hours + capacities.sunday_hours
    
    const weeklyCapacity = baseWeeklyCapacity + weeklyAdjust
    
    const currentRemainingHours = activeItems.reduce((sum, item) => sum + item.remaining_hours, 0)
    const totalRemainingHoursIncludingNew = currentRemainingHours + estimatedHours
    
    const weeksRemaining = Math.max(0.1, daysLeft / 7)
    const weeklyHoursRequired = Math.round((totalRemainingHoursIncludingNew / weeksRemaining) * 10) / 10

    const probability = this.estimateCompletionProbability(totalRemainingHoursIncludingNew, daysLeft, weeklyCapacity)
    const feasible = weeklyHoursRequired <= weeklyCapacity

    let recommendation = ''
    if (feasible) {
      recommendation = `Yes! At your adjusted capacity of ${weeklyCapacity}h/week, you can complete this. Average weekly effort required is ${weeklyHoursRequired}h.`
    } else {
      const extraWeeksNeeded = Math.ceil((totalRemainingHoursIncludingNew / weeklyCapacity) - weeksRemaining)
      const suggestedDate = new Date(today.getTime() + (weeksRemaining + extraWeeksNeeded) * 7 * 24 * 60 * 60 * 1000)
      recommendation = `Capacity exceeded! Required: ${weeklyHoursRequired}h/week, Max: ${weeklyCapacity}h/week. Consider increasing capacity, delaying other tasks, or moving the deadline by at least ${extraWeeksNeeded} weeks to ${suggestedDate.toLocaleDateString()}.`
    }

    return {
      feasible,
      weeklyHoursRequired,
      weeklyCapacity,
      completionProbability: probability,
      daysLeft,
      recommendation
    }
  }

  // 10. Detect capacity conflicts
  static async detectCapacityConflicts(userId: string): Promise<Array<{
    title: string
    description: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
    suggestions: string[]
    deficitHours: number
    daysBehind: number
  }>> {
    const capacities = await this.getCapacityPreferences(userId)
    const items = await this.calculateRemainingWork(userId)
    
    const weeklyCapacity = 
      capacities.monday_hours + capacities.tuesday_hours + capacities.wednesday_hours +
      capacities.thursday_hours + capacities.friday_hours + capacities.saturday_hours + capacities.sunday_hours
    const conflicts: any[] = []

    let totalWeeklyRequired = 0
    const itemsWithDeadlines = items.filter(i => i.deadline && i.remaining_hours > 0)

    itemsWithDeadlines.forEach(item => {
      const daysLeft = Math.ceil((new Date(item.deadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft > 0) {
        const weeksLeft = daysLeft / 7
        const reqWeekly = item.remaining_hours / weeksLeft
        totalWeeklyRequired += reqWeekly
      }
    })

    if (totalWeeklyRequired > weeklyCapacity) {
      const deficit = Math.round((totalWeeklyRequired - weeklyCapacity) * 10) / 10
      const daysBehind = Math.ceil((totalWeeklyRequired - weeklyCapacity) / (weeklyCapacity / 7))
      conflicts.push({
        title: 'Weekly Capacity Exceeded',
        description: `Your active deadlines demand ${Math.round(totalWeeklyRequired)}h/week, but your current capacity is ${weeklyCapacity}h/week. You are behind by approximately ${daysBehind} days.`,
        severity: 'HIGH',
        suggestions: [
          'Move soft project deadlines out by at least 2 weeks.',
          'Postpone certifications currently in preparing status.',
          'Increase daily capacity settings (e.g. Saturday or Sunday availability).'
        ],
        deficitHours: deficit,
        daysBehind
      })
    }

    return conflicts
  }
}
