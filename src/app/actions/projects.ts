'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const name = formData.get('name') as string
    const domainId = formData.get('domain_id') as string | null
    const category = formData.get('category') as string | null
    const priority = formData.get('priority') as string || 'LOW'
    const status = formData.get('status') as string || 'IDEA'
    const description = formData.get('description') as string | null
    const notes = formData.get('notes') as string | null
    const targetCompletionDate = formData.get('target_completion_date') as string | null
    const estimatedHours = formData.get('estimated_hours') ? Number(formData.get('estimated_hours')) : 0
    const estimatedTotalHours = formData.get('estimated_total_hours') ? Number(formData.get('estimated_total_hours')) : estimatedHours
    const weeklyTargetHours = formData.get('weekly_target_hours') ? Number(formData.get('weekly_target_hours')) : 0
    const dailyFocusMinutes = formData.get('daily_focus_minutes') ? Number(formData.get('daily_focus_minutes')) : 0
    const difficulty = formData.get('difficulty') as string || 'MEDIUM'
    const flexibleSchedule = formData.get('flexible_schedule') !== 'false'
    const goalId = formData.get('goal_id') as string | null
    const minimumWeeklyHours = formData.get('minimum_weekly_hours') ? Number(formData.get('minimum_weekly_hours')) : null
    const maximumWeeklyHours = formData.get('maximum_weekly_hours') ? Number(formData.get('maximum_weekly_hours')) : null
    const rawTags = formData.get('tags') as string | null
    const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

    if (!name) {
      return { success: false, error: 'Project name is required' }
    }

    const { data, error } = await supabase.from('projects').insert({
      user_id: userId,
      name,
      domain_id: domainId || null,
      category: category || null,
      priority,
      status,
      description: description || null,
      notes: notes || null,
      target_completion_date: targetCompletionDate || null,
      estimated_hours: estimatedTotalHours,
      estimated_total_hours: estimatedTotalHours,
      weekly_target_hours: weeklyTargetHours,
      daily_focus_minutes: dailyFocusMinutes,
      difficulty,
      flexible_schedule: flexibleSchedule,
      goal_id: goalId || null,
      minimum_weekly_hours: minimumWeeklyHours,
      maximum_weekly_hours: maximumWeeklyHours,
      tags,
      is_archived: false
    }).select().single()

    if (error) {
      console.error('Error creating project:', error)
      return { success: false, error: error.message || 'Failed to create project' }
    }

    await logActivity('CREATE_PROJECT', 'PROJECT', data.id)

    revalidatePath('/projects')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('Project creation exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function updateProject(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const projectId = formData.get('project_id') as string
    const name = formData.get('name') as string
    const domainId = formData.get('domain_id') as string | null
    const category = formData.get('category') as string | null
    const priority = formData.get('priority') as string || 'LOW'
    const status = formData.get('status') as string || 'ACTIVE'
    const description = formData.get('description') as string | null
    const notes = formData.get('notes') as string | null
    const targetCompletionDate = formData.get('target_completion_date') as string | null
    const estimatedHours = formData.get('estimated_hours') ? Number(formData.get('estimated_hours')) : 0
    const estimatedTotalHours = formData.get('estimated_total_hours') ? Number(formData.get('estimated_total_hours')) : estimatedHours
    const weeklyTargetHours = formData.get('weekly_target_hours') ? Number(formData.get('weekly_target_hours')) : 0
    const dailyFocusMinutes = formData.get('daily_focus_minutes') ? Number(formData.get('daily_focus_minutes')) : 0
    const difficulty = formData.get('difficulty') as string || 'MEDIUM'
    const flexibleSchedule = formData.get('flexible_schedule') !== 'false'
    const goalId = formData.get('goal_id') as string | null
    const minimumWeeklyHours = formData.get('minimum_weekly_hours') ? Number(formData.get('minimum_weekly_hours')) : null
    const maximumWeeklyHours = formData.get('maximum_weekly_hours') ? Number(formData.get('maximum_weekly_hours')) : null
    const rawTags = formData.get('tags') as string | null
    const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

    if (!projectId || !name) {
      return { success: false, error: 'Project ID and name are required' }
    }

    const updatePayload: any = {
      name,
      domain_id: domainId || null,
      category: category || null,
      priority,
      status,
      description: description || null,
      notes: notes || null,
      target_completion_date: targetCompletionDate || null,
      estimated_hours: estimatedTotalHours,
      estimated_total_hours: estimatedTotalHours,
      weekly_target_hours: weeklyTargetHours,
      daily_focus_minutes: dailyFocusMinutes,
      difficulty,
      flexible_schedule: flexibleSchedule,
      goal_id: goalId || null,
      minimum_weekly_hours: minimumWeeklyHours,
      maximum_weekly_hours: maximumWeeklyHours,
      tags,
      updated_at: new Date().toISOString()
    }

    if (status === 'COMPLETED') {
      updatePayload.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      return { success: false, error: error.message || 'Failed to update project' }
    }

    await logActivity('UPDATE_PROJECT', 'PROJECT', data.id)

    revalidatePath('/projects')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('Project update exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function archiveProject(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('projects')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error archiving project:', error)
      return { success: false, error: error.message || 'Failed to archive project' }
    }

    await logActivity('ARCHIVE_PROJECT', 'PROJECT', id)

    revalidatePath('/projects')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('archiveProject exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function restoreProject(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('projects')
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error restoring project:', error)
      return { success: false, error: error.message || 'Failed to restore project' }
    }

    await logActivity('RESTORE_PROJECT', 'PROJECT', id)

    revalidatePath('/projects')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('restoreProject exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function deleteProject(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    // Cascade cleanups to prevent orphaned tasks or timeline events
    await supabase.from('tasks').delete().eq('user_id', userId).eq('related_entity_type', 'PROJECT').eq('related_entity_id', id)
    await supabase.from('life_events').delete().eq('user_id', userId).eq('related_entity_id', id)

    const { error } = await supabase.from('projects').delete().eq('id', id).eq('user_id', userId)

    if (error) {
      console.error('Error deleting project:', error)
      return { success: false, error: error.message || 'Failed to delete project' }
    }

    revalidatePath('/projects')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('Project deletion exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function createProjectDirect(
  name: string, 
  description?: string, 
  estimatedTotalHours?: number, 
  targetCompletionDate?: string, 
  priority?: string, 
  difficulty?: string, 
  goalId?: string
) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    if (!name) {
      return { success: false, error: 'Project name is required' }
    }

    const { data, error } = await supabase.from('projects').insert({
      user_id: userId,
      name,
      description: description || null,
      status: 'IDEA',
      priority: priority || 'MEDIUM',
      estimated_total_hours: estimatedTotalHours || 0,
      estimated_hours: estimatedTotalHours || 0,
      target_completion_date: targetCompletionDate || null,
      difficulty: difficulty || 'MEDIUM',
      goal_id: goalId || null,
      flexible_schedule: true,
      is_archived: false
    }).select().single()

    if (error) {
      console.error('Error creating project direct:', error)
      return { success: false, error: error.message || 'Failed to create project' }
    }

    await logActivity('CREATE_PROJECT', 'PROJECT', data.id)

    revalidatePath('/projects')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('createProjectDirect exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function createProjectFromTemplate(templateType: string, customName?: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    let name = customName || 'New Project'
    let category = 'Engineering'
    let dailyFocus = 45
    let weeklyHours = 5
    let defaultMilestones: string[] = []
    let tags: string[] = []

    switch (templateType) {
      case 'SOFTWARE_DEV':
        if (!customName) name = 'Software Application'
        category = 'Development'
        dailyFocus = 60
        weeklyHours = 8
        tags = ['code', 'dev', 'software']
        defaultMilestones = ['Architecture & Specs', 'UI/UX Prototype', 'Backend API Setup', 'Testing & QA', 'Deployment']
        break
      case 'RESEARCH':
        if (!customName) name = 'Research Paper'
        category = 'Academic Research'
        dailyFocus = 30
        weeklyHours = 4
        tags = ['research', 'paper', 'academic']
        defaultMilestones = ['Literature Review', 'Methodology Design', 'Data Collection', 'Analysis & Draft', 'Final Submission']
        break
      case 'STARTUP':
        if (!customName) name = 'Startup MVP'
        category = 'Business'
        dailyFocus = 90
        weeklyHours = 10
        tags = ['startup', 'mvp', 'business']
        defaultMilestones = ['Market Validation', 'MVP Specs', 'Prototype Launch', 'Beta User Feedback', 'Launch Campaign']
        break
      default:
        if (!customName) name = 'Personal Initiative'
        category = 'Personal'
        dailyFocus = 30
        weeklyHours = 3
        tags = ['personal']
        defaultMilestones = ['Planning Phase', 'Execution Phase', 'Completion']
        break
    }

    const { data: proj, error: projErr } = await supabase.from('projects').insert({
      user_id: userId,
      name,
      category,
      status: 'ACTIVE',
      priority: 'MEDIUM',
      daily_focus_minutes: dailyFocus,
      weekly_target_hours: weeklyHours,
      tags
    }).select().single()

    if (projErr || !proj) {
      return { success: false, error: projErr?.message || 'Failed to create project from template' }
    }

    // Insert default milestones
    if (defaultMilestones.length > 0) {
      const milestonePayloads = defaultMilestones.map((title, idx) => ({
        project_id: proj.id,
        title,
        order_index: idx + 1,
        status: 'PENDING'
      }))
      await supabase.from('project_milestones').insert(milestonePayloads)
    }

    await logActivity('CREATE_PROJECT_TEMPLATE', 'PROJECT', proj.id)

    revalidatePath('/projects')
    revalidatePath('/')
    return { success: true, data: proj }
  } catch (err: any) {
    console.error('createProjectFromTemplate exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
