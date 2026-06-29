'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCertification(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const name = formData.get('name') as string
    const domainId = formData.get('domain_id') as string | null
    const priority = formData.get('priority') as string || 'LOW'
    const provider = formData.get('provider') as string | null
    const targetDate = formData.get('target_date') as string | null
    const examDate = formData.get('exam_date') as string | null
    const status = formData.get('status') as string || 'IDEA'
    const notes = formData.get('notes') as string | null

    if (!name) {
      return { success: false, error: 'Certification name is required' }
    }

    // Create Certification
    const { data: cert, error: certError } = await supabase.from('certifications').insert({
      user_id: userId,
      name,
      domain_id: domainId || null,
      priority,
      provider,
      target_date: targetDate || null,
      exam_date: examDate || null,
      status,
      notes
    }).select().single()

    if (certError) {
      console.error('Error creating certification:', certError)
      return { success: false, error: certError.message || 'Failed to create certification' }
    }

    await logActivity('CREATE_CERTIFICATION', 'CERTIFICATION', cert.id)

    // Automatic Life Event Generation
    if (examDate) {
      const { error: leError } = await supabase.from('life_events').insert({
        user_id: userId,
        title: `${name} Exam`,
        type: 'CERT_EXAM',
        event_date: examDate,
        importance: priority === 'CRITICAL' ? 100 : priority === 'HIGH' ? 75 : priority === 'MEDIUM' ? 50 : 25,
        related_entity_id: cert.id
      })
      if (leError) console.error('Failed to create Life Event for Cert Exam:', leError)
    } else if (targetDate) {
      const { error: leError } = await supabase.from('life_events').insert({
        user_id: userId,
        title: `${name} Target Completion`,
        type: 'PROJECT_MILESTONE',
        event_date: targetDate,
        importance: priority === 'CRITICAL' ? 100 : priority === 'HIGH' ? 75 : priority === 'MEDIUM' ? 50 : 25,
        related_entity_id: cert.id
      })
      if (leError) console.error('Failed to create Life Event for Cert Target:', leError)
    }

    revalidatePath('/certifications')
    revalidatePath('/timeline')
    revalidatePath('/')
    return { success: true, data: cert }
  } catch (err: any) {
    console.error('createCertification exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function deleteCertification(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    // Cascade cleanups to prevent orphaned tasks or timeline events (restricted to user)
    await supabase.from('tasks').delete().eq('user_id', userId).eq('related_entity_type', 'CERTIFICATION').eq('related_entity_id', id)
    await supabase.from('life_events').delete().eq('user_id', userId).eq('related_entity_id', id)

    const { error } = await supabase.from('certifications').delete().eq('id', id).eq('user_id', userId)

    if (error) {
      console.error('Error deleting certification:', error)
      return { success: false, error: error.message || 'Failed to delete certification' }
    }

    revalidatePath('/certifications')
    revalidatePath('/timeline')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('deleteCertification exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
