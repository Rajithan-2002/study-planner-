export interface GraphNode {
  id: string
  entityType: string
}

export interface GraphEdge {
  sourceId: string
  targetId: string
  relationshipType: string
}

export interface RelationshipInfo {
  id: string
  source_entity_type: string
  source_entity_id: string
  target_entity_type: string
  target_entity_id: string
  relationship_type: string
}

export class KnowledgeGraphEngine {
  // 1. Build Adjacency Graph from flat relationships table
  static buildGraph(relationships: RelationshipInfo[]) {
    const adjacencyList: Map<string, Array<{ targetId: string; targetType: string; relType: string }>> = new Map()
    const nodeTypes: Map<string, string> = new Map()

    relationships.forEach(r => {
      nodeTypes.set(r.source_entity_id, r.source_entity_type)
      nodeTypes.set(r.target_entity_id, r.target_entity_type)

      // Outward edge
      if (!adjacencyList.has(r.source_entity_id)) {
        adjacencyList.set(r.source_entity_id, [])
      }
      adjacencyList.get(r.source_entity_id)!.push({
        targetId: r.target_entity_id,
        targetType: r.target_entity_type,
        relType: r.relationship_type
      })

      // Inward edge (making it bidirectional for easier traversal queries)
      if (!adjacencyList.has(r.target_entity_id)) {
        adjacencyList.set(r.target_entity_id, [])
      }
      adjacencyList.get(r.target_entity_id)!.push({
        targetId: r.source_entity_id,
        targetType: r.source_entity_type,
        relType: r.relationship_type
      })
    })

    return { adjacencyList, nodeTypes }
  }

  // 2. Get all neighboring nodes
  static getNeighbors(entityId: string, relationships: RelationshipInfo[]) {
    const { adjacencyList } = this.buildGraph(relationships)
    return adjacencyList.get(entityId) || []
  }

  // 3. Simple BFS/DFS to check connections/pathfinding
  static areConnected(idA: string, idB: string, relationships: RelationshipInfo[]): boolean {
    if (idA === idB) return true
    const { adjacencyList } = this.buildGraph(relationships)
    if (!adjacencyList.has(idA) || !adjacencyList.has(idB)) return false

    const visited = new Set<string>()
    const queue: string[] = [idA]
    visited.add(idA)

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === idB) return true

      const neighbors = adjacencyList.get(current) || []
      for (const n of neighbors) {
        if (!visited.has(n.targetId)) {
          visited.add(n.targetId)
          queue.push(n.targetId)
        }
      }
    }

    return false
  }

  // 4. Trace full connection chain for preview visualization
  static findChain(idA: string, idB: string, relationships: RelationshipInfo[]): string[] {
    const { adjacencyList } = this.buildGraph(relationships)
    if (!adjacencyList.has(idA) || !adjacencyList.has(idB)) return []

    const visited = new Set<string>()
    const parentMap = new Map<string, string>()
    const queue: string[] = [idA]
    visited.add(idA)

    let found = false
    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === idB) {
        found = true
        break
      }

      const neighbors = adjacencyList.get(current) || []
      for (const n of neighbors) {
        if (!visited.has(n.targetId)) {
          visited.add(n.targetId)
          parentMap.set(n.targetId, current)
          queue.push(n.targetId)
        }
      }
    }

    if (!found) return []

    // Construct path from parentMap
    const path: string[] = []
    let curr: string | undefined = idB
    while (curr) {
      path.unshift(curr)
      curr = parentMap.get(curr)
    }

    return path
  }
}
