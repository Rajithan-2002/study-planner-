'use server'

import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDomains() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('domains')
      .select('id, name')
      .eq('user_id', userId)
      .order('name')
    
    if (error) {
      console.error('Error fetching domains:', error)
      return []
    }
    return data
  } catch (err) {
    console.error('getDomains exception:', err)
    return []
  }
}

export async function createDomain(name: string) {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createClient()
    
    if (!name) {
      return { success: false, error: 'Domain name is required' }
    }

    const { data, error } = await supabase.from('domains').insert({
      user_id: userId,
      name
    }).select().single()
    
    if (error) {
      console.error('Error creating domain:', error)
      return { success: false, error: error.message || 'Failed to create domain' }
    }
    
    revalidatePath('/')
    revalidatePath('/certifications')
    revalidatePath('/projects')
    revalidatePath('/knowledge')
    return { success: true, data }
  } catch (err: any) {
    console.error('createDomain exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
