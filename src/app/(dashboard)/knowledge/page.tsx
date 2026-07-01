import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { KnowledgeHubView } from '@/components/knowledge/KnowledgeHubView'

export default async function KnowledgeHubPage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  // Fetch knowledge files for this user
  const { data: files } = await supabase
    .from('knowledge_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    
  // Fetch notes for this user
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Fetch domains for this user
  const { data: domains } = await supabase
    .from('domains')
    .select('*')
    .eq('user_id', userId)

  // Fetch academic modules for relationships
  const { data: modules } = await supabase
    .from('modules')
    .select('id, code, name')
    .eq('user_id', userId)

  // Fetch projects for relationships
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', userId)

  // Fetch certifications for relationships
  const { data: certifications } = await supabase
    .from('certifications')
    .select('id, name')
    .eq('user_id', userId)

  // Fetch all chunks
  const { data: chunks } = await supabase
    .from('knowledge_chunks')
    .select('*')
    .order('chunk_number', { ascending: true })

  // Fetch all relationships
  const { data: relationships } = await supabase
    .from('platform_relationships')
    .select('*')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
          Second Brain Workspace
        </h2>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Your universal inbox, document repository, study guides, and notes, connected to the AI assistant.
        </p>
      </div>

      {/* KNOWLEDGE CLIENT VIEWER */}
      <KnowledgeHubView 
        initialFiles={files || []} 
        initialNotes={notes || []} 
        domains={domains || []}
        modules={modules || []}
        projects={projects || []}
        certifications={certifications || []}
        chunks={chunks || []}
        relationships={relationships || []}
      />

    </div>
  )
}
