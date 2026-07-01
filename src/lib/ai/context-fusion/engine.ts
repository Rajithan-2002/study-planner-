import { FusedAIContext } from '../../memory/types'
import { CoreMemoryEngine } from '../../memory/engine'
import { PersonalizationEngine } from '../../personalization/engine'
import { ReflectionEngine } from '../../reflection/engine'

export class ContextFusionEngine {
  static async fuseContext(
    userId: string,
    rawQuery: string,
    intent: string,
    decisionData?: any,
    ragData?: any
  ): Promise<FusedAIContext> {
    
    // 1. Fetch persistent memory and user preferences asynchronously
    const [memories, preferences, reflections] = await Promise.all([
      CoreMemoryEngine.retrieveMemory(userId, 5),
      PersonalizationEngine.getPreferences(userId),
      ReflectionEngine.generateReflections(userId)
    ])

    // 2. Compile unified weighted context payload
    return {
      rawQuery,
      intent,
      userPreferences: preferences,
      activeMemories: memories,
      decisionSummary: decisionData,
      ragSummary: ragData,
      reflections,
      budgetMetrics: {
        conversationBudgetPct: 40,
        decisionBudgetPct: 25,
        memoryBudgetPct: 15,
        ragBudgetPct: 10,
        preferenceBudgetPct: 10
      }
    }
  }
}
