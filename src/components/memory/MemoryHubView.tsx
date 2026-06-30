'use client'

import { useState, useTransition } from 'react'
import { Brain, Search, Plus, Filter, Trash2, Archive, RotateCcw, Edit2, Loader2, Link2, Sparkles, TrendingUp, ShieldCheck, Clock, CalendarDays, HeartHandshake } from 'lucide-react'
import { createMemoryAction, deleteMemoryAction, archiveMemoryAction, updateMemoryAction, generateReflectionAction } from '@/app/actions/memory'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'

interface MemoryHubProps {
  memories: any[]
  relationships: any[]
  reflections: any[]
  preferences: any
  summary: any
}

export function MemoryHubView({
  memories = [],
  relationships = [],
  reflections = [],
  preferences,
  summary
}: MemoryHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'explorer' | 'graph' | 'reflections' | 'timeline'>('overview')
  const [isPending, startTransition] = useTransition()
  
  // Search and filters
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [stateFilter, setStateFilter] = useState('ACTIVE') // ACTIVE, ARCHIVED, ALL
  const [sortBy, setSortBy] = useState<'newest' | 'importance'>('newest')

  // Modals / forms
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newMemory, setNewMemory] = useState({ title: '', content: '', type: 'CUSTOM' })
  const [editingMemory, setEditingMemory] = useState<any>(null)
  
  // Reusable confirmation modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    description: string
    isDanger: boolean
    confirmText: string
    onConfirm: () => Promise<void> | void
    errorMsg: string | null
  }>({
    isOpen: false,
    title: '',
    description: '',
    isDanger: false,
    confirmText: 'Confirm',
    onConfirm: () => {},
    errorMsg: null
  })

  const [reflectionError, setReflectionError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  // Filter & sort explorer items
  const filteredMemories = memories
    .filter(m => {
      const matchQuery = m.title.toLowerCase().includes(query.toLowerCase()) || m.content.toLowerCase().includes(query.toLowerCase())
      const matchType = typeFilter === 'ALL' || m.memory_type === typeFilter
      const matchState = stateFilter === 'ALL' || 
                         (stateFilter === 'ACTIVE' && m.lifecycle_state !== 'ARCHIVED') || 
                         (stateFilter === 'ARCHIVED' && m.lifecycle_state === 'ARCHIVED')
      return matchQuery && matchType && matchState
    })
    .sort((a, b) => {
      if (sortBy === 'importance') return Number(b.importance_score) - Number(a.importance_score)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Handlers
  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await createMemoryAction(newMemory.title, newMemory.content, newMemory.type as any)
      if (res.success) {
        setIsAddOpen(false)
        setNewMemory({ title: '', content: '', type: 'CUSTOM' })
        showSuccess('Memory card recorded successfully!')
      } else {
        alert(res.error || 'Failed to record memory.')
      }
    })
  }

  const handleUpdateMemory = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateMemoryAction(editingMemory.id, editingMemory.title, editingMemory.content, Number(editingMemory.importance_score || 1.0))
      if (res.success) {
        setEditingMemory(null)
        showSuccess('Memory card updated successfully!')
      } else {
        alert(res.error || 'Failed to update memory.')
      }
    })
  }

  const triggerDeleteConfirm = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Memory Card',
      description: 'Are you sure you want to permanently erase this cognitive memory node from your AI context?',
      isDanger: true,
      confirmText: 'Erase Memory',
      errorMsg: null,
      onConfirm: async () => {
        const res = await deleteMemoryAction(id)
        if (res.success) {
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
          showSuccess('Memory node erased.')
        } else {
          setConfirmModal(prev => ({ ...prev, errorMsg: res.error || 'Failed to delete' }))
        }
      }
    })
  }

  const triggerArchiveConfirm = (id: string, currentLifecycle: string) => {
    const isArchived = currentLifecycle === 'ARCHIVED'
    setConfirmModal({
      isOpen: true,
      title: isArchived ? 'Restore Memory Card' : 'Archive Memory Card',
      description: isArchived 
        ? 'This will restore this cognitive memory block into active AI personalization contexts.' 
        : 'This will put this memory node in cold archive storage, preventing the AI from referencing it during active chats.',
      isDanger: false,
      confirmText: isArchived ? 'Restore' : 'Archive',
      errorMsg: null,
      onConfirm: async () => {
        const res = await archiveMemoryAction(id, !isArchived)
        if (res.success) {
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
          showSuccess(isArchived ? 'Memory card restored!' : 'Memory card archived.')
        } else {
          setConfirmModal(prev => ({ ...prev, errorMsg: res.error || 'Failed to toggle archive' }))
        }
      }
    })
  }

  const triggerReflection = () => {
    setReflectionError(null)
    startTransition(async () => {
      const res = await generateReflectionAction()
      if (res.success) {
        showSuccess('Reflective analysis completed. New insights added!')
      } else {
        setReflectionError(res.error || 'Reflection failed.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {(['overview', 'explorer', 'graph', 'reflections', 'timeline'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`pb-3 text-sm font-bold border-b-2 capitalize transition-all cursor-pointer ${
              activeSubTab === tab
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab === 'graph' ? 'Relationship Graph' : tab === 'reflections' ? 'Reflection Center' : tab}
          </button>
        ))}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. OVERVIEW VIEW */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Nodes</span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{summary?.totalMemories || 0}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Relationships</span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{summary?.relationshipDensity || 0}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Completeness</span>
                <span className="text-3xl font-extrabold text-indigo-500">{summary?.profileCompleteness || 0}%</span>
              </div>
            </div>

            {/* AI Personalization Summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                Active Personalization Profile
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">AI Interaction Style</span>
                  <span className="text-slate-700 dark:text-slate-200">{preferences?.preferredAiStyle || 'BALANCED'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Learning Style Profile</span>
                  <span className="text-slate-700 dark:text-slate-200">{preferences?.preferredLearningStyle || 'VISUAL'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Ideal Study Hours</span>
                  <span className="text-slate-700 dark:text-slate-200">{preferences?.preferredStudyHours || 4} Hours/day</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Focus Target</span>
                  <span className="text-slate-700 dark:text-slate-200">{preferences?.focusDuration || 45} mins/block</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Memory Health diagnostics */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">Memory Storage Health</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Index Fragmentation</span>
                    <span className="text-emerald-500">Good (0.8%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '8%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Decay Level</span>
                    <span className="text-amber-500">Medium (34%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: '34%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Embedding Utilization</span>
                    <span className="text-indigo-500">Optimal</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: '85%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MEMORY EXPLORER VIEW */}
      {activeSubTab === 'explorer' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Action Row */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96 relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search cognitive memory blocks..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto whitespace-nowrap">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="ACADEMIC">Academic</option>
                <option value="PROJECTS">Projects</option>
                <option value="CERTIFICATIONS">Certifications</option>
                <option value="KNOWLEDGE">Knowledge</option>
                <option value="PREFERENCE">Preferences</option>
                <option value="CUSTOM">Custom</option>
              </select>

              <select
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="ACTIVE">Active Memories</option>
                <option value="ARCHIVED">Archived Memories</option>
                <option value="ALL">All States</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="importance">Highest Importance</option>
              </select>

              <Button
                onClick={() => setIsAddOpen(true)}
                className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <Plus className="h-4 w-4" />
                Record Memory
              </Button>
            </div>
          </div>

          {/* Memory grid list */}
          {filteredMemories.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
              <Brain className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No matching memories found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMemories.map(m => (
                <div key={m.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-xs transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                        {m.memory_type}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Imp: {m.importance_score}</span>
                        <span className="text-[10px] font-bold text-slate-500 capitalize px-2 py-0.5 rounded-full border dark:border-slate-800">
                          {m.lifecycle_state}
                        </span>
                      </div>
                    </div>

                    {editingMemory?.id === m.id ? (
                      <form onSubmit={handleUpdateMemory} className="space-y-3 my-2">
                        <input
                          type="text"
                          value={editingMemory.title}
                          onChange={e => setEditingMemory({ ...editingMemory, title: e.target.value })}
                          className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border dark:border-slate-700 outline-none"
                        />
                        <textarea
                          value={editingMemory.content}
                          onChange={e => setEditingMemory({ ...editingMemory, content: e.target.value })}
                          rows={3}
                          className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border dark:border-slate-700 outline-none"
                        />
                        <div className="flex gap-2">
                          <Button size="xs" type="submit" disabled={isPending} className="bg-indigo-600 text-white rounded-lg">Save</Button>
                          <Button size="xs" variant="outline" onClick={() => setEditingMemory(null)} className="rounded-lg">Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.title}</h4>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-3">
                          {m.content}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t dark:border-slate-800 mt-4 pt-3 text-[10px] font-bold text-slate-400">
                    <span>Recorded {new Date(m.created_at).toLocaleDateString()}</span>
                    
                    {!editingMemory && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingMemory(m)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => triggerArchiveConfirm(m.id, m.lifecycle_state)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => triggerDeleteConfirm(m.id)}
                          className="p-1.5 text-red-500 hover:text-red-600 rounded-md cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. RELATIONSHIP GRAPH VIEW */}
      {activeSubTab === 'graph' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Link2 className="h-4.5 w-4.5 text-indigo-500" />
            Mapped Memory Node Relationships
          </h3>

          {relationships.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No logical associations registered.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relationships.map(r => (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 text-sm font-semibold">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-indigo-500 block mb-0.5">Source Node</span>
                    <span className="text-slate-800 dark:text-slate-200">{r.source_title}</span>
                  </div>
                  
                  <div className="shrink-0 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 border dark:border-slate-800 rounded bg-white dark:bg-slate-900 uppercase">
                      {r.relationship_type}
                    </span>
                    <div className="h-px w-16 bg-slate-200 dark:bg-slate-800 my-1" />
                  </div>

                  <div className="flex-1 text-right">
                    <span className="text-[10px] font-bold text-indigo-500 block mb-0.5">Target Node</span>
                    <span className="text-slate-800 dark:text-slate-200">{r.target_title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. REFLECTION CENTER VIEW */}
      {activeSubTab === 'reflections' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Personal Insights & Syntheses</h3>
              <p className="text-xs text-slate-500 mt-0.5">AI-synthesized learning cycles generated from your active logs.</p>
            </div>
            
            <Button
              onClick={triggerReflection}
              disabled={isPending}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
              Generate Reflections
            </Button>
          </div>

          {reflectionError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-500 text-xs font-bold">
              {reflectionError}
            </div>
          )}

          {reflections.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/20">
              <Sparkles className="h-8 w-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Click generate to run reflective cycles.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reflections.map((r, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded uppercase">
                      {r.reflection_type || 'Insight'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{r.title}</h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                    {r.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. MEMORY TIMELINE VIEW */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Cognitive Timeline Logs</h3>
          
          <div className="relative border-l border-slate-200 dark:border-slate-800 pl-6 ml-3 space-y-8">
            {memories.map((m, idx) => (
              <div key={idx} className="relative">
                {/* Node indicator */}
                <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full border-4 border-slate-50 dark:border-slate-950 bg-indigo-500" />
                
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Ingested: {m.title}</h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-450 mt-1 leading-relaxed">
                    {m.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECORD NEW MEMORY DIALOG */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-0 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsAddOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Cognitive Memory</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">×</button>
            </div>
            
            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Memory Node Type</label>
                <select
                  value={newMemory.type}
                  onChange={e => setNewMemory({ ...newMemory, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none"
                >
                  <option value="CUSTOM">Custom / Conversation Context</option>
                  <option value="ACADEMIC">Academic / Course Concept</option>
                  <option value="PROJECTS">Project Insight</option>
                  <option value="CERTIFICATIONS">Certification Note</option>
                  <option value="GOAL">Personal Goal / Milestone</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Prefers visual flowchart diagrams"
                  value={newMemory.title}
                  onChange={e => setNewMemory({ ...newMemory, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Record what the AI should remember about this topic or interaction..."
                  value={newMemory.content}
                  onChange={e => setNewMemory({ ...newMemory, content: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setIsAddOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer">
                  {isPending && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                  Save Memory Card
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENDER CONFIRMATION MODAL */}
      <ConfirmationDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
        confirmText={confirmModal.confirmText}
        isLoading={isPending}
        errorMsg={confirmModal.errorMsg}
      />
    </div>
  )
}
