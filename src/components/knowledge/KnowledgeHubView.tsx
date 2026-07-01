'use client'

import { useState, useTransition } from 'react'
import { Library, Search, FileText, FileImage, Folder, Trash2, Inbox, Sparkles, Download, Calendar, Layers, Edit, X, Loader2, Archive, RefreshCw, Eye, BookOpen } from 'lucide-react'
import { deleteKnowledgeFile, archiveDocument, restoreDocument } from '@/app/actions/knowledge'
import { deleteNote, updateNote, archiveNoteAction, restoreNoteAction } from '@/app/actions/quick-capture'
import { UploadButton } from './upload-button'
import { useRouter } from 'next/navigation'
import { DocumentDetailsModal } from './DocumentDetailsModal'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'

interface KnowledgeHubViewProps {
  initialFiles: any[]
  initialNotes: any[]
  domains: any[]
  modules: any[]
  projects: any[]
  certifications: any[]
  chunks: any[]
  relationships: any[]
}

export function KnowledgeHubView({
  initialFiles = [],
  initialNotes = [],
  domains = [],
  modules = [],
  projects = [],
  certifications = [],
  chunks = [],
  relationships = []
}: KnowledgeHubViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [editingNote, setEditingNote] = useState<any>(null)
  
  // Document details view modal state
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Reusable confirmation modal state
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

  const handleDeleteFile = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Document Permanently',
      description: 'Are you sure you want to erase this document? This will remove all parsed semantic index chunks from your second brain.',
      isDanger: true,
      confirmText: 'Erase Document',
      errorMsg: null,
      onConfirm: async () => {
        const res = await deleteKnowledgeFile(id)
        if (res && res.success) {
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
          router.refresh()
        } else {
          setConfirmModal(prev => ({ ...prev, errorMsg: res?.error || 'Delete failed.' }))
        }
      }
    })
  }

  const handleDeleteNote = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Note Card',
      description: 'Are you sure you want to delete this note? This action cannot be undone.',
      isDanger: true,
      confirmText: 'Delete Note',
      errorMsg: null,
      onConfirm: async () => {
        const res = await deleteNote(id)
        if (res && res.success) {
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
          router.refresh()
        } else {
          setConfirmModal(prev => ({ ...prev, errorMsg: res?.error || 'Delete failed.' }))
        }
      }
    })
  }

  const handleEditNoteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingNote) return
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const domainId = formData.get('domain_id') as string || undefined

    startTransition(async () => {
      const res = await updateNote(editingNote.id, title, content, domainId)
      if (res && res.success) {
        setEditingNote(null)
        router.refresh()
      } else {
        setErrorMsg(res?.error || 'Failed to update note.')
      }
    })
  }

  // Filter logic
  const query = searchQuery.toLowerCase()

  const filteredFiles = initialFiles.filter(file => {
    const matchesTab = activeTab === 'active' ? !file.is_archived : !!file.is_archived
    
    let categoryMatch = true
    if (selectedCategory === 'RECENT') {
      const uploadDate = new Date(file.created_at)
      const diffTime = Math.abs(new Date().getTime() - uploadDate.getTime())
      const diffDays = Math.ceil(diffTime / 86400000)
      categoryMatch = diffDays <= 7
    } else if (selectedCategory !== 'ALL' && selectedCategory !== 'NOTES') {
      categoryMatch = file.entity_type === selectedCategory
    } else if (selectedCategory === 'NOTES') {
      return false
    }

    const nameMatch = file.file_name.toLowerCase().includes(query)
    const typeMatch = (file.file_type || '').toLowerCase().includes(query)
    const descMatch = (file.description || '').toLowerCase().includes(query)

    return matchesTab && categoryMatch && (nameMatch || typeMatch || descMatch)
  })

  const filteredNotes = initialNotes.filter(note => {
    const isNoteArchived = note.is_archived || (note.tags && note.tags.includes('archived'))
    const matchesTab = activeTab === 'active' ? !isNoteArchived : !!isNoteArchived
    if (!matchesTab) return false

    let categoryMatch = selectedCategory === 'ALL' || selectedCategory === 'NOTES' || selectedCategory === 'RECENT'
    if (selectedCategory === 'RECENT') {
      const createDate = new Date(note.created_at)
      const diffTime = Math.abs(new Date().getTime() - createDate.getTime())
      const diffDays = Math.ceil(diffTime / 86400000)
      categoryMatch = diffDays <= 7
    }

    const titleMatch = note.title.toLowerCase().includes(query)
    const contentMatch = (note.content || '').toLowerCase().includes(query)

    return categoryMatch && (titleMatch || contentMatch)
  })

  const categories = [
    { id: 'ALL', name: 'All Resources', icon: Library },
    { id: 'RECENT', name: 'Recently Added', icon: Folder },
    { id: 'NOTES', name: 'Notes & Snippets', icon: FileText },
    { id: 'MODULE', name: 'Academic Modules', icon: Folder },
    { id: 'PROJECT', name: 'Projects & Ideas', icon: Layers },
    { id: 'CERTIFICATION', name: 'Certifications', icon: Folder },
    { id: 'INBOX', name: 'Universal Inbox', icon: Inbox },
  ]

  const totalStorage = initialFiles
    .filter(f => !f.is_archived)
    .reduce((sum, f) => sum + (f.file_size || 0), 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* SEARCH AND METRICS ROW */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents, notes, summaries..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">
            Total Storage: {Math.round((totalStorage / (1024 * 1024)) * 10) / 10} MB
          </span>
          <UploadButton domains={domains} />
        </div>
      </div>

      {/* TABS FOR ACTIVE VS ARCHIVED */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-950'
          }`}
        >
          Active Repository ({initialFiles.filter(f => !f.is_archived).length + initialNotes.filter(n => !n.is_archived && !(n.tags && n.tags.includes('archived'))).length})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'archived'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-950'
          }`}
        >
          Archived Archives ({initialFiles.filter(f => f.is_archived).length + initialNotes.filter(n => n.is_archived || (n.tags && n.tags.includes('archived'))).length})
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        
        {/* SIDEBAR CATEGORIES */}
        <div className="col-span-1">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 shadow-xs">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-3">
              Second Brain Libraries
            </h3>
            <nav className="space-y-1">
              {categories.map((item) => {
                const Icon = item.icon
                const isActive = selectedCategory === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedCategory(item.id)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all w-full text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 border border-blue-100/50 text-blue-600 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* WORKSPACE */}
        <div className="col-span-1 lg:col-span-3">
          
          {/* Notes display */}
          {(selectedCategory === 'NOTES' || selectedCategory === 'ALL' || selectedCategory === 'RECENT') && filteredNotes.length > 0 && (
            <div className="space-y-4 mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Notes ({filteredNotes.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex flex-col rounded-2xl bg-amber-50/20 dark:bg-slate-900 border border-amber-200/40 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/50 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded">
                        NOTE
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{note.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-4 leading-relaxed flex-1">
                      {note.content || 'No content.'}
                    </p>

                    <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-amber-100/50 dark:border-slate-850">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors cursor-pointer"
                        title="Edit Note"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      
                      {activeTab === 'active' ? (
                        <button
                          onClick={() => {
                            startTransition(async () => {
                              await archiveNoteAction(note.id)
                              router.refresh()
                            })
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors cursor-pointer"
                          title="Archive Note"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            startTransition(async () => {
                              await restoreNoteAction(note.id)
                              router.refresh()
                            })
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors cursor-pointer"
                          title="Restore Note"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                        title="Delete Note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files display */}
          {selectedCategory !== 'NOTES' && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Documents & Files ({filteredFiles.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.length === 0 && filteredNotes.length === 0 && (
                  <div className="col-span-full py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-semibold bg-white dark:bg-slate-900">
                    No documents found.
                  </div>
                )}

                {filteredFiles.map((doc) => {
                  const isPdf = doc.file_type === 'PDF'
                  const isImg = ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(doc.file_type)

                  return (
                    <div
                      key={doc.id}
                      className="group relative flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 hover:border-slate-350 hover:shadow-xs transition-all duration-200 animate-in fade-in"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
                          isPdf
                            ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                            : isImg
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                              : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                        }`}>
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                          {doc.entity_type}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {doc.file_name}
                      </h4>
                      <div className="flex justify-between text-[10px] text-slate-400 uppercase mt-1">
                        <span>{doc.file_type} File</span>
                        <span>{Math.round(((doc.file_size || 0) / 1024) * 10) / 10} KB</span>
                      </div>

                      {doc.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 italic leading-relaxed">
                          {doc.description}
                        </p>
                      )}

                      <div className="mt-5 flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-850">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors cursor-pointer"
                            title="View Knowledge Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors cursor-pointer"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>

                          {activeTab === 'active' ? (
                            <button
                              onClick={() => {
                                startTransition(async () => {
                                  await archiveDocument(doc.id)
                                  router.refresh()
                                })
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors cursor-pointer"
                              title="Archive File"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                startTransition(async () => {
                                  await restoreDocument(doc.id)
                                  router.refresh()
                                })
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors cursor-pointer"
                              title="Restore File"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteFile(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* EDIT NOTE MODAL */}
      {editingNote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Note</h3>
              <button onClick={() => setEditingNote(null)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditNoteSubmit} className="p-6 space-y-4">
              {errorMsg && <div className="bg-red-50 text-red-650 p-3 rounded-lg text-xs font-semibold">{errorMsg}</div>}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input type="text" name="title" defaultValue={editingNote.title} required className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 p-2.5 text-xs font-bold outline-none dark:text-white" />
              </div>
              {domains.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Domain</label>
                  <select name="domain_id" defaultValue={editingNote.domain_id || ''} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 p-2.5 text-xs font-bold outline-none dark:text-white">
                    <option value="">No Domain</option>
                    {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Content</label>
                <textarea name="content" rows={5} required defaultValue={editingNote.content} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 p-2.5 text-xs outline-none dark:text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingNote(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                <button type="submit" disabled={isPending} className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT DETAILS DETAILS MODAL */}
      <DocumentDetailsModal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        doc={selectedDoc}
        allChunks={chunks}
        allRelationships={relationships}
        linkedEntities={{ modules, projects, certifications }}
      />

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
