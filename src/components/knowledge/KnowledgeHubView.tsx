'use client'

import { useState, useTransition } from 'react'
import {
  Library,
  Search,
  FileText,
  FileImage,
  Folder,
  Trash2,
  Inbox,
  Sparkles,
  Download,
  Calendar,
  Layers,
  Edit,
  X,
  Loader2
} from 'lucide-react'
import { deleteKnowledgeFile } from '@/app/actions/knowledge'
import { deleteNote, updateNote } from '@/app/actions/quick-capture'
import { UploadButton } from './upload-button'
import { useRouter } from 'next/navigation'

interface KnowledgeFile {
  id: string
  file_name: string
  file_url: string
  file_type: string
  entity_type: string
  created_at: string
}

interface Note {
  id: string
  title: string
  content: string
  domain_id: string | null
  tags: string[]
  created_at: string
}

interface Domain {
  id: string
  name: string
}

interface KnowledgeHubViewProps {
  initialFiles: KnowledgeFile[]
  initialNotes: Note[]
  domains: Domain[]
}

export function KnowledgeHubView({ initialFiles, initialNotes, domains }: KnowledgeHubViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleDeleteFile = async (id: string) => {
    const res = await deleteKnowledgeFile(id)
    if (res && res.success) {
      router.refresh()
    } else {
      console.error('Failed to delete file:', res?.error)
    }
  }

  const handleDeleteNote = async (id: string) => {
    const res = await deleteNote(id)
    if (res && res.success) {
      router.refresh()
    } else {
      console.error('Failed to delete note:', res?.error)
    }
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

  // Filter files & notes by search query
  const query = searchQuery.toLowerCase()

  const filteredFiles = initialFiles.filter(file => {
    let categoryMatch = true
    if (selectedCategory === 'RECENT') {
      const uploadDate = new Date(file.created_at)
      const diffTime = Math.abs(new Date().getTime() - uploadDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      categoryMatch = diffDays <= 7
    } else if (selectedCategory !== 'ALL' && selectedCategory !== 'NOTES') {
      categoryMatch = file.entity_type === selectedCategory
    } else if (selectedCategory === 'NOTES') {
      return false // Don't show files in Notes tab
    }

    const nameMatch = file.file_name.toLowerCase().includes(query)
    const typeMatch = file.file_type.toLowerCase().includes(query)
    const entityMatch = file.entity_type.toLowerCase().includes(query)

    return categoryMatch && (nameMatch || typeMatch || entityMatch)
  })

  const filteredNotes = initialNotes.filter(note => {
    // Only show notes if category is ALL, RECENT, or NOTES
    let categoryMatch = selectedCategory === 'ALL' || selectedCategory === 'NOTES' || selectedCategory === 'RECENT'
    if (selectedCategory === 'RECENT') {
      const createDate = new Date(note.created_at)
      const diffTime = Math.abs(new Date().getTime() - createDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      categoryMatch = diffDays <= 7
    }

    const titleMatch = note.title.toLowerCase().includes(query)
    const contentMatch = (note.content || '').toLowerCase().includes(query)

    return categoryMatch && (titleMatch || contentMatch)
  })

  const categories = [
    { id: 'ALL', name: 'All Resources', icon: Library },
    { id: 'RECENT', name: 'Recently Added', icon: ClockIcon },
    { id: 'NOTES', name: 'Notes & Snippets', icon: FileText },
    { id: 'MODULE', name: 'Academic Modules', icon: Folder },
    { id: 'PROJECT', name: 'Projects & Ideas', icon: Layers },
    { id: 'CERTIFICATION', name: 'Certifications', icon: AwardIcon },
    { id: 'INBOX', name: 'Universal Inbox', icon: Inbox },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* SEARCH AND UPLOAD ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        
        {/* Search Engine Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files and notes..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-10 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
          {searchQuery && (
            <Sparkles className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500 animate-pulse" />
          )}
        </div>

        <UploadButton domains={domains} />
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
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 hover:text-slate-900 dark:hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* DOCUMENTS LISTING */}
        <div className="col-span-1 lg:col-span-3">
          
          {/* Notes display grid */}
          {(selectedCategory === 'NOTES' || selectedCategory === 'ALL' || selectedCategory === 'RECENT') && filteredNotes.length > 0 && (
            <div className="space-y-4 mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Notes ({filteredNotes.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex flex-col rounded-2xl bg-gradient-to-br from-amber-50/40 to-amber-100/10 dark:from-slate-900 dark:to-slate-900 border border-amber-200/40 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all duration-200"
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
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-4 whitespace-pre-wrap leading-relaxed flex-1">
                      {note.content || 'No content provided.'}
                    </p>

                    <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-amber-100/50 dark:border-slate-850">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors cursor-pointer"
                        title="Edit Note"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
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

          {/* Files display grid */}
          {selectedCategory !== 'NOTES' && (
            <div className="space-y-4">
              {filteredFiles.length > 0 && selectedCategory === 'ALL' && (
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                  Documents & Files ({filteredFiles.length})
                </h3>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.length === 0 && filteredNotes.length === 0 && (
                  <div className="col-span-full py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 dark:text-slate-400 font-semibold bg-white dark:bg-slate-900">
                    No matching documents or notes found.
                  </div>
                )}

                {filteredFiles.map((doc) => {
                  const isImage = ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(doc.file_type)
                  const isPdf = doc.file_type === 'PDF'

                  return (
                    <div
                      key={doc.id}
                      className="group relative flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-755 hover:shadow-xs transition-all duration-200 animate-in fade-in"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
                          isPdf
                            ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                            : isImage
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                              : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                        }`}>
                          {isImage ? <FileImage className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md">
                          {doc.entity_type}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {doc.file_name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                        {doc.file_type} File
                      </span>

                      <div className="mt-5 flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-850">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>

                        <div className="flex gap-1">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors cursor-pointer"
                            title="Download Document"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          
                          <button
                            onClick={() => handleDeleteFile(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                            title="Delete Document"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Note</h3>
              <button onClick={() => setEditingNote(null)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditNoteSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-semibold">
                  {errorMsg}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input 
                  type="text" 
                  name="title"
                  defaultValue={editingNote.title}
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>

              {domains.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Domain</label>
                  <select name="domain_id" defaultValue={editingNote.domain_id || ''} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white">
                    <option value="">No Domain</option>
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Content</label>
                <textarea 
                  name="content"
                  rows={6}
                  required
                  defaultValue={editingNote.content}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setEditingNote(null)}
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return <FileText className={className} />
}

function AwardIcon({ className }: { className?: string }) {
  return <Layers className={className} />
}
