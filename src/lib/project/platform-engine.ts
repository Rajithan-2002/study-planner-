import { IPlatformEngine, EngineResult, SearchItem, TimelineEntry } from '../platform/types'
import { getProjectAnalytics, calculateProjectRiskAndHealth } from './engine'
import { createClient } from '@/utils/supabase/server'

export class ProjectPlatformEngine implements IPlatformEngine {
  id = 'project'

  async calculate(userId: string, context?: any): Promise<EngineResult<any>> {
    try {
      let projects = context?.projects
      let tasks = context?.tasks
      let milestones = context?.milestones

      const supabase = await createClient()
      if (!projects) {
        const { data } = await supabase.from('projects').select('*').eq('user_id', userId)
        projects = data || []
      }
      if (!tasks) {
        const { data } = await supabase.from('tasks').select('*').eq('user_id', userId)
        tasks = data || []
      }
      if (!milestones) {
        const { data } = await supabase.from('project_milestones').select('*')
        milestones = data || []
      }

      const analytics = getProjectAnalytics(projects, tasks, milestones)
      return {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      }
    } catch (err: any) {
      return {
        success: false,
        errors: [err.message],
        timestamp: new Date().toISOString()
      }
    }
  }

  async getSummary(userId: string, context?: any): Promise<EngineResult<any>> {
    try {
      let projects = context?.projects
      let tasks = context?.tasks
      let milestones = context?.milestones

      const supabase = await createClient()
      if (!projects) {
        const { data } = await supabase.from('projects').select('*').eq('user_id', userId)
        projects = data || []
      }
      if (!tasks) {
        const { data } = await supabase.from('tasks').select('*').eq('user_id', userId)
        tasks = data || []
      }
      if (!milestones) {
        const { data } = await supabase.from('project_milestones').select('*')
        milestones = data || []
      }

      const activeProjects = projects.filter((p: any) => !p.is_archived && p.status !== 'COMPLETED')
      const overdueList = activeProjects.filter((p: any) => {
        const { health } = calculateProjectRiskAndHealth(p, tasks, milestones)
        return health === 'BEHIND' || health === 'AT_RISK'
      })

      const analytics = getProjectAnalytics(projects, tasks, milestones)

      return {
        success: true,
        data: {
          activeCount: analytics.activeCount,
          overdueCount: analytics.overdueCount,
          averageProgress: analytics.averageProgress,
          dailyFocusMinutes: analytics.totalDailyFocusMins,
          overdueProjects: overdueList.map((p: any) => ({ id: p.id, name: p.name, priority: p.priority }))
        },
        timestamp: new Date().toISOString()
      }
    } catch (err: any) {
      return {
        success: false,
        errors: [err.message],
        timestamp: new Date().toISOString()
      }
    }
  }

  async getMetrics(userId: string, context?: any): Promise<EngineResult<any>> {
    try {
      const calc = await this.calculate(userId, context)
      if (!calc.success || !calc.data) return calc

      return {
        success: true,
        data: {
          progressPercentage: calc.data.averageProgress,
          completedUnits: calc.data.completedCount,
          remainingUnits: calc.data.activeCount,
          status: calc.data.activeCount > 0 ? 'ACTIVE' : 'IDLE'
        },
        timestamp: new Date().toISOString()
      }
    } catch (err: any) {
      return {
        success: false,
        errors: [err.message],
        timestamp: new Date().toISOString()
      }
    }
  }
}

export class ProjectSearchAdapter {
  entityType = 'PROJECT'
  async search(query: string, userId: string): Promise<SearchItem[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)

      return (data || []).map(p => ({
        id: p.id,
        title: p.name,
        subtitle: `Category: ${p.category || 'N/A'} | Priority: ${p.priority} | Status: ${p.status}`,
        entityType: 'PROJECT',
        url: `/projects`
      }))
    } catch (err) {
      console.error('ProjectSearchAdapter error:', err)
      return []
    }
  }
}

export class ProjectTimelineAdapter {
  entityType = 'PROJECT'
  async getTimeline(userId: string): Promise<TimelineEntry[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      return (data || []).map(p => ({
        id: p.id,
        title: `${p.status === 'COMPLETED' ? 'Completed' : 'Updated'} Project: ${p.name}`,
        eventDate: p.updated_at || p.created_at,
        type: 'PROJECT_EVENT',
        importance: p.priority === 'CRITICAL' || p.priority === 'HIGH' ? 3 : 1,
        relatedEntityId: p.id
      }))
    } catch (err) {
      console.error('ProjectTimelineAdapter error:', err)
      return []
    }
  }
}
