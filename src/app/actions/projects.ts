'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const name = formData.get('name') as string
    const domainId = formData.get('domain_id') as string | null
    const priority = formData.get('priority') as string || 'LOW'
    const description = formData.get('description') as string | null
    const status = formData.get('status') as string || 'IDEA'
    const notes = formData.get('notes') as string | null

    if (!name) {
      return { success: false, error: 'Project name is required' }
    }

    const { data, error } = await supabase.from('projects').insert({
      user_id: userId,
      name,
      domain_id: domainId || null,
      priority,
      description,
      status,
      notes
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

export async function deleteProject(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    // Cascade cleanups to prevent orphaned tasks or timeline events (restricted to user)
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
