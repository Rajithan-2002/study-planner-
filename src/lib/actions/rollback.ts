import { createClient } from '@/utils/supabase/server'
import { ActionItem } from './types'

export class RollbackEngine {
  static async performRollback(action: ActionItem): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    try {
      if (action.actionType === 'CREATE_PROJECT' && action.targetId) {
        await supabase.from('projects').delete().eq('id', action.targetId)
      } else if (action.actionType === 'CREATE_TASK' && action.targetId) {
        await supabase.from('tasks').delete().eq('id', action.targetId)
      }

      await supabase.from('ai_actions').update({ status: 'ROLLED_BACK' }).eq('id', action.id)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }
}
