'use client'

import { useState, useTransition } from 'react'
import { uploadKnowledgeFile } from '@/app/actions/knowledge'
import { X, Loader2, UploadCloud } from 'lucide-react'

export function UploadDialog({ 
  isOpen, 
  onClose,
  domains
}: { 
  isOpen: boolean
  onClose: () => void
  domains: { id: string; name: string }[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to upload.')
      return
    }
    
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('file', file)

    startTransition(async () => {
      const res = await uploadKnowledgeFile(formData)
      if (res && res.success) {
        setFile(null)
        onClose()
      } else {
        setError(res?.error || 'Failed to upload document')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upload Document</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            
            <div className="flex justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 px-6 py-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative">
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-slate-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md font-semibold text-indigo-600 dark:text-indigo-400 focus-within:outline-none hover:text-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {file ? <span className="font-bold text-slate-900 dark:text-white">{file.name}</span> : 'PDF, PNG, JPG, DOCX up to 10MB'}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="entity_type" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                required
                id="entity_type"
                name="entity_type"
                defaultValue="INBOX"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
              >
                <option value="INBOX">General Resource (Inbox)</option>
                <option value="MODULE">Academic Module</option>
                <option value="PROJECT">Project</option>
                <option value="CERTIFICATION">Certification</option>
              </select>
            </div>

            {domains.length > 0 && (
              <div>
                <label htmlFor="domain_id" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Domain (Optional)
                </label>
                <select
                  id="domain_id"
                  name="domain_id"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="">No Domain</option>
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !file}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
