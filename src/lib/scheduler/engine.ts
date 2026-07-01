export interface SchedulePreferences {
  preferred_focus_time: string // MORNING, AFTERNOON, EVENING, NIGHT
  max_daily_study_hours: number
  max_daily_project_hours: number
  buffer_minutes: number
  sleep_start_time: string // 'HH:MM'
  sleep_end_time: string
  work_start_time: string
  work_end_time: string
}

export interface TimeBlockData {
  id: string
  title: string
  type: string // STUDY, PROJECT, MEETING, BREAK, EXERCISE, PERSONAL, DEEP_WORK
  status: string // PENDING, ACTIVE, COMPLETED, SKIPPED
  scheduled_at: string // ISO string
  duration_minutes: number
  is_locked: boolean
  related_entity_type?: string | null
  related_entity_id?: string | null
}

export interface TaskPriorityInfo {
  id: string
  title: string
  due_date?: string | null
  priority: string // LOW, MEDIUM, HIGH, CRITICAL
  risk_level?: string | null
}

export interface ScheduleConflict {
  title: string
  description: string
  severity: string // LOW, MEDIUM, HIGH
}

// 1. Calculate workload and zones (GREEN, YELLOW, RED)
export function calculateWorkload(timeBlocks: TimeBlockData[]) {
  const activeBlocks = timeBlocks.filter(b => b.status !== 'SKIPPED')
  const totalMins = activeBlocks.reduce((sum, b) => sum + b.duration_minutes, 0)
  const studyMins = activeBlocks.filter(b => b.type === 'STUDY').reduce((sum, b) => sum + b.duration_minutes, 0)
  const projectMins = activeBlocks.filter(b => b.type === 'PROJECT').reduce((sum, b) => sum + b.duration_minutes, 0)

  let zone = 'GREEN'
  if (totalMins > 480) { // Over 8 hours of work
    zone = 'RED'
  } else if (totalMins > 300) { // Over 5 hours
    zone = 'YELLOW'
  }

  return {
    totalHours: Math.round((totalMins / 60) * 10) / 10,
    studyHours: Math.round((studyMins / 60) * 10) / 10,
    projectHours: Math.round((projectMins / 60) * 10) / 10,
    zone
  }
}

// 2. Priority Engine Score calculation
export function calculatePriorityScore(item: TaskPriorityInfo): number {
  let score = 0

  // 1. Deadline Proximity
  if (item.due_date) {
    const daysLeft = Math.ceil((new Date(item.due_date).getTime() - new Date().getTime()) / 86400000)
    if (daysLeft < 0) score += 50 // Overdue
    else if (daysLeft === 0) score += 45 // Today
    else if (daysLeft <= 2) score += 35 // Next 48h
    else if (daysLeft <= 7) score += 20
    else score += 5
  }

  // 2. Base Priority
  switch ((item.priority || 'MEDIUM').toUpperCase()) {
    case 'CRITICAL': score += 40; break
    case 'HIGH': score += 25; break
    case 'MEDIUM': score += 15; break
    case 'LOW': score += 5; break
  }

  // 3. Risk Level
  switch ((item.risk_level || 'LOW').toUpperCase()) {
    case 'HIGH': score += 10; break
    case 'MEDIUM': score += 5; break
  }

  return score
}

// 3. Focus Session / Time Block generation
export function generateFocusSessions(
  tasks: TaskPriorityInfo[],
  preferences: SchedulePreferences,
  availableMins: number = 240
): Array<Omit<TimeBlockData, 'id' | 'scheduled_at'>> {
  // Sort tasks by priority score descending
  const sortedTasks = [...tasks].sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a))
  
  const generated: Array<Omit<TimeBlockData, 'id' | 'scheduled_at'>> = []
  let remainingMins = availableMins
  let studyAccumulated = 0
  let projectAccumulated = 0

  const maxStudyMins = preferences.max_daily_study_hours * 60
  const maxProjectMins = preferences.max_daily_project_hours * 60

  for (const task of sortedTasks) {
    if (remainingMins <= 0) break

    // Determine type based on task details
    const type = task.title.toLowerCase().includes('study') || task.title.toLowerCase().includes('cert') ? 'STUDY' : 'PROJECT'

    if (type === 'STUDY' && studyAccumulated >= maxStudyMins) continue
    if (type === 'PROJECT' && projectAccumulated >= maxProjectMins) continue

    // Determine block size (30, 45, 60, 90 mins)
    let duration = 45
    const score = calculatePriorityScore(task)
    if (score >= 70) duration = 90
    else if (score >= 50) duration = 60
    else if (score < 30) duration = 30

    duration = Math.min(duration, remainingMins)

    generated.push({
      title: `Focus Session: ${task.title}`,
      type,
      status: 'PENDING',
      duration_minutes: duration,
      is_locked: false,
      related_entity_type: type === 'STUDY' ? 'CERTIFICATION' : 'PROJECT',
      related_entity_id: task.id
    })

    remainingMins -= duration
    if (type === 'STUDY') studyAccumulated += duration
    else projectAccumulated += duration

    // Insert short break/buffer if time remains
    if (remainingMins > preferences.buffer_minutes) {
      generated.push({
        title: 'Buffer Break',
        type: 'BREAK',
        status: 'PENDING',
        duration_minutes: preferences.buffer_minutes,
        is_locked: false
      })
      remainingMins -= preferences.buffer_minutes
    }
  }

  return generated
}

// 4. Collision & Conflict Detection
export function detectConflicts(timeBlocks: TimeBlockData[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []
  const sorted = [...timeBlocks]
    .filter(b => b.status !== 'SKIPPED')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  // Check overlaps
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    const currStart = new Date(current.scheduled_at).getTime()
    const currEnd = currStart + current.duration_minutes * 60000
    const nextStart = new Date(next.scheduled_at).getTime()

    if (currEnd > nextStart) {
      conflicts.push({
        title: 'Schedule Collision Detected',
        description: `"${current.title}" overlaps with "${next.title}" by ${Math.ceil((currEnd - nextStart) / 60000)} minutes.`,
        severity: 'HIGH'
      })
    }
  }

  // Check workload balance (e.g. daily limit exceeded)
  const totalMins = sorted.reduce((sum, b) => sum + b.duration_minutes, 0)
  if (totalMins > 600) { // Over 10 hours
    conflicts.push({
      title: 'Daily Capacity Overloaded',
      description: 'Your planned schedule exceeds 10 hours of active workload. Consider deferring non-urgent blocks.',
      severity: 'HIGH'
    })
  }

  return conflicts
}

// 5. Build daily cron schedule
export function buildDailySchedule(
  timeBlocks: TimeBlockData[],
  preferences: SchedulePreferences
): TimeBlockData[] {
  // Sort blocks by scheduled time
  return [...timeBlocks].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )
}

// 6. Expose AI Context
export function getSchedulerAIContext(
  timeBlocks: TimeBlockData[],
  preferences: SchedulePreferences,
  conflicts: ScheduleConflict[]
) {
  const workload = calculateWorkload(timeBlocks)
  return {
    dailyTotalHours: workload.totalHours,
    dailyWorkloadZone: workload.zone,
    studyHoursScheduled: workload.studyHours,
    projectHoursScheduled: workload.projectHours,
    conflictsCount: conflicts.length,
    conflictsList: conflicts.map(c => `${c.title}: ${c.description}`),
    focusTimePreference: preferences.preferred_focus_time,
    bufferTimePreference: preferences.buffer_minutes,
    totalBlocksCount: timeBlocks.length,
    completedBlocksCount: timeBlocks.filter(b => b.status === 'COMPLETED').length
  }
}
