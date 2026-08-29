'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateFocusSessions, detectConflicts } from '@/lib/scheduler/engine'
import { PlanningCapacityEngine } from '@/lib/planning/engine'

// TIME BLOCK CRUD
export async function createTimeBlock(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const title = formData.get('title') as string
    const type = formData.get('type') as string || 'DEEP_WORK'
    const scheduledAt = formData.get('scheduled_at') as string
    const durationMinutes = Number(formData.get('duration_minutes'))
    const isLocked = formData.get('is_locked') === 'true'
    const relatedEntityType = formData.get('related_entity_type') as string | null
    const relatedEntityId = formData.get('related_entity_id') as string | null

    if (!title || !scheduledAt || isNaN(durationMinutes) || durationMinutes <= 0) {
      return { success: false, error: 'Title, scheduled time, and positive duration are required' }
    }

    const { data: block, error } = await supabase.from('time_blocks').insert({
      user_id: userId,
      title,
      type,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      is_locked: isLocked,
      related_entity_type: relatedEntityType || null,
      related_entity_id: relatedEntityId || null,
      status: 'PENDING'
    }).select().single()

    if (error) {
      console.error('Error creating time block:', error)
      return { success: false, error: error.message || 'Failed to create time block' }
    }

    await logActivity('CREATE_TIME_BLOCK', 'TIME_BLOCK', block.id)

    // Detect conflicts after insert
    await runConflictDetection(userId)

    revalidatePath('/today')
    revalidatePath('/')
    return { success: true, data: block }
  } catch (err: any) {
    console.error('createTimeBlock exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function updateTimeBlock(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const blockId = formData.get('block_id') as string
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const scheduledAt = formData.get('scheduled_at') as string
    const durationMinutes = Number(formData.get('duration_minutes'))
    const isLocked = formData.get('is_locked') === 'true'
    const status = formData.get('status') as string

    if (!blockId || !title || !scheduledAt || isNaN(durationMinutes)) {
      return { success: false, error: 'Required fields missing' }
    }

    const { data: block, error } = await supabase
      .from('time_blocks')
      .update({
        title,
        type,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        is_locked: isLocked,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', blockId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating time block:', error)
      return { success: false, error: error.message || 'Failed to update time block' }
    }

    await runConflictDetection(userId)

    revalidatePath('/today')
    revalidatePath('/')
    return { success: true, data: block }
  } catch (err: any) {
    console.error('updateTimeBlock exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function toggleTimeBlockStatus(id: string, currentStatus: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED'

    const { data, error } = await supabase
      .from('time_blocks')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error toggling block status:', error)
      return { success: false, error: error.message || 'Failed to toggle time block status' }
    }

    if (nextStatus === 'COMPLETED') {
      await logActivity('COMPLETE_FOCUS_SESSION', 'TIME_BLOCK', id)
    }

    revalidatePath('/today')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('toggleTimeBlockStatus exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function deleteTimeBlock(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { error } = await supabase.from('time_blocks').delete().eq('id', id).eq('user_id', userId)

    if (error) {
      console.error('Error deleting time block:', error)
      return { success: false, error: error.message || 'Failed to delete time block' }
    }

    await runConflictDetection(userId)

    revalidatePath('/today')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('deleteTimeBlock exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

// USER PREFERENCES
export async function saveSchedulerPreferences(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const preferredFocusTime = formData.get('preferred_focus_time') as string || 'MORNING'
    const maxDailyStudyHours = Number(formData.get('max_daily_study_hours')) || 4.0
    const maxDailyProjectHours = Number(formData.get('max_daily_project_hours')) || 3.0
    const bufferMinutes = Number(formData.get('buffer_minutes')) || 10
    const sleepStart = formData.get('sleep_start_time') as string || '23:00'
    const sleepEnd = formData.get('sleep_end_time') as string || '07:00'
    const workStart = formData.get('work_start_time') as string || '08:00'
    const workEnd = formData.get('work_end_time') as string || '18:00'

    // Upsert preferences
    const { data: existing } = await supabase.from('user_schedule_preferences').select('id').eq('user_id', userId).maybeSingle()

    let resError: any
    if (existing) {
      const { error } = await supabase.from('user_schedule_preferences').update({
        preferred_focus_time: preferredFocusTime,
        max_daily_study_hours: maxDailyStudyHours,
        max_daily_project_hours: maxDailyProjectHours,
        buffer_minutes: bufferMinutes,
        sleep_start_time: sleepStart,
        sleep_end_time: sleepEnd,
        work_start_time: workStart,
        work_end_time: workEnd,
        updated_at: new Date().toISOString()
      }).eq('id', existing.id)
      resError = error
    } else {
      const { error } = await supabase.from('user_schedule_preferences').insert({
        user_id: userId,
        preferred_focus_time: preferredFocusTime,
        max_daily_study_hours: maxDailyStudyHours,
        max_daily_project_hours: maxDailyProjectHours,
        buffer_minutes: bufferMinutes,
        sleep_start_time: sleepStart,
        sleep_end_time: sleepEnd,
        work_start_time: workStart,
        work_end_time: workEnd
      })
      resError = error
    }

    if (resError) {
      console.error('Error saving scheduler preferences:', resError)
      return { success: false, error: resError.message || 'Failed to save preferences' }
    }

    revalidatePath('/today')
    return { success: true }
  } catch (err: any) {
    console.error('saveSchedulerPreferences exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function saveSpecialPlan(name: string, dailyHours: number, tasks: { name: string; hours: number; note?: string; type?: string }[]) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const planData = {
      name,
      dailyHours,
      tasks
    }

    const { data, error } = await supabase.from('generated_plans').insert({
      user_id: userId,
      plan_date: new Date().toISOString().split('T')[0],
      type: 'SPECIAL',
      status: 'SAVED',
      plan_data: planData
    }).select().single()

    if (error) {
      console.error('Error saving special plan:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/today')
    return { success: true, data }
  } catch (err: any) {
    console.error('saveSpecialPlan exception:', err)
    return { success: false, error: err.message }
  }
}

export async function getSpecialPlans() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data } = await supabase
      .from('generated_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'SPECIAL')
      .eq('status', 'SAVED')
      .order('created_at', { ascending: false })

    return data || []
  } catch (err: any) {
    console.error('getSpecialPlans exception:', err)
    return []
  }
}

// PROPOSE & ACCEPT STRATEGY PLANS
export async function proposeDailyPlan(planDateStr: string, strategy: string = 'BALANCED', skipRevalidate = false) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    // 1. Fetch preferences
    let { data: prefs } = await supabase.from('user_schedule_preferences').select('*').eq('user_id', userId).maybeSingle()
    if (!prefs) {
      prefs = {
        preferred_focus_time: 'MORNING',
        max_daily_study_hours: 4.0,
        max_daily_project_hours: 3.0,
        buffer_minutes: 10,
        work_start_time: '08:00',
        work_end_time: '18:00'
      }
    }

    let proposedTimeline: any[] = []

    if (strategy.startsWith('SPECIAL_')) {
      // Custom Special Plan created by the user, stored in generated_plans
      const specialPlanId = strategy.replace('SPECIAL_', '')
      const { data: specPlan } = await supabase
        .from('generated_plans')
        .select('*')
        .eq('id', specialPlanId)
        .eq('user_id', userId)
        .maybeSingle()

      if (specPlan && specPlan.plan_data && Array.isArray(specPlan.plan_data.tasks)) {
        const baseHour = prefs.work_start_time ? Number(prefs.work_start_time.split(':')[0]) : 9
        let currentHour = baseHour
        let currentMin = 0

        proposedTimeline = specPlan.plan_data.tasks.map((t: any) => {
          const durationMins = Math.round((t.hours || 1) * 60)
          const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
          const scheduledTime = new Date(`${planDateStr}T${timeStr}:00`)

          currentMin += durationMins
          if (currentMin >= 60) {
            currentHour += Math.floor(currentMin / 60)
            currentMin = currentMin % 60
          }

          return {
            title: `${t.name} (${t.hours >= 1 ? `${t.hours}h` : `${t.hours * 60}m`})`,
            type: t.type || 'STUDY',
            status: 'PENDING',
            duration_minutes: durationMins,
            is_locked: false,
            scheduled_at: scheduledTime.toISOString(),
            reason: t.note || `${specPlan.plan_data.name} item`,
            energy_zone: 'HIGH'
          }
        })
      }
    } else {
      // Default: capacity-engine-driven daily study plan
      const dailyPlan = await PlanningCapacityEngine.buildDailyStudyPlan(userId)

      const baseHour = prefs.work_start_time ? Number(prefs.work_start_time.split(':')[0]) : 8
      let currentHour = baseHour
      let currentMin = 0

      proposedTimeline = dailyPlan.allocations.map((alloc) => {
        const scheduledTime = new Date(`${planDateStr}T${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}:00`)

        const durationMins = alloc.allocated_minutes
        currentMin += durationMins
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60)
          currentMin = currentMin % 60
        }

        return {
          title: `${alloc.name} [${alloc.type}]`,
          type: alloc.type === 'PROJECT' ? 'PROJECT' : alloc.type === 'CERTIFICATION' ? 'STUDY' : 'DEEP_WORK',
          status: 'PENDING',
          duration_minutes: durationMins,
          is_locked: false,
          related_entity_type: alloc.type,
          related_entity_id: alloc.id,
          scheduled_at: scheduledTime.toISOString(),
          reason: alloc.reason,
          energy_zone: alloc.energy_zone
        }
      })
    }

    // Upsert PROPOSED plan
    const planDate = new Date(planDateStr).toISOString().split('T')[0]
    const { data: existingPlan } = await supabase
      .from('generated_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('plan_date', planDate)
      .eq('type', 'DAILY')
      .maybeSingle()

    let plan: any
    if (existingPlan) {
      const { data, error } = await supabase
        .from('generated_plans')
        .update({
          status: 'PROPOSED',
          plan_data: proposedTimeline
        })
        .eq('id', existingPlan.id)
        .select()
        .single()
      plan = data
    } else {
      const { data, error } = await supabase
        .from('generated_plans')
        .insert({
          user_id: userId,
          plan_date: planDate,
          type: 'DAILY',
          status: 'PROPOSED',
          plan_data: proposedTimeline
        })
        .select()
        .single()
      plan = data
    }

    await logActivity('PROPOSE_DAILY_PLAN', 'GENERATED_PLAN', plan.id)

    if (!skipRevalidate) {
      try {
        revalidatePath('/today')
      } catch {
        // Ignored when called during Server Component render pass
      }
    }

    return { success: true, data: plan }
  } catch (err: any) {
    console.error('proposeDailyPlan exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function acceptDailyPlan(planId: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    // Retrieve plan details
    const { data: plan } = await supabase.from('generated_plans').select('*').eq('id', planId).eq('user_id', userId).single()
    if (!plan) return { success: false, error: 'Proposed plan not found' }

    // Clear old flexible time blocks for this day to prevent clutter
    const dateStr = new Date(plan.plan_date).toISOString().split('T')[0]
    await supabase
      .from('time_blocks')
      .delete()
      .eq('user_id', userId)
      .eq('is_locked', false)
      .gte('scheduled_at', `${dateStr}T00:00:00Z`)
      .lte('scheduled_at', `${dateStr}T23:59:59Z`)

    // Insert new accepted time blocks
    const blocksToInsert = (plan.plan_data || []).map((b: any) => ({
      user_id: userId,
      title: b.title,
      type: b.type,
      status: 'PENDING',
      scheduled_at: b.scheduled_at,
      duration_minutes: b.duration_minutes,
      is_locked: b.is_locked || false,
      related_entity_type: b.related_entity_type || null,
      related_entity_id: b.related_entity_id || null
    }))

    if (blocksToInsert.length > 0) {
      await supabase.from('time_blocks').insert(blocksToInsert)
    }

    // Set generated plan status to ACCEPTED
    await supabase.from('generated_plans').update({ status: 'ACCEPTED' }).eq('id', planId)

    await logActivity('ACCEPT_DAILY_PLAN', 'GENERATED_PLAN', planId)
    
    await runConflictDetection(userId)

    revalidatePath('/today')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('acceptDailyPlan exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

// CONFLICT ENGINE HELPER
async function runConflictDetection(userId: string) {
  try {
    const supabase = await createClient()

    // 1. Fetch blocks
    const { data: timeBlocks } = await supabase.from('time_blocks').select('*').eq('user_id', userId)
    if (!timeBlocks) return

    // 2. Detect overlaps/capacity warnings
    const detected = detectConflicts(timeBlocks)

    // 3. Clear old conflicts
    await supabase.from('schedule_conflicts').delete().eq('user_id', userId)

    // 4. Save new conflicts
    if (detected.length > 0) {
      const inserts = detected.map(c => ({
        user_id: userId,
        title: c.title,
        description: c.description,
        severity: c.severity
      }))
      await supabase.from('schedule_conflicts').insert(inserts)
    }
  } catch (err) {
    console.error('Conflict detection failed:', err)
  }
}

export async function postponeTimeBlock(blockId: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: block, error: fetchErr } = await supabase
      .from('time_blocks')
      .select('*')
      .eq('id', blockId)
      .eq('user_id', userId)
      .single()

    if (fetchErr || !block) {
      throw new Error('Block not found')
    }

    const currentDate = new Date(block.scheduled_at)
    currentDate.setDate(currentDate.getDate() + 1)
    const newScheduledAt = currentDate.toISOString()

    const { error: updateErr } = await supabase
      .from('time_blocks')
      .update({
        scheduled_at: newScheduledAt,
        status: 'PENDING',
        updated_at: new Date().toISOString()
      })
      .eq('id', blockId)

    if (updateErr) {
      throw new Error(updateErr.message)
    }

    revalidatePath('/today')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('postponeTimeBlock exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}
