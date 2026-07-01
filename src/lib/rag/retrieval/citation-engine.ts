import { RankedChunk, CitationDetails } from '../types'

export class CitationEngine {
  static generateCitations(chunks: RankedChunk[]): CitationDetails[] {
    return chunks.map(c => ({
      id: Math.random().toString(36).substring(7),
      documentTitle: c.documentTitle,
      sectionHeading: c.heading,
      pageNumber: c.pageNumber,
      chunkId: c.chunkId,
      confidenceScore: c.finalRankScore,
      formattedCitation: `[Source: ${c.documentTitle}${c.heading ? ` > ${c.heading}` : ''}${c.pageNumber ? ` (Pg ${c.pageNumber})` : ''}]`
    }))
  }
}
