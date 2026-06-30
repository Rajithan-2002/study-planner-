'use client'

import { useState, useTransition } from 'react'
import { createCertification } from '@/app/actions/certifications'
import { X, Loader2 } from 'lucide-react'

export function NewCertDialog({ 
  isOpen, 
  onClose,
  domains 
}: { 
  isOpen: boolean
  onClose: () => void
  domains: { id: string, name: string }[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createCertification(formData)
      if (res && res.success) {
        onClose()
      } else {
        setError(res?.error || 'Failed to create certification')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Certification</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form action={onSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Certification Name *
              </label>
              <input
                required
                id="name"
                name="name"
                type="text"
                placeholder="e.g. AWS Solutions Architect"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="domain_id" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Domain *
                </label>
                <select
                  required
                  id="domain_id"
                  name="domain_id"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="" disabled>Select domain...</option>
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priority *
                </label>
                <select
                  required
                  id="priority"
                  name="priority"
                  defaultValue="LOW"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="LOW">Low (25)</option>
                  <option value="MEDIUM">Medium (50)</option>
                  <option value="HIGH">High (75)</option>
                  <option value="CRITICAL">Critical (100)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="target_date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Date (Optional)
                </label>
                <input
                  id="target_date"
                  name="target_date"
                  type="date"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="exam_date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exam Date (Optional)
                </label>
                <input
                  id="exam_date"
                  name="exam_date"
                  type="date"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimated_total_hours" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Total Hours
                </label>
                <input
                  id="estimated_total_hours"
                  name="estimated_total_hours"
                  type="number"
                  min="0"
                  defaultValue="0"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  defaultValue="MEDIUM"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Study materials, links, focus areas..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
              />
            </div>
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
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Certification
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
