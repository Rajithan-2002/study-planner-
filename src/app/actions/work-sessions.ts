'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { PlanningCapacityEngine } from '@/lib/planning/engine'

export async function logWorkSessionAction(data: {
  entity_type: 'PROJECT' | 'CERTIFICATION' | 'ASSIGNMENT' | 'EXAM' | 'TASK'
  entity_id: string
  duration_minutes: number
  notes?: string
  status?: 'STARTED' | 'PAUSED' | 'COMPLETED' | 'INTERRUPTED'
}) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: session, error } = await supabase.from('work_sessions').insert({
      user_id: userId,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      duration_minutes: data.duration_minutes,
      notes: data.notes || null,
      status: data.status || 'COMPLETED',
      completed_at: new Date().toISOString()
    }).select().single()

    if (error) {
      console.error('Error logging work session:', error)
      return { success: false, error: error.message || 'Failed to log work session' }
    }

    await logActivity('LOG_WORK_SESSION', 'WORK_SESSION', session.id)

    // Rebalance plans dynamically after logging hours
    await PlanningCapacityEngine.rebalancePlans(userId)

    revalidatePath('/')
    revalidatePath('/today')
    revalidatePath('/academic')
    revalidatePath('/projects')
    revalidatePath('/certifications')
    return { success: true, data: session }
  } catch (err: any) {
    console.error('logWorkSessionAction exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}
