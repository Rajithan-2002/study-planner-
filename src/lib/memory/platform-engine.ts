import { IPlatformEngine, EngineResult, SearchItem, TimelineEntry } from '../platform/types'
import { createClient } from '@/utils/supabase/server'

export class MemoryPlatformEngine implements IPlatformEngine {
  id = 'memory'

  async calculate(userId: string, context?: any): Promise<EngineResult<any>> {
    return this.getSummary(userId, context)
  }

  async getSummary(userId: string, context?: any): Promise<EngineResult<any>> {
    try {
      const supabase = await createClient()
      const { data: mems } = await supabase.from('ai_memories').select('id').eq('user_id', userId)
      const { data: rels } = await supabase.from('memory_relationships').select('id')
      const { data: refls } = await supabase.from('reflections').select('id, title, content').eq('user_id', userId).order('created_at', { ascending: false }).limit(3)

      return {
        success: true,
        data: {
          totalMemories: mems?.length || 0,
          relationshipDensity: rels?.length || 0,
          recentReflections: refls || [],
          profileCompleteness: 92.5
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

export class MemorySearchAdapter {
  entityType = 'MEMORY'
  async search(query: string, userId: string): Promise<SearchItem[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('ai_memories')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)

      return (data || []).map(m => ({
        id: m.id,
        title: m.title,
        subtitle: `Memory Node (${m.memory_type}) | Importance: ${m.importance_score}`,
        entityType: 'MEMORY',
        url: `/`
      }))
    } catch (err) {
      console.error('MemorySearchAdapter error:', err)
      return []
    }
  }
}

export class MemoryTimelineAdapter {
  entityType = 'MEMORY'
  async getTimeline(userId: string): Promise<TimelineEntry[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('ai_memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      return (data || []).map(m => ({
        id: m.id,
        title: `Memory Learned: ${m.title}`,
        eventDate: m.created_at,
        type: 'MEMORY_CREATED',
        importance: 1,
        relatedEntityId: m.id
      }))
    } catch (err) {
      console.error('MemoryTimelineAdapter error:', err)
      return []
    }
  }
}
