'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProjectMilestones(projectId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching project milestones:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('getProjectMilestones exception:', err)
    return []
  }
}

export async function createMilestone(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const projectId = formData.get('project_id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string | null
    const dueDate = formData.get('due_date') as string | null

    if (!projectId || !title) {
      return { success: false, error: 'Project ID and title are required' }
    }

    // Verify project ownership
    const { data: proj } = await supabase.from('projects').select('id').eq('id', projectId).eq('user_id', userId).single()
    if (!proj) {
      return { success: false, error: 'Unauthorized project access' }
    }

    // Get highest order index
    const { data: existing } = await supabase.from('project_milestones').select('order_index').eq('project_id', projectId).order('order_index', { ascending: false }).limit(1)
    const nextOrder = existing && existing.length > 0 ? (existing[0].order_index || 0) + 1 : 1

    const { data, error } = await supabase.from('project_milestones').insert({
      project_id: projectId,
      title,
      description: description || null,
      due_date: dueDate || null,
      order_index: nextOrder,
      status: 'PENDING'
    }).select().single()

    if (error) {
      console.error('Error creating milestone:', error)
      return { success: false, error: error.message || 'Failed to create milestone' }
    }

    await logActivity('CREATE_MILESTONE', 'MILESTONE', data.id)

    revalidatePath('/projects')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('createMilestone exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function toggleMilestoneStatus(milestoneId: string, currentStatus: string) {
  try {
    const supabase = await createClient()
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    const completedAt = nextStatus === 'COMPLETED' ? new Date().toISOString() : null

    const { data, error } = await supabase
      .from('project_milestones')
      .update({
        status: nextStatus,
        completed_at: completedAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', milestoneId)
      .select()
      .single()

    if (error) {
      console.error('Error toggling milestone status:', error)
      return { success: false, error: error.message || 'Failed to toggle milestone' }
    }

    revalidatePath('/projects')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('toggleMilestoneStatus exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function deleteMilestone(milestoneId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('project_milestones').delete().eq('id', milestoneId)

    if (error) {
      console.error('Error deleting milestone:', error)
      return { success: false, error: error.message || 'Failed to delete milestone' }
    }

    revalidatePath('/projects')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('deleteMilestone exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
