export interface RiskReport {
  domain: 'ACADEMIC' | 'PROJECT' | 'CERTIFICATION' | 'SCHEDULE'
  score: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  recommendedAction: string
}

export interface OpportunityItem {
  id: string
  title: string
  description: string
  impact: string
  confidence: number
}

export interface GoalProgress {
  name: string
  targetValue: number
  currentValue: number
  progressPercentage: number
  deviation: number
}

export interface RecommendationItem {
  id?: string
  title: string
  description: string
  category: 'CRITICAL' | 'OPTIMIZATION' | 'WELLNESS' | 'RISK_MITIGATION'
  status: 'GENERATED' | 'ACCEPTED' | 'DISMISSED'
  priorityScore: number
  urgencyScore: number
  impactScore: number
  effortScore: number
  explainability: {
    metricsUsed: string[]
    rulesTriggered: string[]
    enginesConsulted: string[]
    confidenceFactor: number
    assumptions: string[]
  }
}

export interface DecisionObject {
  userId: string
  timestamp: string
  policySelected: 'BALANCED' | 'ACADEMIC_FIRST' | 'CAREER_FIRST' | 'DEADLINE_FIRST'
  risks: RiskReport[]
  opportunities: OpportunityItem[]
  goals: GoalProgress[]
  recommendations: RecommendationItem[]
  workloadHealth: {
    totalHours: number
    zone: 'GREEN' | 'YELLOW' | 'RED'
  }
  explainability: {
    evidenceCount: number
    confidenceIndex: number
  }
}

export interface ScenarioSimulationResult {
  scenarioName: string
  baseGpa: number
  simulatedGpa: number
  gpaDrop: number
  baseReadiness: number
  simulatedReadiness: number
  readinessDrop: number
  impactReason: string
}
