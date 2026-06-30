export type RetrievalStrategyType = 'SEMANTIC' | 'KEYWORD' | 'GRAPH' | 'METADATA' | 'HYBRID'

export interface EmbeddingJob {
  id: string
  userId: string
  documentId?: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
  createdAt: string
}

export interface RankedChunk {
  chunkId: string
  documentId: string
  documentTitle: string
  content: string
  heading?: string
  pageNumber?: number
  similarityScore: number
  graphConnectionScore: number
  finalRankScore: number
}

export interface CitationDetails {
  id: string
  documentTitle: string
  sectionHeading?: string
  pageNumber?: number
  chunkId: string
  confidenceScore: number
  formattedCitation: string
}

export interface RAGAnalytics {
  indexedDocuments: number
  pendingEmbeddings: number
  totalChunks: number
  averageLatencyMs: number
  retrievalHitRate: number
}
