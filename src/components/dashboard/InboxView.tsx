'use client'

import { useState, useTransition } from 'react'
import { Inbox, Trash2, Archive, CheckCircle2, Briefcase, Award, FileText, Calendar, ArrowRight, Loader2, X } from 'lucide-react'
import { deleteInboxItem, archiveInboxItem } from '@/app/actions/quick-capture'
import { createTaskDirect } from '@/app/actions/tasks'
import { createProject } from '@/app/actions/projects'
import { createCertification } from '@/app/actions/certifications'
import { createNoteDirect } from '@/app/actions/quick-capture'
import { useRouter } from 'next/navigation'

interface InboxItem {
  id: string
  content: string
  source: string
  created_at: string
}

interface Domain {
  id: string;
  name: string;
}

export function InboxView({ initialItems, domains }: { initialItems: InboxItem[]; domains: Domain[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeItem, setActiveItem] = useState<InboxItem | null>(null)
  const [convertType, setConvertType] = useState<'TASK' | 'PROJECT' | 'CERTIFICATION' | 'NOTE' | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleArchive = (id: string) => {
    startTransition(async () => {
      const res = await archiveInboxItem(id)
      if (res && res.success) {
        router.refresh()
      } else {
        console.error('Failed to archive inbox item:', res?.error)
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteInboxItem(id)
      if (res && res.success) {
        router.refresh()
      } else {
        console.error('Failed to delete inbox item:', res?.error)
      }
    })
  }

  const openConversion = (item: InboxItem, type: 'TASK' | 'PROJECT' | 'CERTIFICATION' | 'NOTE') => {
    setActiveItem(item)
    setConvertType(type)
    setErrorMsg(null)
  }

  const closeConversion = () => {
    setActiveItem(null)
    setConvertType(null)
    setErrorMsg(null)
  }

  const handleConvertSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!activeItem) return
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string

    try {
      let res: any = null
      if (convertType === 'TASK') {
        const priority = formData.get('priority') as string
        const dueDate = formData.get('due_date') as string
        const desc = formData.get('description') as string
        res = await createTaskDirect({
          title,
          priority: priority as any,
          due_date: dueDate || undefined,
          description: desc || undefined
        })
      } else if (convertType === 'PROJECT') {
        res = await createProject(formData)
      } else if (convertType === 'CERTIFICATION') {
        res = await createCertification(formData)
      } else if (convertType === 'NOTE') {
        const content = formData.get('content') as string
        const domainId = formData.get('domain_id') as string || undefined
        res = await createNoteDirect(title, content, domainId)
      }

      if (res && !res.success) {
        setErrorMsg(res.error || 'Conversion failed.')
        return
      }

      // Delete item from inbox queue on successful conversion
      const deleteRes = await deleteInboxItem(activeItem.id)
      if (deleteRes && !deleteRes.success) {
        setErrorMsg(deleteRes.error || 'Failed to remove item from inbox.')
        return
      }

      closeConversion()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Conversion failed.')
    }
  }

  // Pre-fill clean title (strip prefix like "[Project Idea]")
  const getPreFilledTitle = (content: string) => {
    return content.replace(/^\[.*?\]\s*/, '')
  }

  return (
    <div className="space-y-6">
      
      {initialItems.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 dark:text-slate-400 font-semibold bg-white dark:bg-slate-900">
          <Inbox className="h-10 w-10 text-slate-350 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-sm">Your Universal Inbox is empty.</p>
          <p className="text-xs text-slate-400 mt-1">Use the Quick Capture tool to add tasks, ideas, or notes on the fly!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialItems.map((item) => (
            <div 
              key={item.id} 
              className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-xs relative hover:border-slate-300 dark:hover:border-slate-755 transition-all duration-200"
            >
              {/* Header metadata */}
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                  via {item.source.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Inbox Item Content */}
              <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed flex-1 whitespace-pre-wrap">
                {item.content}
              </p>

              {/* Conversion and Processing Grid Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Convert to:</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <button 
                    onClick={() => openConversion(item, 'TASK')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-150 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 bg-slate-50/50 dark:bg-slate-950/20 cursor-pointer transition-colors"
                    title="Convert to Task"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-[9px] font-bold mt-1">Task</span>
                  </button>
                  <button 
                    onClick={() => openConversion(item, 'PROJECT')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-150 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-50/50 dark:bg-slate-950/20 cursor-pointer transition-colors"
                    title="Convert to Project"
                  >
                    <Briefcase className="h-4 w-4" />
                    <span className="text-[9px] font-bold mt-1">Project</span>
                  </button>
                  <button 
                    onClick={() => openConversion(item, 'CERTIFICATION')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-150 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 bg-slate-50/50 dark:bg-slate-950/20 cursor-pointer transition-colors"
                    title="Convert to Certification"
                  >
                    <Award className="h-4 w-4" />
                    <span className="text-[9px] font-bold mt-1">Cert</span>
                  </button>
                  <button 
                    onClick={() => openConversion(item, 'NOTE')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-150 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 bg-slate-50/50 dark:bg-slate-950/20 cursor-pointer transition-colors"
                    title="Convert to Note"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-[9px] font-bold mt-1">Note</span>
                  </button>
                </div>

                {/* Base Actions */}
                <div className="flex justify-between items-center text-xs">
                  <button 
                    onClick={() => handleArchive(item.id)}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold cursor-pointer"
                  >
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 font-bold cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONVERSION DIALOG */}
      {activeItem && convertType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Convert to {convertType.charAt(0) + convertType.slice(1).toLowerCase()}</h3>
              <button onClick={closeConversion} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleConvertSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-semibold">
                  {errorMsg}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title / Name
                </label>
                <input 
                  type="text" 
                  name="name" 
                  id="title"
                  defaultValue={getPreFilledTitle(activeItem.content)}
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                />
                {/* Make sure name matches whichever form action parses name or title */}
                <input type="hidden" name="title" defaultValue={getPreFilledTitle(activeItem.content)} />
              </div>

              {convertType === 'TASK' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                      <select name="priority" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white">
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                      <input name="due_date" type="date" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea name="description" rows={2} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white" />
                  </div>
                </div>
              )}

              {convertType === 'PROJECT' && (
                <div className="space-y-4">
                  {domains.length > 0 && (
                    <div>
                      <label htmlFor="domain_id" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Domain</label>
                      <select id="domain_id" name="domain_id" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white">
                        <option value="">No Domain</option>
                        {domains.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                      <select id="status" name="status" defaultValue="ACTIVE" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white">
                        <option value="IDEA">IDEA</option>
                        <option value="RESEARCHING">RESEARCHING</option>
                        <option value="ACTIVE">ACTIVE</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="priority" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                      <select id="priority" name="priority" defaultValue="MEDIUM" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white">
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea id="description" name="description" rows={2} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white" />
                  </div>
                </div>
              )}

              {convertType === 'CERTIFICATION' && (
                <div className="space-y-4">
                  {domains.length > 0 && (
                    <div>
                      <label htmlFor="domain_id" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Domain</label>
                      <select id="domain_id" name="domain_id" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white">
                        <option value="">No Domain</option>
                        {domains.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="provider" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Provider</label>
                      <input id="provider" name="provider" type="text" placeholder="e.g. AWS, Coursera" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white" />
                    </div>
                    <div>
                      <label htmlFor="priority" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                      <select id="priority" name="priority" defaultValue="MEDIUM" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white">
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="target_date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Date</label>
                      <input id="target_date" name="target_date" type="date" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white" />
                    </div>
                    <div>
                      <label htmlFor="exam_date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Exam Date (Optional)</label>
                      <input id="exam_date" name="exam_date" type="date" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white" />
                    </div>
                  </div>
                </div>
              )}

              {convertType === 'NOTE' && (
                <div className="space-y-4">
                  {domains.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Domain</label>
                      <select name="domain_id" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white">
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
                      rows={5}
                      required
                      placeholder="Type your note thoughts..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={closeConversion}
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
                  Convert & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
