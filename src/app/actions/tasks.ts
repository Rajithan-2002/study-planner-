'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleTaskStatus(taskId: string, currentStatus: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error toggling task status:', error.message)
      return { success: false, error: error.message || 'Failed to update task status' }
    }

    revalidatePath('/today')
    revalidatePath('/projects')
    revalidatePath('/certifications')
    revalidatePath('/')
    
    return { success: true, status: newStatus, data }
  } catch (err: any) {
    console.error('toggleTaskStatus exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function createTask(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const title = formData.get('title') as string
    const description = formData.get('description') as string | null
    const priority = formData.get('priority') as string || 'LOW'
    const dueDate = formData.get('due_date') as string | null
    const domainId = formData.get('domain_id') as string | null
    const relatedEntityType = formData.get('related_entity_type') as string | null
    const relatedEntityId = formData.get('related_entity_id') as string | null

    if (!title) {
      return { success: false, error: 'Task title is required' }
    }

    const { data, error } = await supabase.from('tasks').insert({
      user_id: userId,
      title,
      description,
      priority,
      due_date: dueDate || null,
      domain_id: domainId || null,
      related_entity_type: relatedEntityType || null,
      related_entity_id: relatedEntityId || null,
      status: 'PENDING'
    }).select().single()

    if (error) {
      console.error('Error creating task:', error.message)
      return { success: false, error: error.message || 'Failed to create task' }
    }

    await logActivity('CREATE_TASK', 'TASK', data.id)

    revalidatePath('/today')
    revalidatePath('/projects')
    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('createTask exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function createQuickTask(title: string, relatedEntityType?: string, relatedEntityId?: string, domainId?: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    if (!title) {
      return { success: false, error: 'Task title is required' }
    }

    const { data, error } = await supabase.from('tasks').insert({
      user_id: userId,
      title,
      status: 'PENDING',
      priority: 'MEDIUM',
      related_entity_type: relatedEntityType || null,
      related_entity_id: relatedEntityId || null,
      domain_id: domainId || null
    }).select().single()

    if (error) {
      console.error('Error creating quick task:', error.message)
      return { success: false, error: error.message || 'Failed to create quick task' }
    }

    await logActivity('CREATE_TASK', 'TASK', data.id)

    revalidatePath('/today')
    revalidatePath('/projects')
    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('createQuickTask exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function createTaskDirect(data: {
  title: string
  description?: string
  priority?: string
  due_date?: string
}) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: task, error } = await supabase.from('tasks').insert({
      user_id: userId,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'LOW',
      due_date: data.due_date || null,
      status: 'PENDING'
    }).select().single()

    if (error) {
      console.error('Error creating task direct:', error.message)
      return { success: false, error: error.message || 'Failed to create task' }
    }

    await logActivity('CREATE_TASK', 'TASK', task.id)

    revalidatePath('/today')
    revalidatePath('/projects')
    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data: task }
  } catch (err: any) {
    console.error('createTaskDirect exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

