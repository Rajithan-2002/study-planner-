import { ActionItem } from './types'

export class ActionPlanner {
  static planAction(actionType: string, params: Record<string, any>): {
    estimatedDurationMs: number
    requiredTools: string[]
    supportsRollback: boolean
  } {
    switch (actionType.toUpperCase()) {
      case 'CREATE_PROJECT':
      case 'CREATE_TASK':
      case 'CREATE_STUDY_SESSION':
        return { estimatedDurationMs: 150, requiredTools: ['database_write'], supportsRollback: true }
      case 'ARCHIVE_PROJECT':
      case 'DELETE_TASK':
        return { estimatedDurationMs: 200, requiredTools: ['database_update'], supportsRollback: true }
      default:
        return { estimatedDurationMs: 100, requiredTools: ['general'], supportsRollback: false }
    }
  }
}
