import { createClient } from '@/utils/supabase/server'
import { MemoryItem } from './types'
import { MemoryGovernanceEngine } from './governance'

export class CoreMemoryEngine {
  
  // 1. Store memory passing through Governance layer
  static async storeMemory(userId: string, memory: Partial<MemoryItem>): Promise<MemoryItem> {
    const supabase = await createClient()

    // Fetch active memories to evaluate governance deduplication
    const { data: existing } = await supabase
      .from('ai_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('lifecycle_state', 'ACTIVE')

    const existingItems: MemoryItem[] = (existing || []).map(m => ({
      id: m.id,
      userId: m.user_id,
      memoryType: m.memory_type,
      title: m.title,
      content: m.content,
      importanceScore: Number(m.importance_score),
      confidenceScore: Number(m.confidence_score),
      accessCount: m.access_count,
      lastAccessed: m.last_accessed,
      decayScore: Number(m.decay_score),
      lifecycleState: m.lifecycle_state,
      source: m.source
    }))

    const newItem: MemoryItem = {
      userId,
      memoryType: memory.memoryType || 'CUSTOM',
      title: memory.title || 'Untitled Memory',
      content: memory.content || '',
      importanceScore: memory.importanceScore || 1.0,
      confidenceScore: memory.confidenceScore || 1.0,
      accessCount: 0,
      decayScore: 1.0,
      lifecycleState: 'ACTIVE',
      source: memory.source || 'USER_CHAT'
    }

    const decision = MemoryGovernanceEngine.governMemoryInsertion(existingItems, newItem)

    if (decision.action === 'MERGE' && decision.targetMemoryId) {
      const { data: updated } = await supabase
        .from('ai_memories')
        .update({
          content: decision.updatedContent,
          importance_score: decision.updatedImportance,
          access_count: (existingItems.find(i => i.id === decision.targetMemoryId)?.accessCount || 0) + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('id', decision.targetMemoryId)
        .select()
        .single()

      return updated
    }

    // Insert new memory row
    const { data: inserted, error } = await supabase
      .from('ai_memories')
      .insert({
        user_id: userId,
        memory_type: newItem.memoryType,
        title: newItem.title,
        content: newItem.content,
        importance_score: newItem.importanceScore,
        confidence_score: newItem.confidenceScore,
        lifecycle_state: newItem.lifecycleState,
        source: newItem.source
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to store memory: ${error.message}`)
    return inserted
  }

  // 2. Retrieve active memories for user context
  static async retrieveMemory(userId: string, limit = 5): Promise<MemoryItem[]> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('ai_memories')
      .select('*')
      .eq('user_id', userId)
      .neq('lifecycle_state', 'ARCHIVED')
      .order('importance_score', { ascending: false })
      .limit(limit)

    return (data || []).map(m => ({
      id: m.id,
      userId: m.user_id,
      memoryType: m.memory_type,
      title: m.title,
      content: m.content,
      importanceScore: Number(m.importance_score),
      confidenceScore: Number(m.confidence_score),
      accessCount: m.access_count,
      lastAccessed: m.last_accessed,
      decayScore: Number(m.decay_score),
      lifecycleState: m.lifecycle_state,
      source: m.source
    }))
  }

  // 3. Summarize conversation session
  static async summarizeConversation(userId: string, sessionId: string, summaryText: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('conversation_summaries').insert({
      user_id: userId,
      session_id: sessionId,
      summary_content: summaryText
    }).select().single()

    if (error) throw new Error(`Failed to store conversation summary: ${error.message}`)
    return data
  }
}
