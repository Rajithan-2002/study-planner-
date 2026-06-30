'use server'

import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Capacity settings
export async function savePlanningCapacity(fd: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const payload = {
      user_id: userId,
      monday_hours: Number(fd.get('monday_hours') ?? 4.0),
      tuesday_hours: Number(fd.get('tuesday_hours') ?? 4.0),
      wednesday_hours: Number(fd.get('wednesday_hours') ?? 4.0),
      thursday_hours: Number(fd.get('thursday_hours') ?? 4.0),
      friday_hours: Number(fd.get('friday_hours') ?? 4.0),
      saturday_hours: Number(fd.get('saturday_hours') ?? 8.0),
      sunday_hours: Number(fd.get('sunday_hours') ?? 6.0),
      preferred_focus_block: Number(fd.get('preferred_focus_block') ?? 90),
      minimum_break: Number(fd.get('minimum_break') ?? 15),
      maximum_weekly_hours: Number(fd.get('maximum_weekly_hours') ?? 32.0),
      preferred_start_time: (fd.get('preferred_start_time') as string) || '08:00',
      preferred_end_time: (fd.get('preferred_end_time') as string) || '22:00',
      sleep_time: (fd.get('sleep_time') as string) || '23:00',
      wake_time: (fd.get('wake_time') as string) || '07:00',
      energy_profile: (fd.get('energy_profile') as string) || 'BALANCED',
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase.from('planning_capacity').upsert(payload)
    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
}

// 2. Goal Actions
export async function createGoal(fd: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { error } = await supabase.from('goals').insert({
      user_id: userId,
      title: fd.get('title') as string,
      description: fd.get('description') as string || null,
      target_date: fd.get('target_date') as string || null,
      priority_multiplier: Number(fd.get('priority_multiplier') ?? 1.0),
      status: 'ACTIVE'
    })
    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
}

export async function deleteGoal(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
}

// 3. Recurring Activities Actions
export async function createRecurringActivity(fd: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const daysVal = fd.get('days_of_week') as string
    const daysArray = daysVal ? JSON.parse(daysVal) : null

    const { error } = await supabase.from('recurring_activities').insert({
      user_id: userId,
      title: fd.get('title') as string,
      description: fd.get('description') as string || null,
      type: fd.get('type') as string || 'HABIT',
      frequency: fd.get('frequency') as string || 'DAILY',
      days_of_week: daysArray,
      estimated_minutes: Number(fd.get('estimated_minutes') ?? 30),
      priority: fd.get('priority') as string || 'MEDIUM',
      difficulty: fd.get('difficulty') as string || 'MEDIUM',
      preferred_time: fd.get('preferred_time') as string || 'ANYTIME',
      active: true
    })
    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
}

export async function toggleRecurringActivity(id: string, active: boolean) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    const { error } = await supabase.from('recurring_activities').update({ active }).eq('id', id).eq('user_id', userId)
    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
}

export async function deleteRecurringActivity(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    const { error } = await supabase.from('recurring_activities').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
}

// 4. Log/Skip habits
export async function logRecurringActivity(activityId: string, dateStr: string, completed: boolean, skipped: boolean, notes: string | null = null) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('recurring_activity_logs').upsert({
      recurring_activity_id: activityId,
      date: dateStr,
      completed,
      skipped,
      notes,
      duration_minutes: completed ? 30 : 0
    }, { onConflict: 'recurring_activity_id,date' })
    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
}

// 5. Fixed Commitments Actions
export async function createFixedCommitment(fd: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { error } = await supabase.from('fixed_commitments').insert({
      user_id: userId,
      title: fd.get('title') as string,
      description: fd.get('description') as string || null,
      scheduled_at: new Date(fd.get('scheduled_at') as string).toISOString(),
      duration_minutes: Number(fd.get('duration_minutes') ?? 60),
      category: fd.get('category') as string || 'LECTURE'
    })
    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
}

export async function deleteFixedCommitment(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    const { error } = await supabase.from('fixed_commitments').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
}

// 6. Vacation Exceptions Actions
export async function createAvailabilityException(fd: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { error } = await supabase.from('availability_exceptions').insert({
      user_id: userId,
      start_date: fd.get('start_date') as string,
      end_date: fd.get('end_date') as string,
      capacity_multiplier: Number(fd.get('capacity_multiplier') ?? 0.0),
      notes: fd.get('notes') as string || null
    })
    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
}

export async function deleteAvailabilityException(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    const { error } = await supabase.from('availability_exceptions').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
}

// 7. Bulk Data Fetcher
export async function getPlanningCenterData() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const [
    capacityRes,
    goalsRes,
    recurringRes,
    fixedRes,
    vacationRes,
    decisionsRes
  ] = await Promise.all([
    supabase.from('planning_capacity').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('recurring_activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('fixed_commitments').select('*').eq('user_id', userId).order('scheduled_at', { ascending: true }),
    supabase.from('availability_exceptions').select('*').eq('user_id', userId).order('start_date', { ascending: true }),
    supabase.from('planning_decisions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
  ])

  // Get active recurring logs for streak and stats calculation (last 30 days)
  let logs: any[] = []
  if (recurringRes.data && recurringRes.data.length > 0) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: logsData } = await supabase
      .from('recurring_activity_logs')
      .select('*')
      .in('recurring_activity_id', recurringRes.data.map(r => r.id))
      .gte('date', thirtyDaysAgoStr)
    logs = logsData || []
  }

  return {
    capacity: capacityRes.data || null,
    goals: goalsRes.data || [],
    recurring: recurringRes.data || [],
    recurringLogs: logs,
    fixed: fixedRes.data || [],
    vacation: vacationRes.data || [],
    decisions: decisionsRes.data || []
  }
}

export async function runPlanningSimulationAction(estimatedHours: number, deadlineStr: string, weeklyAdjust: number = 0) {
  const { PlanningCapacityEngine } = await import('@/lib/planning/engine')
  const userId = await getCurrentUserId()
  return await PlanningCapacityEngine.runPlanningSimulation(userId, estimatedHours, deadlineStr, weeklyAdjust)
}
