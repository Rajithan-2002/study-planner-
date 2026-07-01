import { IPlatformEngine, EngineResult, SearchItem, TimelineEntry } from '../../platform/types'
import { DecisionIntelligenceEngine } from './engine'
import { createClient, getCurrentUserId } from '@/utils/supabase/server'

export class DecisionPlatformEngine implements IPlatformEngine {
  id = 'decision'

  async calculate(userId: string, context?: any): Promise<EngineResult<any>> {
    try {
      const supabase = await createClient()

      // Fetch context data across all domains statically
      const { data: userProfile } = await supabase.from('users').select('*').eq('id', userId).single()
      const { data: activeSemesters } = await supabase.from('academic_semesters').select('id').eq('user_id', userId)
      let academicGpa: number | null = null
      if (userProfile?.current_gpa !== null && userProfile?.current_gpa !== undefined) {
        academicGpa = Number(userProfile.current_gpa)
      }

      let ongoingModulesCount = 0
      if (activeSemesters && activeSemesters.length > 0) {
        const { data: modules } = await supabase
          .from('modules')
          .select('id, name, code, status')
          .in('semester_id', activeSemesters.map(s => s.id))
          .eq('status', 'ONGOING')
        ongoingModulesCount = modules?.length || 0
      }

      const { data: certs } = await supabase.from('certifications').select('*').eq('user_id', userId).eq('status', 'ACTIVE')
      const { data: timeBlocks } = await supabase.from('time_blocks').select('*').eq('user_id', userId)

      const activeBlocks = timeBlocks || []
      const totalMins = activeBlocks.reduce((sum, b) => sum + b.duration_minutes, 0)
      const studyMins = activeBlocks.filter(b => b.type === 'STUDY').reduce((sum, b) => sum + b.duration_minutes, 0)

      let workloadZone = 'GREEN'
      if (totalMins > 480) workloadZone = 'RED'
      else if (totalMins > 300) workloadZone = 'YELLOW'

      const decisionContext = {
        academic: {
          gpa: academicGpa,
          ongoingModulesCount
        },
        certifications: {
          totalCertifications: certs?.length || 0,
          ongoingPaths: certs || []
        },
        scheduler: {
          totalHours: Math.round((totalMins / 60) * 10) / 10,
          workloadZone,
          conflictsCount: 0
        }
      }

      const decision = DecisionIntelligenceEngine.compileDecision(userId, 'BALANCED', decisionContext)

      return {
        success: true,
        data: decision,
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
    return this.calculate(userId, context)
  }

  async getMetrics(userId: string, context?: any): Promise<EngineResult<any>> {
    const res = await this.calculate(userId, context)
    if (!res.success || !res.data) return res

    return {
      success: true,
      data: {
        progressPercentage: 100,
        completedUnits: res.data.recommendations.length,
        remainingUnits: res.data.risks.length,
        status: 'ACTIVE'
      },
      timestamp: new Date().toISOString()
    }
  }
}

export class DecisionSearchAdapter {
  entityType = 'DECISION'
  async search(query: string, userId: string): Promise<SearchItem[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)

      return (data || []).map(r => ({
        id: r.id,
        title: r.title,
        subtitle: `Decision Recommendation | Category: ${r.category} | Priority Score: ${r.priority_score}`,
        entityType: 'RECOMMENDATION',
        url: `/`
      }))
    } catch (err) {
      console.error('DecisionSearchAdapter error:', err)
      return []
    }
  }
}

export class DecisionTimelineAdapter {
  entityType = 'DECISION'
  async getTimeline(userId: string): Promise<TimelineEntry[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ACCEPTED')
        .order('created_at', { ascending: false })

      return (data || []).map(r => ({
        id: r.id,
        title: `Accepted AI Recommendation: ${r.title}`,
        eventDate: r.created_at,
        type: 'RECOMMENDATION_ACCEPTED',
        importance: 2,
        relatedEntityId: r.id
      }))
    } catch (err) {
      console.error('DecisionTimelineAdapter error:', err)
      return []
    }
  }
}
