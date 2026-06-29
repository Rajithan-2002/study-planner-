'use client'

import { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createInboxItem, createNoteDirect } from '@/app/actions/quick-capture'
import { createTaskDirect } from '@/app/actions/tasks'
import { createLifeEventDirect } from '@/app/actions/life-events'
import { createDomain } from '@/app/actions/domains'

export function QuickCapture() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  const toggleDropdown = () => setIsOpen(!isOpen)

  const openModal = (type: string) => {
    setActiveModal(type)
    setIsOpen(false)
    setErrorMsg(null)
  }

  const closeModal = () => {
    setActiveModal(null)
    setErrorMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)
    
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    
    try {
      let res: any = null
      if (activeModal === 'Task') {
        const priority = formData.get('priority') as string
        const dueDate = formData.get('due_date') as string
        res = await createTaskDirect({
          title,
          priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          due_date: dueDate || undefined,
        })
      } else if (activeModal === 'Note') {
        const content = formData.get('content') as string
        res = await createNoteDirect(title, content)
      } else if (activeModal === 'Life Event') {
        res = await createLifeEventDirect({
          title,
          type: 'PROJECT_MILESTONE',
          event_date: new Date().toISOString().split('T')[0],
          importance: 50,
        })
      } else if (activeModal === 'Domain') {
        res = await createDomain(title)
      } else {
        // Project Idea, Certification Idea, etc -> send to INBOX
        const typePrefix = activeModal ? `[${activeModal}] ` : ''
        res = await createInboxItem(`${typePrefix}${title}`)
      }
      
      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to capture item.')
      } else {
        closeModal()
        router.refresh()
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
        onClick={toggleDropdown}
        className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Quick Capture
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
          <button onClick={() => openModal('Task')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">+ Task</button>
          <button onClick={() => openModal('Project Idea')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">+ Project Idea</button>
          <button onClick={() => openModal('Certification Idea')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">+ Certification Idea</button>
          <button onClick={() => openModal('Note')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">+ Note</button>
          <button onClick={() => openModal('Life Event')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">+ Life Event</button>
          <button onClick={() => openModal('Domain')} className="w-full text-left px-4 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-t border-slate-100 dark:border-slate-800">+ Domain</button>
        </div>
      )}

      {/* MODAL OVERLAY */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Add: {activeModal}</h3>
              <button onClick={closeModal} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  {errorMsg}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {activeModal === 'Domain' ? 'Domain Name' : 'Title'}
                </label>
                <input 
                  type="text" 
                  name="title"
                  autoFocus
                  required
                  placeholder={activeModal === 'Domain' ? 'e.g., Computer Science, Photography, AI...' : `E.g., new ${activeModal.toLowerCase()}`}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>
              
              {activeModal === 'Task' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                    <select name="priority" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white">
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                    <input name="due_date" type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white" />
                  </div>
                </div>
              )}

              {activeModal === 'Note' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
                  <textarea 
                    name="content"
                    rows={3}
                    placeholder="Type your thoughts..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

