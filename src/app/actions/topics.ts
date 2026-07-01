'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// TOPIC ACTIONS
export async function createTopic(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const certId = formData.get('certification_id') as string
    const domainName = formData.get('domain_name') as string | null
    const title = formData.get('title') as string
    const description = formData.get('description') as string | null
    const estimatedStudyHours = formData.get('estimated_study_hours') ? Number(formData.get('estimated_study_hours')) : 0
    const priority = formData.get('priority') as string || 'MEDIUM'
    const difficulty = formData.get('difficulty') as string || 'MEDIUM'
    const learningStatus = formData.get('learning_status') as string || 'NOT_STARTED'
    const confidenceLevel = formData.get('confidence_level') ? Number(formData.get('confidence_level')) : 3
    const notes = formData.get('notes') as string | null
    const rawTags = formData.get('tags') as string | null
    const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

    if (!certId || !title) {
      return { success: false, error: 'Certification ID and Topic title are required' }
    }

    // Verify ownership
    const { data: cert } = await supabase.from('certifications').select('id').eq('id', certId).eq('user_id', userId).single()
    if (!cert) return { success: false, error: 'Unauthorized access' }

    // Get order index
    const { data: existing } = await supabase.from('certification_topics').select('order_index').eq('certification_id', certId).order('order_index', { ascending: false }).limit(1)
    const nextOrder = existing && existing.length > 0 ? (existing[0].order_index || 0) + 1 : 1

    const { data: topic, error } = await supabase.from('certification_topics').insert({
      certification_id: certId,
      domain_name: domainName || null,
      title,
      description: description || null,
      estimated_study_hours: estimatedStudyHours,
      priority,
      difficulty,
      learning_status: learningStatus,
      confidence_level: confidenceLevel,
      notes: notes || null,
      tags,
      order_index: nextOrder
    }).select().single()

    if (error) {
      console.error('Error creating topic:', error)
      return { success: false, error: error.message || 'Failed to create topic' }
    }

    await logActivity('CREATE_TOPIC', 'CERTIFICATION_TOPIC', topic.id)

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data: topic }
  } catch (err: any) {
    console.error('createTopic exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function updateTopic(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const topicId = formData.get('topic_id') as string
    const domainName = formData.get('domain_name') as string | null
    const title = formData.get('title') as string
    const description = formData.get('description') as string | null
    const estimatedStudyHours = formData.get('estimated_study_hours') ? Number(formData.get('estimated_study_hours')) : 0
    const priority = formData.get('priority') as string || 'MEDIUM'
    const difficulty = formData.get('difficulty') as string || 'MEDIUM'
    const learningStatus = formData.get('learning_status') as string || 'NOT_STARTED'
    const confidenceLevel = formData.get('confidence_level') ? Number(formData.get('confidence_level')) : 3
    const notes = formData.get('notes') as string | null
    const rawTags = formData.get('tags') as string | null
    const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

    if (!topicId || !title) {
      return { success: false, error: 'Topic ID and Title are required' }
    }

    const payload: any = {
      domain_name: domainName || null,
      title,
      description: description || null,
      estimated_study_hours: estimatedStudyHours,
      priority,
      difficulty,
      learning_status: learningStatus,
      confidence_level: confidenceLevel,
      notes: notes || null,
      tags,
      updated_at: new Date().toISOString()
    }

    if (learningStatus === 'MASTERED') {
      payload.completion_date = new Date().toISOString()
    }

    const { data: topic, error } = await supabase
      .from('certification_topics')
      .update(payload)
      .eq('id', topicId)
      .select()
      .single()

    if (error) {
      console.error('Error updating topic:', error)
      return { success: false, error: error.message || 'Failed to update topic' }
    }

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data: topic }
  } catch (err: any) {
    console.error('updateTopic exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function deleteTopic(topicId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('certification_topics').delete().eq('id', topicId)

    if (error) {
      console.error('Error deleting topic:', error)
      return { success: false, error: error.message || 'Failed to delete topic' }
    }

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('deleteTopic exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// SUBTOPIC ACTIONS
export async function createSubtopic(formData: FormData) {
  try {
    const supabase = await createClient()
    const topicId = formData.get('topic_id') as string
    const title = formData.get('title') as string

    if (!topicId || !title) {
      return { success: false, error: 'Topic ID and Title are required' }
    }

    const { data: existing } = await supabase.from('certification_subtopics').select('order_index').eq('topic_id', topicId).order('order_index', { ascending: false }).limit(1)
    const nextOrder = existing && existing.length > 0 ? (existing[0].order_index || 0) + 1 : 1

    const { data, error } = await supabase.from('certification_subtopics').insert({
      topic_id: topicId,
      title,
      status: 'PENDING',
      order_index: nextOrder
    }).select().single()

    if (error) {
      console.error('Error creating subtopic:', error)
      return { success: false, error: error.message || 'Failed to create subtopic' }
    }

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('createSubtopic exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function toggleSubtopicStatus(subtopicId: string, currentStatus: string) {
  try {
    const supabase = await createClient()
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    const completedAt = nextStatus === 'COMPLETED' ? new Date().toISOString() : null

    const { data, error } = await supabase
      .from('certification_subtopics')
      .update({
        status: nextStatus,
        completed_at: completedAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', subtopicId)
      .select()
      .single()

    if (error) {
      console.error('Error toggling subtopic status:', error)
      return { success: false, error: error.message || 'Failed to toggle subtopic' }
    }

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('toggleSubtopicStatus exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function deleteSubtopic(subtopicId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('certification_subtopics').delete().eq('id', subtopicId)

    if (error) {
      console.error('Error deleting subtopic:', error)
      return { success: false, error: error.message || 'Failed to delete subtopic' }
    }

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('deleteSubtopic exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// STUDY SESSION LOGGING
export async function logStudySession(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const certId = formData.get('certification_id') as string
    const topicId = formData.get('topic_id') as string | null
    const durationMinutes = Number(formData.get('duration_minutes'))
    const notes = formData.get('notes') as string | null

    if (!certId || isNaN(durationMinutes) || durationMinutes <= 0) {
      return { success: false, error: 'Certification ID and duration minutes must be positive' }
    }

    const { data, error } = await supabase.from('certification_study_sessions').insert({
      certification_id: certId,
      topic_id: topicId || null,
      duration_minutes: durationMinutes,
      notes: notes || null
    }).select().single()

    if (error) {
      console.error('Error logging study session:', error)
      return { success: false, error: error.message || 'Failed to log study session' }
    }

    // Update last_studied_at on the topic
    if (topicId) {
      await supabase
        .from('certification_topics')
        .update({ last_studied_at: new Date().toISOString() })
        .eq('id', topicId)
    }

    await logActivity('LOG_STUDY_SESSION', 'CERTIFICATION', certId)

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('logStudySession exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
