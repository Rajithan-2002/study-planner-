import { IPlatformEngine, EngineResult, SearchItem, TimelineEntry } from '../platform/types'
import { calculateOverallMetrics } from './engine'
import { createClient } from '@/utils/supabase/server'

export class AcademicPlatformEngine implements IPlatformEngine {
  id = 'academic'

  async calculate(userId: string, context?: any): Promise<EngineResult<any>> {
    try {
      let modules = context?.modules
      let curriculum = context?.curriculum

      const supabase = await createClient()
      if (!modules) {
        const { data } = await supabase.from('modules').select('*').eq('user_id', userId)
        modules = data || []
      }
      if (!curriculum) {
        const { data } = await supabase.from('curriculum_modules').select('*')
        curriculum = data || []
      }

      const metrics = calculateOverallMetrics(modules, curriculum)
      return {
        success: true,
        data: metrics,
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
      let user = context?.user
      if (!user) {
        const supabase = await createClient()
        const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
        user = data
      }

      const metricsRes = await this.getMetrics(userId, context)

      return {
        success: true,
        data: {
          profile: user,
          gpa: metricsRes.data?.overallGpa ?? user?.current_gpa ?? 0,
          standing: metricsRes.data?.standing ?? 'Good Standing'
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
    const calcRes = await this.calculate(userId, context)
    if (!calcRes.success || !calcRes.data) return calcRes

    return {
      success: true,
      data: {
        progressPercentage: calcRes.data.progressPercentage,
        completedUnits: calcRes.data.creditsCompleted,
        remainingUnits: calcRes.data.creditsRemaining,
        totalDegreeCredits: calcRes.data.totalDegreeCredits,
        overallGpa: calcRes.data.overallGpa,
        standing: calcRes.data.standing,
        gradedModulesCount: calcRes.data.gradedModulesCount
      },
      timestamp: new Date().toISOString()
    }
  }
}

export class AcademicSearchAdapter {
  entityType = 'MODULE'
  async search(query: string, userId: string): Promise<SearchItem[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('modules')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${query}%,code.ilike.%${query}%`)

      return (data || []).map(m => ({
        id: m.id,
        title: `${m.code} - ${m.name}`,
        subtitle: `Grade: ${m.grade || 'Not Graded'} | Status: ${m.status}`,
        entityType: 'MODULE',
        url: `/academic`
      }))
    } catch (err) {
      console.error('AcademicSearchAdapter error:', err)
      return []
    }
  }
}

export class AcademicTimelineAdapter {
  entityType = 'MODULE'
  async getTimeline(userId: string): Promise<TimelineEntry[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('modules')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED')
        .order('updated_at', { ascending: false })

      return (data || []).map(m => ({
        id: m.id,
        title: `Completed Module: ${m.name} (${m.code}) with Grade: ${m.grade || 'N/A'}`,
        eventDate: m.updated_at || m.created_at,
        type: 'COMPLETED_MODULE',
        importance: 3,
        relatedEntityId: m.id
      }))
    } catch (err) {
      console.error('AcademicTimelineAdapter error:', err)
      return []
    }
  }
}
