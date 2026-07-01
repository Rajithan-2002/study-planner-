export interface ProjectData {
  id: string
  name: string
  description?: string | null
  category?: string | null
  status: string
  priority: string
  target_completion_date?: string | null
  estimated_hours?: number | null
  weekly_target_hours?: number | null
  daily_focus_minutes?: number | null
  is_archived?: boolean | null
  completed_at?: string | null
  risk_level?: string | null
  tags?: string[] | null
  created_at?: string
  updated_at?: string
}

export interface MilestoneData {
  id: string
  project_id: string
  title: string
  description?: string | null
  status: string // PENDING, IN_PROGRESS, COMPLETED
  due_date?: string | null
  completed_at?: string | null
  order_index?: number
}

export interface TaskData {
  id: string
  title: string
  status: string // PENDING, COMPLETED
  priority?: string
  due_date?: string | null
  related_entity_type?: string | null
  related_entity_id?: string | null
  milestone_id?: string | null
}

// 1. Calculate milestone progress based on its linked tasks
export function calculateMilestoneProgress(milestoneId: string, tasks: TaskData[]) {
  const milestoneTasks = tasks.filter(t => t.milestone_id === milestoneId)
  if (milestoneTasks.length === 0) return 0
  const completedCount = milestoneTasks.filter(t => t.status === 'COMPLETED').length
  return Math.round((completedCount / milestoneTasks.length) * 100)
}

// 2. Calculate overall weighted project progress
export function calculateProjectProgress(
  project: ProjectData,
  tasks: TaskData[],
  milestones: MilestoneData[]
): number {
  if (project.status === 'COMPLETED') return 100

  const projTasks = tasks.filter(
    t => t.related_entity_type === 'PROJECT' && t.related_entity_id === project.id
  )
  const projMilestones = milestones.filter(m => m.project_id === project.id)

  if (projTasks.length === 0 && projMilestones.length === 0) {
    return 0
  }

  // Task completion weight (50%) and Milestone completion weight (50%)
  let taskWeight = 0
  if (projTasks.length > 0) {
    const completedTasks = projTasks.filter(t => t.status === 'COMPLETED').length
    taskWeight = completedTasks / projTasks.length
  }

  let milestoneWeight = 0
  if (projMilestones.length > 0) {
    const completedMilestones = projMilestones.filter(m => m.status === 'COMPLETED').length
    milestoneWeight = completedMilestones / projMilestones.length
  }

  if (projTasks.length > 0 && projMilestones.length > 0) {
    return Math.round((taskWeight * 0.5 + milestoneWeight * 0.5) * 100)
  } else if (projTasks.length > 0) {
    return Math.round(taskWeight * 100)
  } else {
    return Math.round(milestoneWeight * 100)
  }
}

// 3. Dynamic Risk and Health Engine
export function calculateProjectRiskAndHealth(
  project: ProjectData,
  tasks: TaskData[],
  milestones: MilestoneData[]
) {
  const progress = calculateProjectProgress(project, tasks, milestones)
  if (project.status === 'COMPLETED' || progress === 100) {
    return { health: 'COMPLETED', risk: 'LOW' }
  }

  const now = new Date().getTime()
  const targetDate = project.target_completion_date ? new Date(project.target_completion_date).getTime() : null
  const isPastDeadline = targetDate ? now > targetDate : false

  const projTasks = tasks.filter(t => t.related_entity_type === 'PROJECT' && t.related_entity_id === project.id)
  const overdueTasksCount = projTasks.filter(t => t.status !== 'COMPLETED' && t.due_date && new Date(t.due_date).getTime() < now).length

  let risk = 'LOW'
  let health = 'HEALTHY'

  if (isPastDeadline || overdueTasksCount > 2) {
    risk = 'HIGH'
    health = 'BEHIND'
  } else if (overdueTasksCount > 0 || (targetDate && targetDate - now < 7 * 86400000 && progress < 70)) {
    risk = 'MEDIUM'
    health = 'AT_RISK'
  }

  return { health, risk }
}

// 4. Calendar-ready upcoming deadlines
export function calculateUpcomingDeadlines(projects: ProjectData[], milestones: MilestoneData[]) {
  const now = new Date().getTime()
  const items: Array<{
    id: string
    title: string
    type: 'PROJECT_DEADLINE' | 'MILESTONE_DEADLINE'
    dueDate: string
    projectId: string
    projectName: string
  }> = []

  projects.filter(p => !p.is_archived && p.status !== 'COMPLETED').forEach(p => {
    if (p.target_completion_date) {
      items.push({
        id: `proj-${p.id}`,
        title: `Project Target: ${p.name}`,
        type: 'PROJECT_DEADLINE',
        dueDate: p.target_completion_date,
        projectId: p.id,
        projectName: p.name
      })
    }
  })

  milestones.filter(m => m.status !== 'COMPLETED' && m.due_date).forEach(m => {
    const parentProj = projects.find(p => p.id === m.project_id)
    if (parentProj && !parentProj.is_archived) {
      items.push({
        id: `ms-${m.id}`,
        title: `Milestone: ${m.title}`,
        type: 'MILESTONE_DEADLINE',
        dueDate: m.due_date!,
        projectId: m.project_id,
        projectName: parentProj.name
      })
    }
  })

  return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

// 5. Aggregated Analytics for Dashboard and Hub headers
export function getProjectAnalytics(projects: ProjectData[], tasks: TaskData[], milestones: MilestoneData[]) {
  const activeProjects = projects.filter(p => !p.is_archived && p.status !== 'COMPLETED')
  const completedProjects = projects.filter(p => p.status === 'COMPLETED')
  const archivedProjects = projects.filter(p => p.is_archived)

  let totalProgressSum = 0
  let overdueCount = 0
  let totalDailyFocusMins = 0

  activeProjects.forEach(p => {
    const prog = calculateProjectProgress(p, tasks, milestones)
    totalProgressSum += prog
    totalDailyFocusMins += p.daily_focus_minutes || 0

    const { health } = calculateProjectRiskAndHealth(p, tasks, milestones)
    if (health === 'BEHIND' || health === 'AT_RISK') {
      overdueCount++
    }
  })

  const averageProgress = activeProjects.length > 0 ? Math.round(totalProgressSum / activeProjects.length) : 0

  return {
    totalProjectsCount: projects.length,
    activeCount: activeProjects.length,
    completedCount: completedProjects.length,
    archivedCount: archivedProjects.length,
    overdueCount,
    averageProgress,
    totalDailyFocusMins
  }
}

// 6. Structured AI Context Generator
export function getProjectAIContext(project: ProjectData, tasks: TaskData[], milestones: MilestoneData[]) {
  const projTasks = tasks.filter(t => t.related_entity_type === 'PROJECT' && t.related_entity_id === project.id)
  const projMilestones = milestones.filter(m => m.project_id === project.id)
  const progress = calculateProjectProgress(project, tasks, milestones)
  const { health, risk } = calculateProjectRiskAndHealth(project, tasks, milestones)

  return {
    projectId: project.id,
    name: project.name,
    status: project.status,
    priority: project.priority,
    progressPercentage: progress,
    healthStatus: health,
    riskLevel: risk,
    dailyFocusMinutes: project.daily_focus_minutes || 0,
    weeklyTargetHours: project.weekly_target_hours || 0,
    targetCompletionDate: project.target_completion_date || null,
    totalTasks: projTasks.length,
    completedTasks: projTasks.filter(t => t.status === 'COMPLETED').length,
    totalMilestones: projMilestones.length,
    completedMilestones: projMilestones.filter(m => m.status === 'COMPLETED').length,
    milestoneTitles: projMilestones.map(m => `${m.title} (${m.status})`),
    tags: project.tags || []
  }
}
