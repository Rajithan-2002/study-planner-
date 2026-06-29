'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadKnowledgeFile(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const file = formData.get('file') as File
    const entityType = formData.get('entity_type') as string
    const domainId = formData.get('domain_id') as string | null

    if (!file) {
      return { success: false, error: 'File is required' }
    }

    // P2: File Validation (Size Limit: 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds the 10MB limit.' }
    }

    // P2: File Validation (Allowed Formats)
    const allowedExtensions = ['PDF', 'PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'DOCX', 'TXT', 'MD', 'CSV']
    const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN'
    if (!allowedExtensions.includes(fileExtension) && fileExtension !== 'UNKNOWN') {
      return { success: false, error: `Unsupported file type: ${fileExtension}. Allowed: ${allowedExtensions.join(', ')}` }
    }

    const bucketName = 'knowledge'

    // Ensure the bucket exists (development helper fallback)
    try {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      })
    } catch (e) {
      // Ignore if bucket already exists
    }

    // Generate unique file path inside the user's directory
    const filePath = `${userId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`

    // Convert File to Buffer for Supabase Upload in Node.js
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading file to Supabase Storage:', uploadError)
      return { success: false, error: `Storage Upload Failed: ${uploadError.message}` }
    }

    // Get Public Retrieval URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    const { data: knowledgeFile, error } = await supabase.from('knowledge_files').insert({
      user_id: userId,
      file_name: file.name,
      file_url: publicUrl,
      file_type: fileExtension,
      entity_type: entityType,
      domain_id: domainId || null
    }).select().single()

    if (error) {
      console.error('Error creating knowledge file record:', error)
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from(bucketName).remove([filePath])
      return { success: false, error: `Database record creation failed: ${error.message}` }
    }

    await logActivity('UPLOAD_FILE', 'KNOWLEDGE_FILE', knowledgeFile.id)

    revalidatePath('/knowledge')
    revalidatePath('/')
    return { success: true, data: knowledgeFile }
  } catch (err: any) {
    console.error('uploadKnowledgeFile exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function deleteKnowledgeFile(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    // Fetch file path to delete from Supabase storage first (user isolated)
    const { data: fileData, error: fetchError } = await supabase
      .from('knowledge_files')
      .select('file_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!fetchError && fileData?.file_url) {
      const urlParts = fileData.file_url.split('/storage/v1/object/public/knowledge/')
      if (urlParts.length > 1) {
        const filePath = decodeURIComponent(urlParts[1])
        const { error: storageErr } = await supabase.storage
          .from('knowledge')
          .remove([filePath])
        
        if (storageErr) {
          console.error('Failed to remove file object from Supabase Storage:', storageErr.message)
        }
      }
    }

    const { error } = await supabase.from('knowledge_files').delete().eq('id', id).eq('user_id', userId)

    if (error) {
      console.error('Error deleting file record:', error)
      return { success: false, error: error.message || 'Failed to delete file record' }
    }

    revalidatePath('/knowledge')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('deleteKnowledgeFile exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
