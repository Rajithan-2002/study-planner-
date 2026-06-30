import { IPlatformEngine, EngineResult, SearchItem, TimelineEntry } from '../platform/types'
import { calculateKnowledgeMetrics } from './engine'
import { createClient } from '@/utils/supabase/server'

export class KnowledgePlatformEngine implements IPlatformEngine {
  id = 'knowledge'

  async calculate(userId: string, context?: any): Promise<EngineResult<any>> {
    try {
      let files = context?.files
      let notes = context?.notes
      let chunks = context?.chunks
      let relationships = context?.relationships

      const supabase = await createClient()
      if (!files) {
        const { data } = await supabase.from('knowledge_files').select('*').eq('user_id', userId)
        files = data || []
      }
      if (!notes) {
        const { data } = await supabase.from('notes').select('*').eq('user_id', userId)
        notes = data || []
      }
      if (!chunks) {
        const { data } = await supabase.from('knowledge_chunks').select('*')
        chunks = data || []
      }
      if (!relationships) {
        const { data } = await supabase.from('platform_relationships').select('*')
        relationships = data || []
      }

      const metrics = calculateKnowledgeMetrics(files, notes, chunks, relationships)
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
      let files = context?.files
      let notes = context?.notes
      let chunks = context?.chunks
      let relationships = context?.relationships

      const supabase = await createClient()
      if (!files) {
        const { data } = await supabase.from('knowledge_files').select('*').eq('user_id', userId)
        files = data || []
      }
      if (!notes) {
        const { data } = await supabase.from('notes').select('*').eq('user_id', userId)
        notes = data || []
      }
      if (!chunks) {
        const { data } = await supabase.from('knowledge_chunks').select('*')
        chunks = data || []
      }
      if (!relationships) {
        const { data } = await supabase.from('platform_relationships').select('*')
        relationships = data || []
      }

      const metrics = calculateKnowledgeMetrics(files, notes, chunks, relationships)

      // Get recently updated documents
      const activeFiles = files.filter((f: any) => !f.is_archived)
      const recentlyUpdated = [...activeFiles]
        .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
        .slice(0, 5)
        .map((f: any) => ({ id: f.id, name: f.file_name, type: f.file_type, updatedAt: f.updated_at || f.created_at }))

      return {
        success: true,
        data: {
          totalDocumentsCount: metrics.totalDocumentsCount,
          notesCount: metrics.notesCount,
          relationshipsCount: metrics.relationshipsCount,
          totalStorageBytes: metrics.totalStorageBytes,
          recentlyUpdated
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
          completedUnits: summary.data.totalDocumentsCount,
          remainingUnits: summary.data.notesCount,
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

export class KnowledgeSearchAdapter {
  entityType = 'KNOWLEDGE'
  async search(query: string, userId: string): Promise<SearchItem[]> {
    try {
      const supabase = await createClient()
      
      // Search files
      const { data: files } = await supabase
        .from('knowledge_files')
        .select('*')
        .eq('user_id', userId)
        .or(`file_name.ilike.%${query}%,description.ilike.%${query}%`)

      // Search notes
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)

      const results: SearchItem[] = []

      if (files) {
        files.forEach(f => {
          results.push({
            id: f.id,
            title: f.file_name,
            subtitle: `Document | Type: ${f.file_type} | Status: ${f.knowledge_status}`,
            entityType: 'KNOWLEDGE_FILE',
            url: `/knowledge`
          })
        })
      }

      if (notes) {
        notes.forEach(n => {
          results.push({
            id: n.id,
            title: n.title,
            subtitle: `Note | Tags: ${(n.tags || []).join(', ')}`,
            entityType: 'KNOWLEDGE_NOTE',
            url: `/knowledge`
          })
        })
      }

      return results
    } catch (err) {
      console.error('KnowledgeSearchAdapter error:', err)
      return []
    }
  }
}

export class KnowledgeTimelineAdapter {
  entityType = 'KNOWLEDGE'
  async getTimeline(userId: string): Promise<TimelineEntry[]> {
    try {
      const supabase = await createClient()
      const { data: files } = await supabase
        .from('knowledge_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      return (files || []).map(f => ({
        id: f.id,
        title: `Uploaded Knowledge Document: ${f.file_name}`,
        eventDate: f.created_at,
        type: 'KNOWLEDGE_UPLOAD',
        importance: 1,
        relatedEntityId: f.id
      }))
    } catch (err) {
      console.error('KnowledgeTimelineAdapter error:', err)
      return []
    }
  }
}
