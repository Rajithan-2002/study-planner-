'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { prepareDocumentForChunking } from '@/lib/knowledge/engine'

export async function uploadKnowledgeFile(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const file = formData.get('file') as File
    const entityType = formData.get('entity_type') as string || 'INBOX'
    const entityId = formData.get('entity_id') as string | null
    const domainId = formData.get('domain_id') as string | null
    
    // Additional optional metadata
    const description = formData.get('description') as string | null
    const author = formData.get('author') as string | null
    const sourceType = formData.get('source_type') as string || 'UPLOAD'

    if (!file) {
      return { success: false, error: 'File is required' }
    }

    // Size limit check (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 10MB.' }
    }

    const allowedExtensions = ['PDF', 'PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'DOCX', 'TXT', 'MD', 'CSV']
    const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN'
    if (!allowedExtensions.includes(fileExtension) && fileExtension !== 'UNKNOWN') {
      return { success: false, error: `Unsupported file type: ${fileExtension}` }
    }

    const bucketName = 'knowledge'
    try {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760
      })
    } catch (e) {
      // Ignore if exists
    }

    const filePath = `${userId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload Error:', uploadError)
      return { success: false, error: `Storage upload failed: ${uploadError.message}` }
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    // Save in knowledge_files with rich metadata
    const { data: doc, error: dbError } = await supabase
      .from('knowledge_files')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: fileExtension,
        entity_type: entityType,
        entity_id: entityId || null,
        domain_id: domainId || null,
        description,
        author,
        source_type: sourceType,
        owner_user_id: userId,
        file_size: file.size,
        version: '1.0',
        processing_status: 'UPLOADED',
        knowledge_status: 'UNREAD'
      })
      .select()
      .single()

    if (dbError || !doc) {
      console.error('DB Insert Error:', dbError)
      await supabase.storage.from(bucketName).remove([filePath])
      return { success: false, error: `Database insert failed: ${dbError?.message}` }
    }

    // Version registration
    await supabase.from('knowledge_document_versions').insert({
      file_id: doc.id,
      version: '1.0',
      file_url: publicUrl,
      file_size: file.size
    })

    // Simulated RAG Chunks generation (read content as text if TXT/MD, otherwise mock)
    let contentSample = `Content of document ${file.name}. Standard metadata processed. Author: ${author || 'Unknown'}.`
    if (fileExtension === 'TXT' || fileExtension === 'MD') {
      try {
        contentSample = new TextDecoder().decode(arrayBuffer)
      } catch (err) {
        console.error('Failed to decode text file:', err)
      }
    }

    const chunks = prepareDocumentForChunking(doc.id, contentSample)
    if (chunks.length > 0) {
      await supabase.from('knowledge_chunks').insert(chunks)
      await supabase
        .from('knowledge_files')
        .update({ processing_status: 'CHUNKED' })
        .eq('id', doc.id)
    }

    // Link initial relationship
    if (entityId && entityType !== 'INBOX') {
      await supabase.from('platform_relationships').insert({
        source_entity_type: 'KNOWLEDGE_FILE',
        source_entity_id: doc.id,
        target_entity_type: entityType,
        target_entity_id: entityId,
        relationship_type: 'REFERENCES'
      })
    }

    await logActivity('UPLOAD_FILE', 'KNOWLEDGE_FILE', doc.id)

    revalidatePath('/knowledge')
    revalidatePath('/')
    return { success: true, data: doc }
  } catch (err: any) {
    console.error('uploadKnowledgeFile exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function updateDocumentMetadata(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const docId = formData.get('doc_id') as string
    const fileName = formData.get('file_name') as string
    const description = formData.get('description') as string | null
    const author = formData.get('author') as string | null
    const sourceType = formData.get('source_type') as string || 'UPLOAD'
    const version = formData.get('version') as string || '1.0'
    const language = formData.get('language') as string || 'en'
    const visibility = formData.get('visibility') as string || 'private'
    const knowledgeStatus = formData.get('knowledge_status') as string || 'UNREAD'
    const readingProgress = formData.get('reading_progress') ? Number(formData.get('reading_progress')) : 0
    const rawTags = formData.get('tags') as string | null
    const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

    if (!docId || !fileName) {
      return { success: false, error: 'Document ID and Name are required' }
    }

    // Fetch existing document to check version
    const { data: existing } = await supabase
      .from('knowledge_files')
      .select('*')
      .eq('id', docId)
      .eq('user_id', userId)
      .single()

    if (!existing) return { success: false, error: 'Document not found' }

    const updatePayload: any = {
      file_name: fileName,
      description: description || null,
      author: author || null,
      source_type: sourceType,
      version,
      language,
      visibility,
      knowledge_status: knowledgeStatus,
      reading_progress: readingProgress,
      tags,
      updated_at: new Date().toISOString()
    }

    const { data: doc, error } = await supabase
      .from('knowledge_files')
      .update(updatePayload)
      .eq('id', docId)
      .select()
      .single()

    if (error) {
      console.error('Error updating document:', error)
      return { success: false, error: error.message || 'Failed to update document' }
    }

    // Log version change if new version entered
    if (existing.version !== version) {
      await supabase.from('knowledge_document_versions').insert({
        file_id: docId,
        version,
        file_url: existing.file_url,
        file_size: existing.file_size
      })
    }

    revalidatePath('/knowledge')
    revalidatePath('/')
    return { success: true, data: doc }
  } catch (err: any) {
    console.error('updateDocumentMetadata exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function linkEntities(
  sourceType: string,
  sourceId: string,
  targetType: string,
  targetId: string,
  relationshipType: string = 'REFERENCES'
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('platform_relationships')
      .insert({
        source_entity_type: sourceType,
        source_entity_id: sourceId,
        target_entity_type: targetType,
        target_entity_id: targetId,
        relationship_type: relationshipType
      })
      .select()
      .single()

    if (error) {
      console.error('Error linking entities:', error)
      return { success: false, error: error.message || 'Failed to link entities' }
    }

    revalidatePath('/knowledge')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('linkEntities exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function unlinkEntities(relationshipId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('platform_relationships')
      .delete()
      .eq('id', relationshipId)

    if (error) {
      console.error('Error unlinking entities:', error)
      return { success: false, error: error.message || 'Failed to unlink entities' }
    }

    revalidatePath('/knowledge')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('unlinkEntities exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function archiveDocument(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('knowledge_files')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error archiving document:', error)
      return { success: false, error: error.message || 'Failed to archive document' }
    }

    await logActivity('ARCHIVE_DOCUMENT', 'KNOWLEDGE_FILE', id)

    revalidatePath('/knowledge')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('archiveDocument exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function restoreDocument(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('knowledge_files')
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error restoring document:', error)
      return { success: false, error: error.message || 'Failed to restore document' }
    }

    await logActivity('RESTORE_DOCUMENT', 'KNOWLEDGE_FILE', id)

    revalidatePath('/knowledge')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('restoreDocument exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function deleteKnowledgeFile(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: fileData } = await supabase
      .from('knowledge_files')
      .select('file_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fileData?.file_url) {
      const urlParts = fileData.file_url.split('/storage/v1/object/public/knowledge/')
      if (urlParts.length > 1) {
        const filePath = decodeURIComponent(urlParts[1])
        await supabase.storage.from('knowledge').remove([filePath])
      }
    }

    // Cascade deletion
    await supabase.from('knowledge_chunks').delete().eq('file_id', id)
    await supabase.from('knowledge_document_versions').delete().eq('file_id', id)
    await supabase.from('platform_relationships').delete().or(`source_entity_id.eq.${id},target_entity_id.eq.${id}`)

    const { error } = await supabase.from('knowledge_files').delete().eq('id', id).eq('user_id', userId)

    if (error) {
      console.error('Error deleting document:', error)
      return { success: false, error: error.message || 'Failed to delete document' }
    }

    revalidatePath('/knowledge')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('deleteKnowledgeFile exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}
