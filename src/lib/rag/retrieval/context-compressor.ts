import { RankedChunk } from '../types'

export class ContextCompressor {
  static compressAndDeduplicate(chunks: RankedChunk[], maxChars = 2500): string {
    if (!chunks || chunks.length === 0) return 'No relevant knowledge chunks retrieved.'

    const seenContents = new Set<string>()
    const compressedParts: string[] = []
    let currentLength = 0

    for (const c of chunks) {
      const trimmed = c.content.trim()
      if (seenContents.has(trimmed)) continue
      seenContents.add(trimmed)

      const block = `[Document: ${c.documentTitle} | Heading: ${c.heading || 'N/A'} | RankScore: ${c.finalRankScore}]\n${trimmed}`
      if (currentLength + block.length > maxChars) break

      compressedParts.push(block)
      currentLength += block.length
    }

    return compressedParts.join('\n\n---\n\n')
  }
}
