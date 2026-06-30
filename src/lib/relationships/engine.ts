import { createClient } from '@/utils/supabase/server'

export class RelationshipIntelligenceEngine {
  
  // 1. Link memory nodes or entity relationships
  static async linkMemories(
    sourceMemoryId: string,
    targetMemoryId: string,
    relationshipType: 'SUPPORTS' | 'CONTRADICTS' | 'REFERENCES' | 'DERIVED_FROM' | 'RELATED_TO'
  ) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('memory_relationships').insert({
      source_memory_id: sourceMemoryId,
      target_memory_id: targetMemoryId,
      relationship_type: relationshipType
    }).select().single()

    if (error) console.error('Failed to link memory nodes:', error)
    return data
  }

  // 2. Discover related memory graphs
  static async findRelatedMemories(memoryId: string) {
    const supabase = await createClient()
    const { data: rels } = await supabase
      .from('memory_relationships')
      .select('*')
      .or(`source_memory_id.eq.${memoryId},target_memory_id.eq.${memoryId}`)

    return rels || []
  }
}
