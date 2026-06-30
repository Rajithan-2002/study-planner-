'use client'

import { useState, useTransition } from 'react'
import { X, Calendar, Edit3, Link2, Unlink, FileText, Layers, Award, Tag, Check, HelpCircle, Loader2 } from 'lucide-react'
import { updateDocumentMetadata, linkEntities, unlinkEntities } from '@/app/actions/knowledge'
import { useRouter } from 'next/navigation'

interface DocumentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  doc: any
  allChunks: any[]
  allRelationships: any[]
  linkedEntities: any // pre-fetched list of all potential targets { modules, projects, certs }
}

export function DocumentDetailsModal({ isOpen, onClose, doc, allChunks = [], allRelationships = [], linkedEntities }: DocumentDetailsModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'metadata' | 'chunks' | 'relationships'>('metadata')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Edit metadata form states
  const [meta, setMeta] = useState({
    file_name: doc?.file_name || '',
    description: doc?.description || '',
    author: doc?.author || '',
    source_type: doc?.source_type || 'UPLOAD',
    version: doc?.version || '1.0',
    language: doc?.language || 'en',
    visibility: doc?.visibility || 'private',
    knowledge_status: doc?.knowledge_status || 'UNREAD',
    reading_progress: doc?.reading_progress || 0,
    tags: (doc?.tags || []).join(', ')
  })

  // Relationship linker states
  const [targetType, setTargetType] = useState('PROJECT')
  const [targetId, setTargetId] = useState('')

  if (!isOpen || !doc) return null

  const docChunks = allChunks.filter(c => c.file_id === doc.id)
  const docRels = allRelationships.filter(r => r.source_entity_id === doc.id || r.target_entity_id === doc.id)

  const handleSaveMetadata = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    startTransition(async () => {
      const fd = new FormData()
      fd.append('doc_id', doc.id)
      fd.append('file_name', meta.file_name)
      fd.append('description', meta.description)
      fd.append('author', meta.author)
      fd.append('source_type', meta.source_type)
      fd.append('version', meta.version)
      fd.append('language', meta.language)
      fd.append('visibility', meta.visibility)
      fd.append('knowledge_status', meta.knowledge_status)
      fd.append('reading_progress', String(meta.reading_progress))
      fd.append('tags', meta.tags)

      const res = await updateDocumentMetadata(fd)
      if (res && res.success) {
        router.refresh()
      } else {
        setErrorMsg(res.error || 'Failed to update metadata.')
      }
    })
  }

  const handleLinkEntity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetId) return
    setErrorMsg(null)

    startTransition(async () => {
      const res = await linkEntities('KNOWLEDGE_FILE', doc.id, targetType, targetId, 'REFERENCES')
      if (res && res.success) {
        setTargetId('')
        router.refresh()
      } else {
        setErrorMsg(res.error || 'Failed to link entity.')
      }
    })
  }

  const handleUnlinkEntity = (relId: string) => {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await unlinkEntities(relId)
      if (res && res.success) {
        router.refresh()
      } else {
        setErrorMsg(res.error || 'Failed to unlink entity.')
      }
    })
  }

  // Get options for linking dropdown
  const getLinkOptions = () => {
    switch (targetType) {
      case 'MODULE':
        return linkedEntities.modules || []
      case 'PROJECT':
        return linkedEntities.projects || []
      case 'CERTIFICATION':
        return linkedEntities.certifications || []
      default:
        return []
    }
  }

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{doc.file_name}</h3>
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Document Hub ID: {doc.id}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* TABS TRAY */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('metadata')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'metadata' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Metadata Details
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chunks' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            RAG Chunks Preview ({docChunks.length})
          </button>
          <button
            onClick={() => setActiveTab('relationships')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'relationships' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Knowledge Graph ({docRels.length})
          </button>
        </div>

        {errorMsg && (
          <div className="m-6 mb-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">

          {/* TAB 1: METADATA DETAILS */}
          {activeTab === 'metadata' && (
            <form onSubmit={handleSaveMetadata} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-350 uppercase mb-1">Document Name</label>
                <input
                  type="text"
                  required
                  value={meta.file_name}
                  onChange={e => setMeta({ ...meta, file_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-350 uppercase mb-1">Description / Summary</label>
                <textarea
                  rows={3}
                  value={meta.description}
                  onChange={e => setMeta({ ...meta, description: e.target.value })}
                  placeholder="Document focus, keywords, chapters summary..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs outline-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-350 uppercase mb-1">Author</label>
                  <input
                    type="text"
                    value={meta.author}
                    onChange={e => setMeta({ ...meta, author: e.target.value })}
                    placeholder="E.g., Dr. Jane Doe, Cisco Press"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-350 uppercase mb-1">Source Type</label>
                  <select
                    value={meta.source_type}
                    onChange={e => setMeta({ ...meta, source_type: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold outline-none dark:text-white"
                  >
                    <option value="UPLOAD">UPLOAD</option>
                    <option value="URL">URL Link</option>
                    <option value="NOTE">Obsidian Note</option>
                    <option value="BOOK">E-Book</option>
                    <option value="VIDEO">Video Reference</option>
                    <option value="COURSE">Online Course</option>
                    <option value="WEB">Web Clipping</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-350 uppercase mb-1">Document Status</label>
                  <select
                    value={meta.knowledge_status}
                    onChange={e => setMeta({ ...meta, knowledge_status: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold outline-none dark:text-white"
                  >
                    <option value="UNREAD">Unread</option>
                    <option value="READING">Reading</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="MASTERED">Mastered</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-350 uppercase mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={meta.reading_progress}
                    onChange={e => setMeta({ ...meta, reading_progress: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-350 uppercase mb-1">Version</label>
                  <input
                    type="text"
                    value={meta.version}
                    onChange={e => setMeta({ ...meta, version: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-350 uppercase mb-1">Tags (Comma Sep)</label>
                  <input
                    type="text"
                    placeholder="E.g., study, cloud, database"
                    value={meta.tags}
                    onChange={e => setMeta({ ...meta, tags: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-350 uppercase mb-1">Language</label>
                  <input
                    type="text"
                    value={meta.language}
                    onChange={e => setMeta({ ...meta, language: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Metadata Change
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CHUNKS PREVIEW */}
          {activeTab === 'chunks' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-xs text-blue-700 dark:text-blue-400 font-semibold border border-blue-100 dark:border-blue-900/30">
                <p className="font-extrabold mb-1">AI Embedding Pipeline Status: {doc.processing_status}</p>
                <p>This document is parsed into {docChunks.length} logical content chunks. Token counts and offsets are compiled in advance for semantic search.</p>
              </div>

              <div className="space-y-3">
                {docChunks.map(chunk => (
                  <div key={chunk.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-755 text-xs space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-200/50 dark:border-slate-700/40">
                      <span>Chunk #{chunk.chunk_number}</span>
                      <span>{chunk.token_count} Tokens | Offsets: {chunk.start_offset}-{chunk.end_offset}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-bold leading-relaxed whitespace-pre-wrap">{chunk.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RELATIONSHIPS GRAPH */}
          {activeTab === 'relationships' && (
            <div className="space-y-6">
              
              {/* CURRENT LINKS */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Linked Graph Connections</h4>
                {docRels.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">This document is not linked to any other domains or tracks yet.</p>
                ) : (
                  <div className="space-y-2">
                    {docRels.map(rel => {
                      const isSource = rel.source_entity_id === doc.id
                      const targetId = isSource ? rel.target_entity_id : rel.source_entity_id
                      const targetType = isSource ? rel.target_entity_type : rel.source_entity_type

                      return (
                        <div key={rel.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/45 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            {targetType === 'PROJECT' && <Layers className="h-4 w-4 text-blue-500" />}
                            {targetType === 'CERTIFICATION' && <Award className="h-4 w-4 text-emerald-500" />}
                            {targetType === 'MODULE' && <FileText className="h-4 w-4 text-indigo-500" />}
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">{targetType} ID: {targetId.substring(0, 8)}...</span>
                          </div>
                          <button
                            onClick={() => handleUnlinkEntity(rel.id)}
                            disabled={isPending}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                            title="Remove Link"
                          >
                            <Unlink className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* CREATE LINK FORM */}
              <form onSubmit={handleLinkEntity} className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-4">
                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Link2 className="h-4 w-4 text-blue-500" /> Link to Platform Entity
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Entity Type</label>
                    <select
                      value={targetType}
                      onChange={e => {
                        setTargetType(e.target.value)
                        setTargetId('')
                      }}
                      className="w-full text-xs font-bold rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 outline-none dark:text-white"
                    >
                      <option value="PROJECT">Project</option>
                      <option value="CERTIFICATION">Certification</option>
                      <option value="MODULE">Academic Module</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select Entity</label>
                    <select
                      value={targetId}
                      required
                      onChange={e => setTargetId(e.target.value)}
                      className="w-full text-xs font-bold rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 outline-none dark:text-white"
                    >
                      <option value="">Choose item...</option>
                      {getLinkOptions().map((opt: any) => (
                        <option key={opt.id} value={opt.id}>{opt.name || opt.code || opt.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isPending || !targetId}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    Link Relationship Node
                  </button>
                </div>
              </form>

            </div>
          )}

        </div>

      </div>
    </div>
  )
}
