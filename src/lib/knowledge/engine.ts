export interface KnowledgeFileData {
  id: string
  file_name: string
  file_url: string
  file_type: string
  entity_type: string
  entity_id?: string | null
  description?: string | null
  author?: string | null
  source_type: string
  owner_user_id?: string | null
  is_archived?: boolean | null
  file_size?: number | null
  tags?: string[] | null
  version: string
  language: string
  visibility: string
  processing_status: string
  knowledge_status: string
  keywords?: string[] | null
  reading_progress?: number | null
  last_opened_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface NoteData {
  id: string
  title: string
  content?: string | null
  tags?: string[] | null
  domain_id?: string | null
  created_at?: string
}

export interface ChunkData {
  id: string
  file_id: string
  chunk_number: number
  content: string
  start_offset: number
  end_offset: number
  token_count: number
}

export interface RelationshipData {
  id: string
  source_entity_type: string
  source_entity_id: string
  target_entity_type: string
  target_entity_id: string
  relationship_type: string
}

// Simple Parser Registry
export type ParserFunction = (content: string) => string[]
class ParserRegistry {
  private parsers: Map<string, ParserFunction> = new Map()

  constructor() {
    // Register default dummy parsers
    this.register('TXT', text => [text])
    this.register('MD', text => text.split('\n\n'))
    this.register('PDF', text => text.split('\f')) // Page breaks
  }

  register(extension: string, parser: ParserFunction) {
    this.parsers.set(extension.toUpperCase(), parser)
  }

  get(extension: string): ParserFunction | undefined {
    return this.parsers.get(extension.toUpperCase())
  }
}

export const parserRegistry = new ParserRegistry()

// 1. Calculate Knowledge Metrics
export function calculateKnowledgeMetrics(
  files: KnowledgeFileData[],
  notes: NoteData[],
  chunks: ChunkData[],
  relationships: RelationshipData[]
) {
  const activeFiles = files.filter(f => !f.is_archived)
  const totalStorage = activeFiles.reduce((sum, f) => sum + (f.file_size || 0), 0)

  // Count classifications
  const fileTypeCounts: Record<string, number> = {}
  activeFiles.forEach(f => {
    const t = f.file_type || 'UNKNOWN'
    fileTypeCounts[t] = (fileTypeCounts[t] || 0) + 1
  })

  // Find unreferenced/orphaned resources
  const referencedIds = new Set(
    relationships.flatMap(r => [r.source_entity_id, r.target_entity_id])
  )
  const unusedFilesCount = activeFiles.filter(f => !referencedIds.has(f.id)).length

  return {
    totalDocumentsCount: files.length,
    activeDocumentsCount: activeFiles.length,
    notesCount: notes.length,
    chunksCount: chunks.length,
    relationshipsCount: relationships.length,
    unusedFilesCount,
    totalStorageBytes: totalStorage,
    fileTypeCounts
  }
}

// 2. Prepare Document for Chunking (simulation/token boundaries)
export function prepareDocumentForChunking(
  fileId: string,
  content: string,
  maxChunkSizeChars: number = 800
): Array<Omit<ChunkData, 'id'>> {
  if (!content) return []
  
  const chunks: Array<Omit<ChunkData, 'id'>> = []
  let offset = 0
  let chunkNumber = 1

  while (offset < content.length) {
    const end = Math.min(offset + maxChunkSizeChars, content.length)
    const chunkText = content.substring(offset, end)
    
    // Estimate token count (general rule of thumb: ~4 characters per token)
    const tokenCount = Math.ceil(chunkText.length / 4)

    chunks.push({
      file_id: fileId,
      chunk_number: chunkNumber,
      content: chunkText,
      start_offset: offset,
      end_offset: end,
      token_count: tokenCount
    })

    offset = end
    chunkNumber++
  }

  return chunks
}

// 3. Expose AI-ready context
export function getKnowledgeAIContext(
  file: KnowledgeFileData,
  chunks: ChunkData[],
  relationships: RelationshipData[]
) {
  const fileChunks = chunks.filter(c => c.file_id === file.id)
  const fileRels = relationships.filter(
    r => r.source_entity_id === file.id || r.target_entity_id === file.id
  )

  return {
    documentId: file.id,
    fileName: file.file_name,
    fileType: file.file_type,
    description: file.description || null,
    author: file.author || null,
    version: file.version,
    processingStatus: file.processing_status,
    knowledgeStatus: file.knowledge_status,
    totalChunks: fileChunks.length,
    keywords: file.keywords || [],
    tags: file.tags || [],
    relationshipCount: fileRels.length,
    relatedEntities: fileRels.map(r => {
      const isSource = r.source_entity_id === file.id
      return {
        id: isSource ? r.target_entity_id : r.source_entity_id,
        entityType: isSource ? r.target_entity_type : r.source_entity_type,
        relationshipType: r.relationship_type
      }
    })
  }
}
