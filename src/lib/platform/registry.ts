import { IPlatformEngine, ISearchAdapter, ITimelineAdapter, SearchItem, TimelineEntry } from './types'
import { AcademicPlatformEngine, AcademicSearchAdapter, AcademicTimelineAdapter } from '../academic/platform-engine'
import { ProjectPlatformEngine, ProjectSearchAdapter, ProjectTimelineAdapter } from '../project/platform-engine'
import { CertificationPlatformEngine, CertificationSearchAdapter, CertificationTimelineAdapter } from '../certification/platform-engine'
import { KnowledgePlatformEngine, KnowledgeSearchAdapter, KnowledgeTimelineAdapter } from '../knowledge/platform-engine'
import { SchedulerPlatformEngine, SchedulerSearchAdapter, SchedulerTimelineAdapter } from '../scheduler/platform-engine'
import { DecisionPlatformEngine, DecisionSearchAdapter, DecisionTimelineAdapter } from '../ai/decision/platform-engine'
import { RAGPlatformEngine, RAGSearchAdapter, RAGTimelineAdapter } from '../rag/platform-engine'
import { MemoryPlatformEngine, MemorySearchAdapter, MemoryTimelineAdapter } from '../memory/platform-engine'
import { ActionPlatformEngine, ActionSearchAdapter, ActionTimelineAdapter } from '../actions/platform-engine'

class PlatformRegistry {
  private engines: Map<string, IPlatformEngine> = new Map()
  private searchAdapters: Map<string, ISearchAdapter> = new Map()
  private timelineAdapters: Map<string, ITimelineAdapter> = new Map()

  constructor() {
    // Statically register default platform engines and adapters
    this.registerEngine(new AcademicPlatformEngine())
    this.registerEngine(new ProjectPlatformEngine())
    this.registerEngine(new CertificationPlatformEngine())
    this.registerEngine(new KnowledgePlatformEngine())
    this.registerEngine(new SchedulerPlatformEngine())
    this.registerEngine(new DecisionPlatformEngine())
    this.registerEngine(new RAGPlatformEngine())
    this.registerEngine(new MemoryPlatformEngine())
    this.registerEngine(new ActionPlatformEngine())

    this.registerSearchAdapter(new AcademicSearchAdapter())
    this.registerSearchAdapter(new ProjectSearchAdapter())
    this.registerSearchAdapter(new CertificationSearchAdapter())
    this.registerSearchAdapter(new KnowledgeSearchAdapter())
    this.registerSearchAdapter(new SchedulerSearchAdapter())
    this.registerSearchAdapter(new DecisionSearchAdapter())
    this.registerSearchAdapter(new RAGSearchAdapter())
    this.registerSearchAdapter(new MemorySearchAdapter())
    this.registerSearchAdapter(new ActionSearchAdapter())

    this.registerTimelineAdapter(new AcademicTimelineAdapter())
    this.registerTimelineAdapter(new ProjectTimelineAdapter())
    this.registerTimelineAdapter(new CertificationTimelineAdapter())
    this.registerTimelineAdapter(new KnowledgeTimelineAdapter())
    this.registerTimelineAdapter(new SchedulerTimelineAdapter())
    this.registerTimelineAdapter(new DecisionTimelineAdapter())
    this.registerTimelineAdapter(new RAGTimelineAdapter())
    this.registerTimelineAdapter(new MemoryTimelineAdapter())
    this.registerTimelineAdapter(new ActionTimelineAdapter())
  }

  // Engines
  registerEngine(engine: IPlatformEngine) {
    this.engines.set(engine.id, engine)
  }

  getEngine(id: string): IPlatformEngine | undefined {
    return this.engines.get(id)
  }

  getEngines(): IPlatformEngine[] {
    return Array.from(this.engines.values())
  }

  // Search Adapters
  registerSearchAdapter(adapter: ISearchAdapter) {
    this.searchAdapters.set(adapter.entityType, adapter)
  }

  getSearchAdapters(): ISearchAdapter[] {
    return Array.from(this.searchAdapters.values())
  }

  async queryAll(query: string, userId: string): Promise<SearchItem[]> {
    const results = await Promise.all(
      this.getSearchAdapters().map(async adapter => {
        try {
          return await adapter.search(query, userId)
        } catch (err) {
          console.error(`Search error on adapter ${adapter.entityType}:`, err)
          return []
        }
      })
    )
    return results.flat()
  }

  // Timeline Adapters
  registerTimelineAdapter(adapter: ITimelineAdapter) {
    this.timelineAdapters.set(adapter.entityType, adapter)
  }

  getTimelineAdapters(): ITimelineAdapter[] {
    return Array.from(this.timelineAdapters.values())
  }

  async getCombinedTimeline(userId: string): Promise<TimelineEntry[]> {
    const results = await Promise.all(
      this.getTimelineAdapters().map(async adapter => {
        try {
          return await adapter.getTimeline(userId)
        } catch (err) {
          console.error(`Timeline error on adapter ${adapter.entityType}:`, err)
          return []
        }
      })
    )
    return results.flat().sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
  }
}

export const platformRegistry = new PlatformRegistry()
export default platformRegistry
