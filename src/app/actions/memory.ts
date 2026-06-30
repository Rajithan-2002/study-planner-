'use server'

import { getCurrentUserId, createClient } from '@/utils/supabase/server'
import { CoreMemoryEngine } from '@/lib/memory/engine'
import { PersonalizationEngine } from '@/lib/personalization/engine'
import { ReflectionEngine } from '@/lib/reflection/engine'
import { MemoryType, UserPreferences } from '@/lib/memory/types'
import { revalidatePath } from 'next/cache'

export async function createMemoryAction(title: string, content: string, memoryType: MemoryType = 'CUSTOM') {
  try {
    const userId = await getCurrentUserId()
    const item = await CoreMemoryEngine.storeMemory(userId, { title, content, memoryType })
    revalidatePath('/memory')
    revalidatePath('/')
    return { success: true, data: item }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function updateMemoryAction(id: string, title: string, content: string, importanceScore: number) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('ai_memories')
      .update({
        title,
        content,
        importance_score: importanceScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    revalidatePath('/memory')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function deleteMemoryAction(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    const { error } = await supabase
      .from('ai_memories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    revalidatePath('/memory')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function archiveMemoryAction(id: string, archive: boolean) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('ai_memories')
      .update({
        lifecycle_state: archive ? 'ARCHIVED' : 'ACTIVE',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    revalidatePath('/memory')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function updateUserPreferencesAction(prefs: Partial<UserPreferences>) {
  try {
    const userId = await getCurrentUserId()
    const item = await PersonalizationEngine.updatePreferences(userId, prefs)
    revalidatePath('/memory')
    revalidatePath('/settings')
    revalidatePath('/')
    return { success: true, data: item }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function generateReflectionAction() {
  try {
    const userId = await getCurrentUserId()
    const insights = await ReflectionEngine.generateReflections(userId)
    revalidatePath('/memory')
    revalidatePath('/')
    return { success: true, data: insights }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}

