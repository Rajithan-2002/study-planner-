import { DecisionObject, RiskReport, OpportunityItem, GoalProgress, RecommendationItem, ScenarioSimulationResult } from './types'

export class DecisionIntelligenceEngine {
  
  // 1. Policy & Strategy weights
  static getPolicyWeights(policy: string) {
    switch (policy) {
      case 'ACADEMIC_FIRST':
        return { academic: 0.6, career: 0.2, timeline: 0.2 }
      case 'CAREER_FIRST':
        return { academic: 0.2, career: 0.6, timeline: 0.2 }
      case 'DEADLINE_FIRST':
        return { academic: 0.2, career: 0.2, timeline: 0.6 }
      case 'BALANCED':
      default:
        return { academic: 0.33, career: 0.33, timeline: 0.34 }
    }
  }

  // 2. Pure multi-objective scoring combining constraint satisfaction
  static calculateMultiObjectiveScore(
    urgency: number,
    impact: number,
    effort: number,
    weights: { academic: number; career: number; timeline: number },
    domain: 'ACADEMIC' | 'PROJECT' | 'CERTIFICATION'
  ): number {
    let multiplier = 1.0
    if (domain === 'ACADEMIC') multiplier = weights.academic * 3
    else if (domain === 'CERTIFICATION') multiplier = weights.career * 3
    else if (domain === 'PROJECT') multiplier = weights.timeline * 3

    // High effort slightly reduces score priority if capacity is limited
    const effortPenalty = effort * 0.15
    const baseScore = (urgency * 0.5 + impact * 0.5) * multiplier - effortPenalty

    return Math.max(1.0, Math.min(10.0, Math.round(baseScore * 10) / 10))
  }

  // 3. Compile Decision Object
  static compileDecision(
    userId: string,
    policy: 'BALANCED' | 'ACADEMIC_FIRST' | 'CAREER_FIRST' | 'DEADLINE_FIRST',
    context: {
      academic?: any
      projects?: any
      certifications?: any
      scheduler?: any
      [key: string]: any
    }
  ): DecisionObject {
    const weights = this.getPolicyWeights(policy)
    const risks: RiskReport[] = []
    const opportunities: OpportunityItem[] = []
    const goals: GoalProgress[] = []
    const recommendations: RecommendationItem[] = []

    // ---- RISKS ENGINE ----
    const gpa = context.academic?.gpa ? Number(context.academic.gpa) : null
    if (gpa !== null && gpa < 3.2) {
      risks.push({
        domain: 'ACADEMIC',
        score: 8.5,
        severity: 'HIGH',
        reason: `Your cumulative GPA is currently at ${gpa}, which is below the target threshold.`,
        recommendedAction: 'Schedule extra study focus blocks for your weak modules immediately.'
      })
    }

    const conflictsCount = context.scheduler?.conflictsCount || 0
    if (conflictsCount > 0) {
      risks.push({
        domain: 'SCHEDULE',
        score: 7.2,
        severity: 'HIGH',
        reason: `You have ${conflictsCount} active calendar overlaps or overbooking collisions.`,
        recommendedAction: 'Reschedule or accept the proposed plan to clean up overlapping blocks.'
      })
    }

    // ---- OPPORTUNITIES ENGINE ----
    if (context.scheduler?.workloadZone === 'GREEN') {
      opportunities.push({
        id: 'OPP_1',
        title: 'Unused Study Window Available',
        description: 'Your current workload is under 5 hours. You have capacity for an extra preparation session.',
        impact: 'HIGH',
        confidence: 0.95
      })
    }

    // ---- GOAL EVALUATOR ----
    if (gpa !== null) {
      goals.push({
        name: 'Cumulative GPA Target',
        targetValue: 3.8,
        currentValue: gpa,
        progressPercentage: Math.min(100, Math.round((gpa / 3.8) * 100)),
        deviation: Math.round((gpa - 3.8) * 100) / 100
      })
    }

    // ---- RECOMMENDATION GENERATOR ----
    const academicRec: RecommendationItem = {
      title: 'Prioritize ongoing Module prep',
      description: 'Prepare assignments or review lecture notes to support academic standing.',
      category: 'CRITICAL',
      status: 'GENERATED',
      priorityScore: this.calculateMultiObjectiveScore(8.0, 9.0, 3.0, weights, 'ACADEMIC'),
      urgencyScore: 8.0,
      impactScore: 9.0,
      effortScore: 3.0,
      explainability: {
        metricsUsed: ['gpa', 'ongoingModulesCount'],
        rulesTriggered: ['LowGPATrigger'],
        enginesConsulted: ['academic'],
        confidenceFactor: 0.92,
        assumptions: ['GPA improvements correlate with consistent weekly preparation.']
      }
    }
    recommendations.push(academicRec)

    if (context.certifications?.ongoingPaths?.length > 0) {
      const certRec: RecommendationItem = {
        title: 'Allocate focus for Cert study path',
        description: `Dedicate time blocks to CCNA / AWS preparation to target career objectives.`,
        category: 'OPTIMIZATION',
        status: 'GENERATED',
        priorityScore: this.calculateMultiObjectiveScore(6.0, 8.0, 5.0, weights, 'CERTIFICATION'),
        urgencyScore: 6.0,
        impactScore: 8.0,
        effortScore: 5.0,
        explainability: {
          metricsUsed: ['totalCertifications', 'ongoingPaths'],
          rulesTriggered: ['CareerFocusedPolicy'],
          enginesConsulted: ['certification'],
          confidenceFactor: 0.88,
          assumptions: ['Earning professional certs accelerates graduation milestones.']
        }
      }
      recommendations.push(certRec)
    }

    return {
      userId,
      timestamp: new Date().toISOString(),
      policySelected: policy,
      risks,
      opportunities,
      goals,
      recommendations: recommendations.sort((a, b) => b.priorityScore - a.priorityScore),
      workloadHealth: {
        totalHours: context.scheduler?.totalHours || 0,
        zone: context.scheduler?.workloadZone || 'GREEN'
      },
      explainability: {
        evidenceCount: Object.keys(context).length,
        confidenceIndex: 0.90
      }
    }
  }

  // 4. Scenario simulator logic
  static simulateScenario(
    scenarioName: string,
    baseGpa: number,
    baseReadiness: number
  ): ScenarioSimulationResult {
    let simulatedGpa = baseGpa
    let simulatedReadiness = baseReadiness
    let reason = ''

    if (scenarioName.toLowerCase().includes('skip') || scenarioName.toLowerCase().includes('study')) {
      simulatedGpa = Math.max(1.0, Math.round((baseGpa - 0.15) * 100) / 100)
      simulatedReadiness = Math.max(0, Math.round((baseReadiness - 8.0) * 10) / 10)
      reason = 'Skipping active preparation sessions reduces gpa projections and certification exam readiness due to cumulative load drops.'
    } else {
      simulatedGpa = Math.min(4.0, Math.round((baseGpa + 0.05) * 100) / 100)
      simulatedReadiness = Math.min(100, Math.round((baseReadiness + 5.0) * 10) / 10)
      reason = 'Maintaining active workload balance optimizes gpa targets and schedules readiness targets efficiently.'
    }

    return {
      scenarioName,
      baseGpa,
      simulatedGpa,
      gpaDrop: Math.round((baseGpa - simulatedGpa) * 100) / 100,
      baseReadiness,
      simulatedReadiness,
      readinessDrop: Math.round((baseReadiness - simulatedReadiness) * 10) / 10,
      impactReason: reason
    }
  }
}
