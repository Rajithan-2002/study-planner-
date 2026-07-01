import { platformRegistry } from '../registry'
import { EngineResult, ProgressMetric } from '../types'

export class ProgressFramework {
  static async getProgressMetrics(userId: string, context?: any): Promise<Record<string, ProgressMetric>> {
    const metrics: Record<string, ProgressMetric> = {}
    const engines = platformRegistry.getEngines()

    await Promise.all(
      engines.map(async engine => {
        try {
          const res: EngineResult<any> = await engine.getMetrics(userId, context)
          if (res.success && res.data) {
            metrics[engine.id] = {
              percentage: res.data.progressPercentage ?? 0,
              completedUnits: res.data.completedUnits ?? 0,
              remainingUnits: res.data.remainingUnits ?? 0,
              status: res.data.status ?? 'ACTIVE',
              updatedAt: res.timestamp
            }
          }
        } catch (err) {
          console.error(`Progress aggregation error on engine ${engine.id}:`, err)
        }
      })
    )

    return metrics
  }
}

export default ProgressFramework
