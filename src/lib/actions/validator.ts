import { createClient } from '@/utils/supabase/server'

export class ExecutionValidator {
  static async validate(actionType: string, targetId?: string): Promise<{ valid: boolean; reason?: string }> {
    if (!targetId) return { valid: true }

    const supabase = await createClient()
    
    // Check if target entity exists where applicable
    if (actionType.includes('PROJECT')) {
      const { data } = await supabase.from('projects').select('id').eq('id', targetId).single()
      if (!data) return { valid: false, reason: `Target project ${targetId} not found.` }
    }

    return { valid: true }
  }
}
