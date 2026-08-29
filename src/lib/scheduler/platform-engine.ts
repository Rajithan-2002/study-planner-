import { IPlatformEngine, EngineResult, SearchItem, TimelineEntry } from '../platform/types'
import { calculateWorkload, detectConflicts } from './engine'
import { createClient } from '@/utils/supabase/server'
import { PlanningCapacityEngine } from '../planning/engine'

export class SchedulerPlatformEngine implements IPlatformEngine {
  id = 'scheduler'

  async calculate(userId: string, context?: any): Promise<EngineResult<any>> {
    try {
      let timeBlocks = context?.timeBlocks

      const supabase = await createClient()
      if (!timeBlocks) {
        const { data } = await supabase.from('time_blocks').select('*').eq('user_id', userId)
        timeBlocks = data || []
      }

      const workload = calculateWorkload(timeBlocks)
      return {
        success: true,
        data: workload,
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
      let timeBlocks = context?.timeBlocks
      let preferences = context?.preferences

      const supabase = await createClient()
      if (!timeBlocks || timeBlocks.length === 0) {
        const todayStr = new Date().toISOString().split('T')[0]
        const { data: blocks } = await supabase.from('time_blocks').select('*').eq('user_id', userId).gte('scheduled_at', `${todayStr}T00:00:00Z`).lte('scheduled_at', `${todayStr}T23:59:59Z`)
        if (blocks && blocks.length > 0) {
          timeBlocks = blocks
        } else {
          const { data: propPlan } = await supabase.from('generated_plans').select('plan_data').eq('user_id', userId).eq('plan_date', todayStr).maybeSingle()
          timeBlocks = propPlan?.plan_data || []
        }
      }
      if (!preferences) {
        const { data } = await supabase.from('user_schedule_preferences').select('*').eq('user_id', userId).maybeSingle()
        preferences = data || {
          preferred_focus_time: 'MORNING',
          max_daily_study_hours: 4.0,
          max_daily_project_hours: 3.0,
          buffer_minutes: 10
        }
      }

      const workload = calculateWorkload(timeBlocks)
      const conflicts = await PlanningCapacityEngine.detectCapacityConflicts(userId)
      const dailyPlan = await PlanningCapacityEngine.buildDailyStudyPlan(userId)

      return {
        success: true,
        data: {
          totalHours: workload.totalHours,
          studyHours: workload.studyHours,
          projectHours: workload.projectHours,
          workloadZone: workload.zone,
          conflictsCount: conflicts.length,
          conflicts: conflicts,
          dailyPlanAllocations: dailyPlan.allocations,
          todayAgenda: timeBlocks
            .filter((b: any) => b.status !== 'SKIPPED')
            .map((b: any) => ({ id: b.id, title: b.title, type: b.type, scheduledAt: b.scheduled_at, duration: b.duration_minutes }))
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
      const summary = await this.getSummary(userId, context)
      if (!summary.success || !summary.data) return summary

      return {
        success: true,
        data: {
          progressPercentage: 100,
          completedUnits: summary.data.todayAgenda.length,
          remainingUnits: summary.data.conflictsCount,
          status: 'ACTIVE'
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

export class SchedulerSearchAdapter {
  entityType = 'SCHEDULER'
  async search(query: string, userId: string): Promise<SearchItem[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,type.ilike.%${query}%`)

      return (data || []).map(b => ({
        id: b.id,
        title: b.title,
        subtitle: `Time Block | Type: ${b.type} | Status: ${b.status} | Duration: ${b.duration_minutes}m`,
        entityType: 'TIME_BLOCK',
        url: `/today`
      }))
    } catch (err) {
      console.error('SchedulerSearchAdapter error:', err)
      return []
    }
  }
}

export class SchedulerTimelineAdapter {
  entityType = 'SCHEDULER'
  async getTimeline(userId: string): Promise<TimelineEntry[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED')
        .order('updated_at', { ascending: false })

      return (data || []).map(b => ({
        id: b.id,
        title: `Completed Focus Session: ${b.title} (${b.duration_minutes} mins)`,
        eventDate: b.updated_at || b.created_at,
        type: 'FOCUS_SESSION',
        importance: 2,
        relatedEntityId: b.id
      }))
    } catch (err) {
      console.error('SchedulerTimelineAdapter error:', err)
      return []
    }
  }
}
