import { IPlatformEngine, EngineResult, SearchItem, TimelineEntry } from '../platform/types'
import { getCertAnalytics, calculateCertificationProgress, calculateExamReadiness } from './engine'
import { createClient } from '@/utils/supabase/server'

export class CertificationPlatformEngine implements IPlatformEngine {
  id = 'certification'

  async calculate(userId: string, context?: any): Promise<EngineResult<any>> {
    try {
      let certs = context?.certs
      let topics = context?.topics
      let subtopics = context?.subtopics
      let sessions = context?.sessions

      const supabase = await createClient()
      if (!certs) {
        const { data } = await supabase.from('certifications').select('*').eq('user_id', userId)
        certs = data || []
      }
      if (!topics) {
        const { data } = await supabase.from('certification_topics').select('*')
        topics = data || []
      }
      if (!subtopics) {
        const { data } = await supabase.from('certification_subtopics').select('*')
        subtopics = data || []
      }
      if (!sessions) {
        const { data } = await supabase.from('certification_study_sessions').select('*')
        sessions = data || []
      }

      const analytics = getCertAnalytics(certs, topics, subtopics, sessions)
      return {
        success: true,
        data: analytics,
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
      let certs = context?.certs
      let topics = context?.topics
      let subtopics = context?.subtopics
      let sessions = context?.sessions

      const supabase = await createClient()
      if (!certs) {
        const { data } = await supabase.from('certifications').select('*').eq('user_id', userId)
        certs = data || []
      }
      if (!topics) {
        const { data } = await supabase.from('certification_topics').select('*')
        topics = data || []
      }
      if (!subtopics) {
        const { data } = await supabase.from('certification_subtopics').select('*')
        subtopics = data || []
      }
      if (!sessions) {
        const { data } = await supabase.from('certification_study_sessions').select('*')
        sessions = data || []
      }

      const activeCerts = certs.filter((c: any) => !c.is_archived && c.status !== 'COMPLETED')
      const analytics = getCertAnalytics(certs, topics, subtopics, sessions)

      return {
        success: true,
        data: {
          activeCount: analytics.activeCount,
          completedCount: analytics.completedCount,
          averageProgress: analytics.averageProgress,
          averageReadiness: analytics.averageReadiness,
          totalStudyHours: analytics.totalStudyHours,
          upcomingExams: activeCerts
            .filter((c: any) => c.exam_date)
            .map((c: any) => ({ id: c.id, name: c.name, examDate: c.exam_date, provider: c.provider }))
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
      const calc = await this.calculate(userId, context)
      if (!calc.success || !calc.data) return calc

      return {
        success: true,
        data: {
          progressPercentage: calc.data.averageProgress,
          completedUnits: calc.data.completedCount,
          remainingUnits: calc.data.activeCount,
          status: calc.data.activeCount > 0 ? 'ACTIVE' : 'IDLE'
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

export class CertificationSearchAdapter {
  entityType = 'CERTIFICATION'
  async search(query: string, userId: string): Promise<SearchItem[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${query}%,provider.ilike.%${query}%`)

      return (data || []).map(c => ({
        id: c.id,
        title: c.name,
        subtitle: `Provider: ${c.provider || 'N/A'} | Status: ${c.status} | Priority: ${c.priority}`,
        entityType: 'CERTIFICATION',
        url: `/certifications`
      }))
    } catch (err) {
      console.error('CertificationSearchAdapter error:', err)
      return []
    }
  }
}

export class CertificationTimelineAdapter {
  entityType = 'CERTIFICATION'
  async getTimeline(userId: string): Promise<TimelineEntry[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      return (data || []).map(c => ({
        id: c.id,
        title: `${c.status === 'COMPLETED' ? 'Completed' : 'Updated'} Certification: ${c.name}`,
        eventDate: c.updated_at || c.created_at,
        type: 'CERT_EVENT',
        importance: c.priority === 'CRITICAL' || c.priority === 'HIGH' ? 3 : 1,
        relatedEntityId: c.id
      }))
    } catch (err) {
      console.error('CertificationTimelineAdapter error:', err)
      return []
    }
  }
}
