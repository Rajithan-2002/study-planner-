import { createClient } from '@/utils/supabase/server'

export class EmbeddingPipeline {
  
  // 1. Queue a document for asynchronous embedding generation
  static async queueJob(userId: string, documentId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('embedding_jobs').insert({
      user_id: userId,
      document_id: documentId,
      status: 'PENDING'
    }).select().single()

    if (error) throw new Error(`Failed to queue embedding job: ${error.message}`)
    return data
  }

  // 2. Background worker processing queue
  static async processQueue() {
    const supabase = await createClient()
    
    // Fetch pending jobs
    const { data: jobs } = await supabase.from('embedding_jobs').select('*').eq('status', 'PENDING').limit(5)
    if (!jobs || jobs.length === 0) return { processed: 0 }

    const apiKey = process.env.OPENAI_API_KEY

    for (const job of jobs) {
      await supabase.from('embedding_jobs').update({ status: 'PROCESSING' }).eq('id', job.id)

      try {
        // Fetch document chunks
        const { data: chunks } = await supabase.from('knowledge_chunks').select('*').eq('file_id', job.document_id)
        
        if (!chunks || chunks.length === 0) {
          await supabase.from('embedding_jobs').update({ status: 'COMPLETED' }).eq('id', job.id)
          continue
        }

        if (!apiKey) {
          // As directed in feedback: If API key is missing, mark status as PENDING_EMBEDDING and keep pipeline intact
          const pendingRows = chunks.map(c => ({
            chunk_id: c.id,
            embedding: null,
            embedding_model: 'text-embedding-3-small',
            status: 'PENDING_EMBEDDING'
          }))
          
          await supabase.from('knowledge_embeddings').delete().in('chunk_id', chunks.map(c => c.id))
          await supabase.from('knowledge_embeddings').insert(pendingRows)
          await supabase.from('embedding_jobs').update({ status: 'COMPLETED' }).eq('id', job.id)
          continue
        }

        // OpenAI API vector calculation if API Key exists
        const res = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: chunks.map(c => c.content)
          })
        })

        if (!res.ok) {
          throw new Error(`OpenAI API status ${res.status}`)
        }

        const json = await res.json()
        const embeddingsData = json.data || []

        const rows = chunks.map((c, idx) => ({
          chunk_id: c.id,
          embedding: embeddingsData[idx]?.embedding || null,
          embedding_model: 'text-embedding-3-small',
          status: 'ACTIVE'
        }))

        await supabase.from('knowledge_embeddings').delete().in('chunk_id', chunks.map(c => c.id))
        await supabase.from('knowledge_embeddings').insert(rows)
        await supabase.from('embedding_jobs').update({ status: 'COMPLETED' }).eq('id', job.id)

      } catch (err: any) {
        console.error(`Error processing embedding job ${job.id}:`, err)
        await supabase.from('embedding_jobs').update({ status: 'FAILED', error_message: err.message }).eq('id', job.id)
      }
    }

    return { processed: jobs.length }
  }
}
