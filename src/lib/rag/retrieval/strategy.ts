import { RetrievalStrategyType } from '../types'

export class RetrievalStrategyEngine {
  static selectStrategy(query: string): RetrievalStrategyType {
    const q = query.toLowerCase()
    
    if (q.includes('summary') || q.includes('overview') || q.includes('all')) {
      return 'HYBRID'
    }
    if (q.includes('connect') || q.includes('link') || q.includes('relationship')) {
      return 'GRAPH'
    }
    if (q.includes('date') || q.includes('semester') || q.includes('module')) {
      return 'METADATA'
    }
    
    return 'HYBRID'
  }
}
