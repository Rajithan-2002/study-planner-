import { PermissionLevel } from './types'

export class PermissionEngine {
  static classifyAction(actionType: string): PermissionLevel {
    const type = actionType.toUpperCase()
    if (type.startsWith('READ_') || type.startsWith('GET_')) return 'READ_ONLY'
    if (
      type === 'CREATE_TASK' || 
      type === 'CREATE_PROJECT' || 
      type === 'CREATE_CERTIFICATION' || 
      type === 'CREATE_DOMAIN' || 
      type === 'LOG_SESSION' || 
      type === 'LOG_WORK_SESSION' || 
      type === 'UPDATE_CAPACITY' || 
      type === 'LOG_RECURRING' || 
      type === 'CREATE_RECURRING' || 
      type === 'CREATE_FIXED' || 
      type === 'CREATE_VACATION'
    ) return 'SAFE'
    if (type.startsWith('DELETE_') || type.startsWith('ARCHIVE_')) return 'CONFIRMATION_REQUIRED'
    if (type === 'PURGE_MEMORIES' || type === 'RESET_ACCOUNT') return 'RESTRICTED'
    return 'CONFIRMATION_REQUIRED'
  }

  static requiresUserApproval(permission: PermissionLevel): boolean {
    return permission === 'CONFIRMATION_REQUIRED' || permission === 'HIGH_IMPACT'
  }
}
