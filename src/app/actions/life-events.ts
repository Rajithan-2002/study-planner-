'use server'

import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteLifeEvent(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    const { error } = await supabase
      .from('life_events')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting life event:', error)
      return { success: false, error: error.message || 'Failed to delete life event' }
    }

    revalidatePath('/timeline')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('deleteLifeEvent exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function createLifeEventDirect(data: {
  title: string
  type: 'EXAM' | 'ASSIGNMENT' | 'CERT_EXAM' | 'PROJECT_MILESTONE' | 'COMPETITION' | 'INTERNSHIP_DEADLINE'
  event_date: string
  importance?: number
}) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: event, error } = await supabase.from('life_events').insert({
      user_id: userId,
      title: data.title,
      type: data.type,
      event_date: data.event_date,
      importance: data.importance || 50
    }).select().single()

    if (error) {
      console.error('Error creating life event direct:', error.message)
      return { success: false, error: error.message || 'Failed to create life event' }
    }

    revalidatePath('/timeline')
    revalidatePath('/')
    return { success: true, data: event }
  } catch (err: any) {
    console.error('createLifeEventDirect exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

