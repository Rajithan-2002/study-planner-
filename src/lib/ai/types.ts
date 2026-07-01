export type AISessionState =
  | 'RECEIVED'
  | 'INTENT_CLASSIFIED'
  | 'CONTEXT_GATHERED'
  | 'TOOLS_ROUTED'
  | 'PROMPT_BUILT'
  | 'LLM_CALLED'
  | 'VALIDATED'
  | 'COMPLETED'
  | 'ERROR'

export interface AISession {
  sessionId: string
  userId: string
  state: AISessionState
  intent: string
  capability?: string
  context: {
    academic?: any
    projects?: any
    certifications?: any
    knowledge?: any
    scheduler?: any
    dashboard?: any
    search?: any
    timeline?: any
    raw_query: string
    [key: string]: any
  }
  toolsExecuted: Array<{
    name: string
    params: any
    output: any
    success: boolean
  }>
  providerSelected: string
  modelSelected: string
  rawPrompt?: string
  rawLLMResponse?: string
  errors: string[]
  metrics: {
    startTime: number
    endTime?: number
    durationMs?: number
    tokenUsage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }
}

export interface AIResponse {
  answer: string
  citations: string[]
  toolCalls: any[]
  suggestions: string[]
  warnings: string[]
  nextActions: string[]
  confidence: number
}

export interface ProviderInterface {
  id: string
  generateResponse(session: AISession): Promise<{
    answer: string
    tokenUsage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }>
}
