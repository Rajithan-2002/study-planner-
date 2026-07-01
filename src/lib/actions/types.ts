export type ActionStatus = 
  | 'PENDING' 
  | 'WAITING_CONFIRMATION' 
  | 'APPROVED' 
  | 'RUNNING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'ROLLED_BACK'

export type PermissionLevel = 
  | 'READ_ONLY' 
  | 'SAFE' 
  | 'CONFIRMATION_REQUIRED' 
  | 'HIGH_IMPACT' 
  | 'RESTRICTED'

export interface ActionItem {
  id?: string
  userId: string
  actionType: string
  targetEntity?: string
  targetId?: string
  parameters: Record<string, any>
  status: ActionStatus
  rollbackData?: Record<string, any>
  createdAt?: string
  executedAt?: string
}

export interface ExecutionResult<T = any> {
  success: boolean
  actionId?: string
  data?: T
  errors?: string[]
  durationMs?: number
  timestamp: string
}

export interface WorkflowTemplate {
  id: string
  title: string
  description: string
  workflowSteps: Array<{
    stepName: string
    actionType: string
    parameters: Record<string, any>
  }>
}
