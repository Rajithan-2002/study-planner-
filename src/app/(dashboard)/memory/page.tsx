import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { PersonalizationEngine } from '@/lib/personalization/engine'
import { MemoryPlatformEngine } from '@/lib/memory/platform-engine'
import { MemoryHubView } from '@/components/memory/MemoryHubView'

export const dynamic = 'force-dynamic'

export default async function MemoryPage() {
  const userId = await getCurrentUserId()
  const supabase = await createClient()

  // 1. Fetch memories
  const { data: rawMemories } = await supabase
    .from('ai_memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // 2. Fetch relationships
  const { data: rawRelationships } = await supabase
    .from('memory_relationships')
    .select('*')

  // Resolve relationship titles in memory
  const memoriesMap = new Map((rawMemories || []).map(m => [m.id, m.title]))
  const relationships = (rawRelationships || [])
    .map(r => ({
      id: r.id,
      source_title: memoriesMap.get(r.source_memory_id) || 'Unknown Node',
      target_title: memoriesMap.get(r.target_memory_id) || 'Unknown Node',
      relationship_type: r.relationship_type
    }))
    .filter(r => r.source_title !== 'Unknown Node' && r.target_title !== 'Unknown Node')

  // 3. Fetch reflections
  const { data: reflections } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // 4. Fetch personalization preferences
  const preferences = await PersonalizationEngine.getPreferences(userId)

  // 5. Fetch memory summary statistics
  const engine = new MemoryPlatformEngine()
  const summaryRes = await engine.getSummary(userId)
  const summary = summaryRes.success 
    ? summaryRes.data 
    : { totalMemories: rawMemories?.length || 0, relationshipDensity: relationships.length, profileCompleteness: 90.0 }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-650 dark:from-white dark:via-slate-200 dark:to-slate-450 bg-clip-text text-transparent">
          AI Cognitive Memory
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Explore and audit the logical memories, behavioral profiles, and reflections constructed by the AI tutor.
        </p>
      </div>

      <MemoryHubView
        memories={rawMemories || []}
        relationships={relationships}
        reflections={reflections || []}
        preferences={preferences}
        summary={summary}
      />
    </div>
  )
}
