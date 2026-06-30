'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckSquare, GraduationCap, Briefcase, Award, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createTaskDirect } from '@/app/actions/tasks'

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        setIsTaskModalOpen(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const actions = [
    { id: 'search-knowledge', label: 'Search Knowledge', icon: Search, shortcut: 'K', route: '/knowledge' },
    { id: 'create-task', label: 'Create Task', icon: CheckSquare, shortcut: 'T', actionType: 'modal' },
    { id: 'create-project', label: 'Create Project', icon: Briefcase, shortcut: 'P', route: '/projects' },
    { id: 'open-academic', label: 'Open Academic Hub', icon: GraduationCap, shortcut: 'A', route: '/academic' },
    { id: 'go-to-cert', label: 'Go To Certifications', icon: Award, shortcut: 'C', route: '/certifications' },
  ]

  const filteredActions = query === '' 
    ? actions 
    : actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))

  const handleSelect = (action: any) => {
    setIsOpen(false)
    setQuery('')
    if (action.actionType === 'modal' && action.id === 'create-task') {
      setIsTaskModalOpen(true)
    } else if (action.route) {
      router.push(action.route)
    }
  }

  const handleTaskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const priority = formData.get('priority') as string
    const dueDate = formData.get('due_date') as string

    try {
      const res = await createTaskDirect({
        title,
        priority: (priority as any) || 'MEDIUM',
        due_date: dueDate || undefined
      })
      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to create task')
      } else {
        setIsTaskModalOpen(false)
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[101] p-4"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-gray-800 overflow-hidden">
                <div className="flex items-center px-4 border-b dark:border-gray-800">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input 
                    type="text"
                    autoFocus
                    placeholder="What do you need? (e.g., 'Create Task')"
                    className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white px-4 py-4 text-lg placeholder-gray-400 outline-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button onClick={() => setIsOpen(false)} className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {filteredActions.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-6">No actions found.</p>
                  ) : (
                    filteredActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleSelect(action)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <action.icon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-400 border dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-900 shadow-xs">
                          {action.shortcut}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-t dark:border-gray-800 flex items-center justify-between text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>Press <kbd className="font-sans px-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Ctrl+K</kbd> anytime</span>
                  </div>
                  <span>esc to close</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TASK CREATION MODAL FROM COMMAND PALETTE */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Task</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleTaskSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-semibold">
                  {errorMsg}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Task Title</label>
                <input 
                  type="text" 
                  name="title"
                  autoFocus
                  required
                  placeholder="E.g., Complete chapter 3 readings"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select name="priority" defaultValue="MEDIUM" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white">
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

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsTaskModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
