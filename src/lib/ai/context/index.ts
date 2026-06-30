import { platformRegistry } from '@/lib/platform/registry'
import { aiConfig } from '../config'

export class ContextBudgetManager {
  static async gatherContext(userId: string, capability: string, query: string): Promise<any> {
    const context: any = { raw_query: query }

    // Resolve engines statically
    const academicEngine = platformRegistry.getEngine('academic')
    const projectEngine = platformRegistry.getEngine('project')
    const certificationEngine = platformRegistry.getEngine('certification')
    const knowledgeEngine = platformRegistry.getEngine('knowledge')
    const schedulerEngine = platformRegistry.getEngine('scheduler')

    // Context allocation rules matching budget configuration
    if (capability === 'ACADEMIC_AUDIT' || capability === 'STUDY_PLANNING') {
      if (academicEngine) {
        const res = await academicEngine.getSummary(userId)
        if (res.success) {
          // Slice or restrict payload to respect token budget limits
          context.academic = {
            gpa: res.data?.gpa,
            ongoingModulesCount: res.data?.ongoingModulesCount,
            recentModules: (res.data?.recentModules || []).slice(0, 3)
          }
        }
      }
    }

    if (capability === 'PROJECT_ANALYSIS' || capability === 'STUDY_PLANNING') {
      if (projectEngine) {
        const res = await projectEngine.getSummary(userId)
        if (res.success) {
          context.projects = {
            totalProjectsCount: res.data?.totalProjectsCount,
            activeProjects: (res.data?.activeProjects || []).slice(0, 3)
          }
        }
      }
    }

    if (capability === 'STUDY_PLANNING') {
      if (certificationEngine) {
        const res = await certificationEngine.getSummary(userId)
        if (res.success) {
          context.certifications = {
            totalCertifications: res.data?.totalCertifications,
            ongoingPaths: (res.data?.ongoingPaths || []).slice(0, 2)
          }
        }
      }
    }

    if (capability === 'KNOWLEDGE_RETRIEVAL' || capability === 'PROJECT_ANALYSIS') {
      if (knowledgeEngine) {
        const res = await knowledgeEngine.getSummary(userId)
        if (res.success) {
          context.knowledge = {
            totalDocumentsCount: res.data?.totalDocumentsCount,
            recentlyUpdated: (res.data?.recentlyUpdated || []).slice(0, 3)
          }
        }
      }
    }

    if (capability === 'TIME_MANAGEMENT' || capability === 'STUDY_PLANNING' || capability === 'ACADEMIC_AUDIT') {
      const { createClient } = await import('@/utils/supabase/server')
      const { PlanningCapacityEngine } = await import('@/lib/planning/engine')
      const dailyPlan = await PlanningCapacityEngine.buildDailyStudyPlan(userId)
      
      const supabase = await createClient()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toLocaleDateString('en-US', { weekday: 'long' })
      const tomorrowDateStr = tomorrow.toISOString().split('T')[0]

      const { data: semesters } = await supabase.from('academic_semesters').select('id').eq('user_id', userId)
      let tomorrowClasses: any[] = []
      if (semesters && semesters.length > 0) {
        const { data: modules } = await supabase.from('modules').select('id, name, code').in('semester_id', semesters.map(s => s.id)).eq('status', 'ONGOING')
        if (modules && modules.length > 0) {
          const { data: sessions } = await supabase.from('timetable_sessions').select('start_time, end_time, location, session_type, module_id').in('module_id', modules.map(m => m.id)).eq('day', tomorrowStr)
          tomorrowClasses = (sessions || []).map(s => ({
            ...s,
            module: modules.find(m => m.id === s.module_id)
          }))
        }
      }

      context.scheduler = {
        todayAgenda: dailyPlan.allocations || [],
        tomorrowPlanDate: tomorrowDateStr,
        tomorrowClasses: tomorrowClasses
      }
    }

    // Always load general dashboard summary for basic sanity context if nothing loaded
    if (Object.keys(context).length <= 1) {
      const summary = await academicEngine?.getSummary(userId)
      if (summary?.success) {
        context.dashboard = { gpa: summary.data?.gpa }
      }
    }

    return context
  }
}
