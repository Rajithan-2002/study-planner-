'use server'

import { getCurrentUserId } from '@/utils/supabase/server'
import { CoreActionEngine } from '@/lib/actions/engine'
import { RollbackEngine } from '@/lib/actions/rollback'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function planAndExecuteAction(actionType: string, parameters: Record<string, any>, targetEntity?: string, targetId?: string) {
  try {
    const userId = await getCurrentUserId()
    const item = await CoreActionEngine.requestAction(userId, actionType, parameters, targetEntity, targetId)
    revalidatePath('/automation')
    revalidatePath('/')
    return { success: true, data: item }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function approveAction(actionId: string) {
  try {
    const supabase = await createClient()
    const { data: action } = await supabase.from('ai_actions').select('*').eq('id', actionId).single()
    if (!action) return { success: false, error: 'Action not found' }

    const item = {
      id: action.id,
      userId: action.user_id,
      actionType: action.action_type,
      targetEntity: action.target_entity,
      targetId: action.target_id,
      parameters: action.parameters,
      status: action.status
    }

    const res = await CoreActionEngine.executeAction(item)
    revalidatePath('/automation')
    revalidatePath('/')
    return res
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function rollbackAction(actionId: string) {
  try {
    const supabase = await createClient()
    const { data: action } = await supabase.from('ai_actions').select('*').eq('id', actionId).single()
    if (!action) return { success: false, error: 'Action not found' }

    const item = {
      id: action.id,
      userId: action.user_id,
      actionType: action.action_type,
      targetEntity: action.target_entity,
      targetId: action.target_id,
      parameters: action.parameters,
      status: action.status
    }

    const res = await RollbackEngine.performRollback(item)
    revalidatePath('/automation')
    revalidatePath('/')
    return res
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function deleteAutonomousAction(actionId: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    const { error } = await supabase
      .from('ai_actions')
      .delete()
      .eq('id', actionId)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    revalidatePath('/automation')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}

