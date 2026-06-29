'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInboxItem(content: string, source: string = 'QUICK_CAPTURE') {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase.from('inbox_items').insert({
      user_id: userId,
      content,
      source,
      status: 'PENDING'
    }).select().single()

    if (error) {
      console.error('Error inserting inbox item:', error)
      return { success: false, error: error.message || 'Failed to create inbox item' }
    }

    await logActivity('CREATE_INBOX_ITEM', 'INBOX_ITEM', data.id)

    revalidatePath('/')
    revalidatePath('/inbox')
    return { success: true, data }
  } catch (err: any) {
    console.error('createInboxItem exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function getInboxItems() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('inbox_items')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching inbox items:', error)
      return []
    }
    return data
  } catch (err) {
    console.error('getInboxItems exception:', err)
    return []
  }
}

export async function archiveInboxItem(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('inbox_items')
      .update({ status: 'ARCHIVED' })
      .eq('id', id)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error archiving inbox item:', error)
      return { success: false, error: error.message || 'Failed to archive inbox item' }
    }

    revalidatePath('/')
    revalidatePath('/inbox')
    return { success: true, data }
  } catch (err: any) {
    console.error('archiveInboxItem exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function deleteInboxItem(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { error } = await supabase
      .from('inbox_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting inbox item:', error)
      return { success: false, error: error.message || 'Failed to delete inbox item' }
    }

    revalidatePath('/')
    revalidatePath('/inbox')
    return { success: true }
  } catch (err: any) {
    console.error('deleteInboxItem exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function createNoteDirect(title: string, content: string, domainId?: string, tags?: string[]) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase.from('notes').insert({
      user_id: userId,
      title,
      content,
      domain_id: domainId || null,
      tags: tags || []
    }).select().single()

    if (error) {
      console.error('Error inserting note:', error)
      return { success: false, error: error.message || 'Failed to create note' }
    }

    await logActivity('CREATE_NOTE', 'NOTE', data.id)

    revalidatePath('/knowledge')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('createNoteDirect exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function deleteNote(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting note:', error)
      return { success: false, error: error.message || 'Failed to delete note' }
    }

    revalidatePath('/knowledge')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('deleteNote exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function updateNote(id: string, title: string, content: string, domainId?: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('notes')
      .update({
        title,
        content,
        domain_id: domainId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error updating note:', error)
      return { success: false, error: error.message || 'Failed to update note' }
    }

    revalidatePath('/knowledge')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('updateNote exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
