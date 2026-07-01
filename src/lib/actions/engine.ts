import { createClient } from '@/utils/supabase/server'
import { ActionItem, ExecutionResult } from './types'
import { PermissionEngine } from './permissions'
import { ExecutionValidator } from './validator'

export class CoreActionEngine {
  static async requestAction(userId: string, actionType: string, parameters: Record<string, any>, targetEntity?: string, targetId?: string): Promise<ActionItem> {
    const supabase = await createClient()

    const perm = PermissionEngine.classifyAction(actionType)
    const initialStatus = PermissionEngine.requiresUserApproval(perm) ? 'WAITING_CONFIRMATION' : 'APPROVED'

    const { data, error } = await supabase.from('ai_actions').insert({
      user_id: userId,
      action_type: actionType,
      target_entity: targetEntity,
      target_id: targetId,
      parameters,
      status: initialStatus
    }).select().single()

    if (error) throw new Error(`Failed to request action: ${error.message}`)

    const item: ActionItem = {
      id: data.id,
      userId: data.user_id,
      actionType: data.action_type,
      targetEntity: data.target_entity,
      targetId: data.target_id,
      parameters: data.parameters,
      status: data.status,
      createdAt: data.created_at
    }

    if (initialStatus === 'APPROVED') {
      await this.executeAction(item)
    }

    return item
  }

  static async executeAction(action: ActionItem): Promise<ExecutionResult> {
    const supabase = await createClient()
    const startTime = Date.now()

    await supabase.from('ai_actions').update({ status: 'RUNNING' }).eq('id', action.id)

    const validation = await ExecutionValidator.validate(action.actionType, action.targetId)
    if (!validation.valid) {
      await supabase.from('ai_actions').update({ status: 'FAILED' }).eq('id', action.id)
      return { success: false, actionId: action.id, errors: [validation.reason || 'Validation failed'], timestamp: new Date().toISOString() }
    }

    // Perform operation through target engine triggers or generic execution
    let createdTargetId = action.targetId
    
    if (action.actionType === 'CREATE_PROJECT') {
      const { data: p, error } = await supabase.from('projects').insert({
        user_id: action.userId,
        name: action.parameters.name || 'New AI Project',
        description: action.parameters.description || null,
        estimated_hours: action.parameters.estimated_total_hours || 0,
        estimated_total_hours: action.parameters.estimated_total_hours || 0,
        target_completion_date: action.parameters.target_completion_date || null,
        priority: action.parameters.priority || 'MEDIUM',
        difficulty: action.parameters.difficulty || 'MEDIUM',
        goal_id: action.parameters.goal_id || null,
        flexible_schedule: action.parameters.flexible_schedule ?? true,
        is_archived: false
      }).select('id').single()
      if (error) throw error
      if (p) createdTargetId = p.id
    } 
    else if (action.actionType === 'CREATE_CERTIFICATION') {
      const { data: c, error } = await supabase.from('certifications').insert({
        user_id: action.userId,
        name: action.parameters.name || 'New AI Certification',
        provider: action.parameters.provider || null,
        estimated_total_hours: action.parameters.estimated_total_hours || 0,
        target_exam_date: action.parameters.target_exam_date || null,
        priority: action.parameters.priority || 'MEDIUM',
        difficulty: action.parameters.difficulty || 'MEDIUM',
        goal_id: action.parameters.goal_id || null,
        flexible_schedule: action.parameters.flexible_schedule ?? true,
        is_archived: false
      }).select('id').single()
      if (error) throw error
      if (c) createdTargetId = c.id
    }
    else if (action.actionType === 'CREATE_DOMAIN') {
      const { data: d, error } = await supabase.from('domains').insert({
        user_id: action.userId,
        name: action.parameters.name || 'New Domain'
      }).select('id').single()
      if (error) throw error
      if (d) createdTargetId = d.id
    }
    else if (action.actionType === 'CREATE_TASK') {
      const { data: t, error } = await supabase.from('tasks').insert({
        user_id: action.userId,
        title: action.parameters.title || 'New AI Task',
        description: action.parameters.description || null,
        priority: action.parameters.priority || 'MEDIUM',
        due_date: action.parameters.due_date || null,
        goal_id: action.parameters.goal_id || null,
        status: 'PENDING'
      }).select('id').single()
      if (error) throw error
      if (t) createdTargetId = t.id
    }
    else if (action.actionType === 'LOG_WORK_SESSION') {
      const { data: ws, error } = await supabase.from('work_sessions').insert({
        user_id: action.userId,
        entity_type: action.parameters.entity_type,
        entity_id: action.parameters.entity_id,
        duration_minutes: action.parameters.duration_minutes || 30,
        status: action.parameters.status || 'COMPLETED',
        notes: action.parameters.notes || null,
        completed_at: new Date().toISOString()
      }).select('id').single()
      if (error) throw error
      if (ws) createdTargetId = ws.id
    }
    else if (action.actionType === 'DELETE_PROJECT') {
      const targetId = action.targetId || action.parameters.entity_id
      const { error } = await supabase.from('projects').update({ is_archived: true }).eq('id', targetId).eq('user_id', action.userId)
      if (error) throw error
    }
    else if (action.actionType === 'DELETE_CERTIFICATION') {
      const targetId = action.targetId || action.parameters.entity_id
      const { error } = await supabase.from('certifications').update({ is_archived: true }).eq('id', targetId).eq('user_id', action.userId)
      if (error) throw error
    }
    else if (action.actionType === 'DELETE_TASK') {
      const targetId = action.targetId || action.parameters.entity_id
      const { error } = await supabase.from('tasks').delete().eq('id', targetId).eq('user_id', action.userId)
      if (error) throw error
    }
    else if (action.actionType === 'UPDATE_CAPACITY') {
      const { error } = await supabase.from('planning_capacity').upsert({
        user_id: action.userId,
        monday_hours: Number(action.parameters.monday_hours ?? action.parameters.weekday_hours ?? 4.0),
        tuesday_hours: Number(action.parameters.tuesday_hours ?? action.parameters.weekday_hours ?? 4.0),
        wednesday_hours: Number(action.parameters.wednesday_hours ?? action.parameters.weekday_hours ?? 4.0),
        thursday_hours: Number(action.parameters.thursday_hours ?? action.parameters.weekday_hours ?? 4.0),
        friday_hours: Number(action.parameters.friday_hours ?? action.parameters.weekday_hours ?? 4.0),
        saturday_hours: Number(action.parameters.saturday_hours ?? action.parameters.saturday_hours ?? 8.0),
        sunday_hours: Number(action.parameters.sunday_hours ?? action.parameters.sunday_hours ?? 6.0),
        maximum_weekly_hours: Number(action.parameters.max_weekly_hours ?? 32.0),
        preferred_focus_block: Number(action.parameters.preferred_focus_block ?? 90),
        minimum_break: Number(action.parameters.minimum_break ?? 15),
        updated_at: new Date().toISOString()
      })
      if (error) throw error
    }
    else if (action.actionType === 'CREATE_RECURRING') {
      const { data: ra, error } = await supabase.from('recurring_activities').insert({
        user_id: action.userId,
        title: action.parameters.title || 'New AI Routine',
        description: action.parameters.description || null,
        type: action.parameters.type || 'HABIT',
        frequency: action.parameters.frequency || 'DAILY',
        days_of_week: action.parameters.days_of_week || null,
        estimated_minutes: Number(action.parameters.estimated_minutes ?? 30),
        priority: action.parameters.priority || 'MEDIUM',
        difficulty: action.parameters.difficulty || 'MEDIUM',
        preferred_time: action.parameters.preferred_time || 'ANYTIME',
        active: true
      }).select('id').single()
      if (error) throw error
      if (ra) createdTargetId = ra.id
    }
    else if (action.actionType === 'LOG_RECURRING') {
      const targetId = action.targetId || action.parameters.entity_id
      const dateStr = action.parameters.date || new Date().toISOString().split('T')[0]
      const { error } = await supabase.from('recurring_activity_logs').upsert({
        recurring_activity_id: targetId,
        date: dateStr,
        completed: action.parameters.completed ?? true,
        skipped: action.parameters.skipped ?? false,
        duration_minutes: action.parameters.completed ? 30 : 0
      }, { onConflict: 'recurring_activity_id,date' })
      if (error) throw error
    }
    else if (action.actionType === 'CREATE_FIXED') {
      const { data: fc, error } = await supabase.from('fixed_commitments').insert({
        user_id: action.userId,
        title: action.parameters.title || 'New AI Commitment',
        description: action.parameters.description || null,
        scheduled_at: new Date(action.parameters.scheduled_at || new Date()).toISOString(),
        duration_minutes: Number(action.parameters.duration_minutes ?? 60),
        category: action.parameters.category || 'LECTURE'
      }).select('id').single()
      if (error) throw error
      if (fc) createdTargetId = fc.id
    }
    else if (action.actionType === 'CREATE_VACATION') {
      const { data: ae, error } = await supabase.from('availability_exceptions').insert({
        user_id: action.userId,
        start_date: action.parameters.start_date || new Date().toISOString().split('T')[0],
        end_date: action.parameters.end_date || new Date().toISOString().split('T')[0],
        capacity_multiplier: Number(action.parameters.capacity_multiplier ?? 0.0),
        notes: action.parameters.notes || null
      }).select('id').single()
      if (error) throw error
      if (ae) createdTargetId = ae.id
    }

    const duration = Date.now() - startTime
    await supabase.from('ai_actions').update({
      status: 'COMPLETED',
      target_id: createdTargetId,
      executed_at: new Date().toISOString()
    }).eq('id', action.id)

    await supabase.from('action_execution_logs').insert({
      action_id: action.id,
      step_name: 'EXECUTION',
      status: 'SUCCESS',
      duration_ms: duration
    })

    return { success: true, actionId: action.id, durationMs: duration, timestamp: new Date().toISOString() }
  }
}
