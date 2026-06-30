'use server'

import { getCurrentUserId } from '@/utils/supabase/server'
import { EmbeddingPipeline } from '@/lib/rag/embedding/pipeline'
import { platformRegistry } from '@/lib/platform/registry'
import { revalidatePath } from 'next/cache'

export async function queueEmbeddingJobAction(documentId: string) {
  try {
    const userId = await getCurrentUserId()
    const job = await EmbeddingPipeline.queueJob(userId, documentId)
    
    // Process queue in background trigger
    EmbeddingPipeline.processQueue().catch(err => console.error('Background processQueue error:', err))

    revalidatePath('/')
    return { success: true, data: job }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function processPendingQueueAction() {
  try {
    const res = await EmbeddingPipeline.processQueue()
    revalidatePath('/')
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function performRAGSearchAction(query: string) {
  try {
    const userId = await getCurrentUserId()
    const ragEngine = platformRegistry.getEngine('rag')
    if (!ragEngine) return { success: false, error: 'RAG Engine not found' }

    const res = await ragEngine.calculate(userId, { query })
    return res
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' }
  }
}
