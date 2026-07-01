'use client'

import { useState } from 'react'
import { Sparkles, X, Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { aiQuickCaptureAction } from '@/app/actions/quick-capture'

export function QuickCapture() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const router = useRouter()

  const openModal = () => {
    setIsOpen(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    setInputText('')
  }

  const closeModal = () => {
    setIsOpen(false)
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inputText.trim() || isSubmitting) return

    setIsSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await aiQuickCaptureAction(inputText.trim())
      if (res && res.success) {
        setSuccessMsg(res.message || 'Successfully captured!')
        setInputText('')
        router.refresh()
        setTimeout(() => {
          closeModal()
        }, 1500)
      } else {
        setErrorMsg(res.error || 'Failed to capture item.')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to capture item.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={openModal}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:scale-102 transition-all cursor-pointer"
      >
        <Sparkles className="h-4 w-4" />
        AI Quick Capture
      </button>

      {/* MODAL OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-md font-bold text-slate-900 dark:text-white">AI Quick Capture</h3>
              </div>
              <button onClick={closeModal} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 p-1.5 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-650 dark:text-red-400 p-3 rounded-2xl text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 p-3 rounded-2xl text-xs font-semibold whitespace-pre-wrap">
                  {successMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-450 dark:text-slate-500 mb-2 tracking-wider">
                  Describe what to plan
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                  autoFocus
                  required
                  placeholder="e.g., Need to revise Networking before Friday (creates high priority task) or Build AI Portfolio, 120 hours, finish before October (creates project with allocations)..."
                  className="w-full rounded-2xl border border-slate-350 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3.5 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSubmitting}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg hover:scale-102 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Capture with AI
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
