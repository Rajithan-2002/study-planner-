import { MemoryItem, MemoryLifecycleState } from './types'

export class MemoryGovernanceEngine {
  
  // 1. Calculate dynamic importance score
  static calculateImportance(memory: MemoryItem): number {
    const frequencyFactor = Math.min(2.0, memory.accessCount * 0.1)
    const baseImportance = memory.importanceScore || 1.0
    const decay = memory.decayScore || 1.0

    return Math.round((baseImportance + frequencyFactor) * decay * 100) / 100
  }

  // 2. Resolve conflict or merge duplicate memory
  static governMemoryInsertion(existingMemories: MemoryItem[], newMemory: MemoryItem): {
    action: 'INSERT' | 'MERGE' | 'SKIP'
    targetMemoryId?: string
    updatedContent?: string
    updatedImportance?: number
  } {
    const titleLower = newMemory.title.toLowerCase().trim()

    for (const m of existingMemories) {
      if (m.title.toLowerCase().trim() === titleLower) {
        // Conflict / Duplicate found: merge content and bump access count
        const mergedContent = `${m.content}\n[Updated info]: ${newMemory.content}`
        const newImp = Math.min(5.0, m.importanceScore + 0.5)
        return {
          action: 'MERGE',
          targetMemoryId: m.id,
          updatedContent: mergedContent,
          updatedImportance: newImp
        }
      }
    }

    return { action: 'INSERT' }
  }

  // 3. Evaluate lifecycle transition
  static determineLifecycleState(memory: MemoryItem): MemoryLifecycleState {
    if (memory.accessCount > 10) return 'FREQUENTLY_USED'
    if (memory.accessCount > 2) return 'ACTIVE'
    if (memory.confidenceScore >= 1.5) return 'VERIFIED'
    return 'OBSERVED'
  }
}
