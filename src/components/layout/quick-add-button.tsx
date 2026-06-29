'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus, Briefcase, Award, FileText, CheckCircle2, Trophy, Upload, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getDomains } from '@/app/actions/domains'
import { createInboxItem, createNoteDirect } from '@/app/actions/quick-capture'
import { createTaskDirect } from '@/app/actions/tasks'
import { createLifeEventDirect } from '@/app/actions/life-events'
import { createDomain } from '@/app/actions/domains'
import { UploadDialog } from '@/components/knowledge/upload-dialog'

export function QuickAddButton() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([])

  // Load domains on mount to pass to notes/uploads
  useEffect(() => {
    getDomains().then((data) => {
      setDomains(data || [])
    }).catch(err => console.error('Failed to load domains in FAB:', err))
  }, [activeModal])

  const options = [
    { name: 'Task', icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { name: 'Project Idea', icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { name: 'Certification Idea', icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { name: 'Note', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { name: 'Life Event', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { name: 'Upload', icon: Upload, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-500/10' },
  ]

  const openModal = (name: string) => {
    setActiveModal(name)
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
      if (activeModal === 'Task') {
        const priority = formData.get('priority') as string
        const dueDate = formData.get('due_date') as string
        await createTaskDirect({
          title,
          priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          due_date: dueDate || undefined,
        })
      } else if (activeModal === 'Note') {
        const content = formData.get('content') as string
        const domainId = formData.get('domain_id') as string || undefined
        await createNoteDirect(title, content, domainId)
      } else if (activeModal === 'Life Event') {
        const eventDate = formData.get('event_date') as string
        const type = formData.get('type') as any
        const importance = Number(formData.get('importance') || 50)
        await createLifeEventDirect({
          title,
          type: type || 'ASSIGNMENT',
          event_date: eventDate || new Date().toISOString().split('T')[0],
          importance: importance
        })
      } else if (activeModal === 'Domain') {
        await createDomain(title)
      } else {
        // Project Idea, Certification Idea -> send to INBOX
        const typePrefix = activeModal ? `[${activeModal}] ` : ''
        await createInboxItem(`${typePrefix}${title}`)
      }
      
      closeModal()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to capture item.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8">
      {/* Options Menu */}
      <div 
        className={`absolute bottom-full right-0 mb-4 flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${
          isOpen ? 'scale-100 opacity-100 visible' : 'scale-90 opacity-0 invisible pointer-events-none'
        }`}
      >
        {options.map((option, idx) => {
          const Icon = option.icon
          return (
            <button
              key={idx}
              className="group flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 p-2 pr-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 dark:border-slate-700 hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => openModal(option.name)}
            >
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                New {option.name}
              </span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${option.bg}`}>
                <Icon className={`h-5 w-5 ${option.color}`} />
              </div>
            </button>
          )
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.5)] transition-all duration-300 hover:scale-105 cursor-pointer"
      >
        <Plus className={`h-8 w-8 text-white transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
      </button>

      {/* RENDER KNOWLEDGE UPLOAD DIALOG DIRECTLY */}
      <UploadDialog 
        isOpen={activeModal === 'Upload'}
        onClose={closeModal}
        domains={domains}
      />

      {/* CORE CAPTURE MODALS */}
      {activeModal && activeModal !== 'Upload' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Add: {activeModal}</h3>
              <button onClick={closeModal} className="text-slate-500 hover:bg-slate-105 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  autoFocus
                  required
                  placeholder={`E.g., new ${activeModal.toLowerCase()}`}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>
              
              {activeModal === 'Task' && (
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
              )}

              {activeModal === 'Note' && (
                <div className="space-y-4">
                  {domains.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Domain (Optional)</label>
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
                      rows={4}
                      placeholder="Type your thoughts..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                  </div>
                </div>
              )}

              {activeModal === 'Life Event' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                      <select name="type" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white">
                        <option value="ASSIGNMENT">ASSIGNMENT</option>
                        <option value="EXAM">EXAM</option>
                        <option value="CERT_EXAM">CERT EXAM</option>
                        <option value="PROJECT_MILESTONE">PROJECT MILESTONE</option>
                        <option value="COMPETITION">COMPETITION</option>
                        <option value="INTERNSHIP_DEADLINE">INTERNSHIP DEADLINE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Date</label>
                      <input name="event_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Importance (1-100)</label>
                    <input name="importance" type="number" min="1" max="100" defaultValue="50" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md disabled:opacity-50 transition-colors cursor-pointer"
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
