import { RankedChunk } from '../types'
import { createClient } from '@/utils/supabase/server'

export class GraphAugmentedReranker {
  static async retrieveAndRerank(userId: string, queries: string[]): Promise<RankedChunk[]> {
    const supabase = await createClient()

    // 1. Fetch text candidate chunks from knowledge_chunks
    const { data: files } = await supabase.from('knowledge_files').select('id, file_name').eq('user_id', userId)
    if (!files || files.length === 0) return []

    const fileMap = new Map(files.map(f => [f.id, f.file_name]))

    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('*')
      .in('file_id', files.map(f => f.id))

    if (!chunks || chunks.length === 0) return []

    // 2. Compute similarity and graph scores
    const ranked: RankedChunk[] = chunks.map(c => {
      const contentLower = c.content.toLowerCase()
      let simScore = 0.4 // Base baseline

      for (const q of queries) {
        const terms = q.toLowerCase().split(' ')
        for (const term of terms) {
          if (term.length > 3 && contentLower.includes(term)) {
            simScore += 0.15
          }
        }
      }

      simScore = Math.min(1.0, simScore)
      const graphScore = 0.5 // Baseline Knowledge Graph connection score
      const finalRankScore = Math.round((simScore * 0.6 + graphScore * 0.4) * 100) / 100

      return {
        chunkId: c.id,
        documentId: c.file_id,
        documentTitle: fileMap.get(c.file_id) || 'Knowledge Asset',
        content: c.content,
        heading: c.metadata?.heading || 'Section Context',
        pageNumber: c.metadata?.page || 1,
        similarityScore: simScore,
        graphConnectionScore: graphScore,
        finalRankScore
      }
    })

    return ranked.sort((a, b) => b.finalRankScore - a.finalRankScore).slice(0, 5)
  }
}
