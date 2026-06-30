import { platformRegistry } from '../registry'
import { EngineResult } from '../types'

export interface DashboardSnapshot {
  academic?: any
  projects?: any
  certifications?: any
  knowledge?: any
  decisions?: any
  rag?: any
  memory?: any
  actions?: any
  tasks?: any[]
  timeline?: any[]
  upcomingDeadlines?: any[]
  dailyFocus?: any
  progress?: any
  statistics?: any
  timestamp: string
}

class DashboardCache {
  private cache: Map<string, { data: DashboardSnapshot; expiresAt: number }> = new Map()

  get(userId: string): DashboardSnapshot | null {
    const cached = this.cache.get(userId)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }
    return null
  }

  set(userId: string, data: DashboardSnapshot, ttlMs: number = 5000) {
    this.cache.set(userId, { data, expiresAt: Date.now() + ttlMs })
  }

  invalidate(userId: string) {
    this.cache.delete(userId)
  }
}

export const dashboardCache = new DashboardCache()

export class DashboardAggregator {
  static async getSnapshot(userId: string, forceRefresh = false): Promise<DashboardSnapshot> {
    if (!forceRefresh) {
      const cached = dashboardCache.get(userId)
      if (cached) return cached
    }

    const snapshot: DashboardSnapshot = {
      timestamp: new Date().toISOString()
    }

    const academicEngine = platformRegistry.getEngine('academic')
    const projectEngine = platformRegistry.getEngine('project')
    const certificationEngine = platformRegistry.getEngine('certification')
    const knowledgeEngine = platformRegistry.getEngine('knowledge')

    if (academicEngine) {
      const res = await academicEngine.getSummary(userId)
      if (res.success) snapshot.academic = res.data
    }

    if (projectEngine) {
      const res = await projectEngine.getSummary(userId)
      if (res.success) snapshot.projects = res.data
    }

    if (certificationEngine) {
      const res = await certificationEngine.getSummary(userId)
      if (res.success) snapshot.certifications = res.data
    }

    if (knowledgeEngine) {
      const res = await knowledgeEngine.getSummary(userId)
      if (res.success) snapshot.knowledge = res.data
    }

    const decisionEngine = platformRegistry.getEngine('decision')
    if (decisionEngine) {
      const res = await decisionEngine.getSummary(userId)
      if (res.success) snapshot.decisions = res.data
    }

    const ragEngine = platformRegistry.getEngine('rag')
    if (ragEngine) {
      const res = await ragEngine.getSummary(userId)
      if (res.success) snapshot.rag = res.data
    }

    const memoryEngine = platformRegistry.getEngine('memory')
    if (memoryEngine) {
      const res = await memoryEngine.getSummary(userId)
      if (res.success) snapshot.memory = res.data
    }

    const actionEngine = platformRegistry.getEngine('action')
    if (actionEngine) {
      const res = await actionEngine.getSummary(userId)
      if (res.success) snapshot.actions = res.data
    }

    snapshot.timeline = await platformRegistry.getCombinedTimeline(userId)

    dashboardCache.set(userId, snapshot)
    return snapshot
  }
}
