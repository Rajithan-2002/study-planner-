export interface EngineResult<T> {
  success: boolean
  data?: T
  warnings?: string[]
  errors?: string[]
  timestamp: string
}

export interface IPlatformEngine {
  id: string
  calculate(userId: string, context?: any): Promise<EngineResult<any>>
  getSummary(userId: string, context?: any): Promise<EngineResult<any>>
  getMetrics(userId: string, context?: any): Promise<EngineResult<any>>
}

export enum PlatformEvents {
  ACADEMIC_PROFILE_UPDATED = 'ACADEMIC_PROFILE_UPDATED',
  MODULE_COMPLETED = 'MODULE_COMPLETED',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_ARCHIVED = 'PROJECT_ARCHIVED',
  PROJECT_COMPLETED = 'PROJECT_COMPLETED',
  MILESTONE_COMPLETED = 'MILESTONE_COMPLETED',
  KNOWLEDGE_UPLOADED = 'KNOWLEDGE_UPLOADED',
  CERTIFICATION_TOPIC_COMPLETED = 'CERTIFICATION_TOPIC_COMPLETED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  FILE_UPLOADED = 'FILE_UPLOADED',
}

export interface SearchItem {
  id: string
  title: string
  subtitle?: string
  entityType: string
  url?: string
  snippet?: string
  tags?: string[]
}

export interface ISearchAdapter {
  entityType: string
  search(query: string, userId: string): Promise<SearchItem[]>
}

export interface TimelineEntry {
  id: string
  title: string
  eventDate: string
  type: string
  importance: number
  relatedEntityId?: string
}

export interface ITimelineAdapter {
  entityType: string
  getTimeline(userId: string): Promise<TimelineEntry[]>
}

export interface ProgressMetric {
  percentage: number
  completedUnits: number
  remainingUnits: number
  status: string
  updatedAt: string
}
