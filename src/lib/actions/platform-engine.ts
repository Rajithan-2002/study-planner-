import { IPlatformEngine, EngineResult, SearchItem, TimelineEntry } from '../platform/types'
import { createClient } from '@/utils/supabase/server'

export class ActionPlatformEngine implements IPlatformEngine {
  id = 'action'

  async calculate(userId: string, context?: any): Promise<EngineResult<any>> {
    return this.getSummary(userId, context)
  }

  async getSummary(userId: string, context?: any): Promise<EngineResult<any>> {
    try {
      const supabase = await createClient()
      const { data: actions } = await supabase.from('ai_actions').select('id, status').eq('user_id', userId)

      const total = actions?.length || 0
      const pending = actions?.filter(a => a.status === 'PENDING' || a.status === 'WAITING_CONFIRMATION').length || 0
      const completed = actions?.filter(a => a.status === 'COMPLETED').length || 0
      const rolledBack = actions?.filter(a => a.status === 'ROLLED_BACK').length || 0

      return {
        success: true,
        data: {
          totalActions: total,
          pendingApprovals: pending,
          completedActions: completed,
          rollbackCount: rolledBack,
          automationRatePct: total > 0 ? Math.round((completed / total) * 100) : 100
        },
        timestamp: new Date().toISOString()
      }
    } catch (err: any) {
      return { success: false, errors: [err.message], timestamp: new Date().toISOString() }
    }
  }

  async getMetrics(userId: string, context?: any): Promise<EngineResult<any>> {
    return this.getSummary(userId, context)
  }
}

export class ActionSearchAdapter {
  entityType = 'ACTION'
  async search(query: string, userId: string): Promise<SearchItem[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('ai_actions')
        .select('*')
        .eq('user_id', userId)
        .ilike('action_type', `%${query}%`)

      return (data || []).map(a => ({
        id: a.id,
        title: `Action: ${a.action_type}`,
        subtitle: `Status: ${a.status} | Target: ${a.target_entity || 'N/A'}`,
        entityType: 'ACTION',
        url: `/`
      }))
    } catch (err) {
      console.error('ActionSearchAdapter error:', err)
      return []
    }
  }
}

export class ActionTimelineAdapter {
  entityType = 'ACTION'
  async getTimeline(userId: string): Promise<TimelineEntry[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('ai_actions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      return (data || []).map(a => ({
        id: a.id,
        title: `Action Triggered: ${a.action_type}`,
        eventDate: a.created_at,
        type: 'ACTION_EXECUTED',
        importance: 1,
        relatedEntityId: a.id
      }))
    } catch (err) {
      console.error('ActionTimelineAdapter error:', err)
      return []
    }
  }
}
