export type MemoryType = 
  | 'ACADEMIC' 
  | 'PROJECTS' 
  | 'CERTIFICATIONS' 
  | 'KNOWLEDGE' 
  | 'SCHEDULER' 
  | 'PREFERENCE' 
  | 'RELATIONSHIP' 
  | 'CONVERSATION' 
  | 'GOAL' 
  | 'ACHIEVEMENT' 
  | 'BEHAVIOR' 
  | 'CUSTOM'

export type MemoryLifecycleState = 
  | 'OBSERVED' 
  | 'CANDIDATE' 
  | 'VERIFIED' 
  | 'ACTIVE' 
  | 'FREQUENTLY_USED' 
  | 'ARCHIVED' 
  | 'FORGOTTEN'

export interface MemoryItem {
  id?: string
  userId: string
  memoryType: MemoryType
  title: string
  content: string
  importanceScore: number
  confidenceScore: number
  accessCount: number
  lastAccessed?: string
  decayScore: number
  lifecycleState: MemoryLifecycleState
  source: string
  createdAt?: string
  updatedAt?: string
}

export interface UserPreferences {
  id?: string
  userId: string
  preferredStudyHours: number
  preferredAiStyle: 'BALANCED' | 'CONCISE' | 'DETAILED'
  preferredLearningStyle: 'VISUAL' | 'AUDITORY' | 'PRACTICAL'
  careerGoals?: string
  focusDuration: number
}

export interface ReflectionInsight {
  id?: string
  userId: string
  reflectionType: 'WEEKLY_REVIEW' | 'HABIT_DETECTION' | 'ACHIEVEMENT_RECOGNITION' | 'MISSED_OPPORTUNITY'
  title: string
  content: string
  createdAt?: string
}

export interface FusedAIContext {
  rawQuery: string
  intent: string
  userPreferences?: UserPreferences
  activeMemories: MemoryItem[]
  decisionSummary?: any
  ragSummary?: any
  reflections?: ReflectionInsight[]
  budgetMetrics: {
    conversationBudgetPct: number
    decisionBudgetPct: number
    memoryBudgetPct: number
    ragBudgetPct: number
    preferenceBudgetPct: number
  }
}
