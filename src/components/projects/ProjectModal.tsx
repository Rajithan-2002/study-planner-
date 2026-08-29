'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Briefcase, Sparkles, Calendar, Clock, Tag, Target } from 'lucide-react'
import { createProject, updateProject, createProjectFromTemplate } from '@/app/actions/projects'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  domains: { id: string; name: string }[]
  editingProject?: any
}

export function ProjectModal({ isOpen, onClose, domains, editingProject }: ProjectModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [domainsList, setDomainsList] = useState(domains)

  useEffect(() => {
    setDomainsList(domains)
  }, [domains])

  const handleCreateDomainInline = async () => {
    const name = prompt('Enter new domain name:')
    if (!name || !name.trim()) return
    try {
      const { createDomain } = await import('@/app/actions/domains')
      const res = await createDomain(name.trim())
      if (res && res.success) {
        const { getDomains } = await import('@/app/actions/domains')
        const updated = await getDomains()
        setDomainsList(updated || [])
        if (res.data?.id) {
          setFormData(prev => ({ ...prev, domain_id: res.data.id }))
        }
      } else {
        toast(res?.error || 'Failed to create domain.', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Error creating domain inline.', 'error')
    }
  }

  const [activeTab, setActiveTab] = useState<'template' | 'custom'>(editingProject ? 'custom' : 'template')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('SOFTWARE_DEV')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isEditMode = !!editingProject

  const [formData, setFormData] = useState({
    name: editingProject?.name || '',
    domain_id: editingProject?.domain_id || '',
    category: editingProject?.category || 'Engineering',
    priority: editingProject?.priority || 'MEDIUM',
    status: editingProject?.status || 'ACTIVE',
    description: editingProject?.description || '',
    notes: editingProject?.notes || '',
    target_completion_date: editingProject?.target_completion_date ? editingProject.target_completion_date.split('T')[0] : '',
    estimated_hours: editingProject?.estimated_hours || 20,
    weekly_target_hours: editingProject?.weekly_target_hours || 5,
    daily_focus_minutes: editingProject?.daily_focus_minutes || 45,
    tags: editingProject?.tags ? editingProject.tags.join(', ') : ''
  })

  useEffect(() => {
    if (editingProject) {
      setFormData({
        name: editingProject.name || '',
        domain_id: editingProject.domain_id || '',
        category: editingProject.category || 'Engineering',
        priority: editingProject.priority || 'MEDIUM',
        status: editingProject.status || 'ACTIVE',
        description: editingProject.description || '',
        notes: editingProject.notes || '',
        target_completion_date: editingProject.target_completion_date ? editingProject.target_completion_date.split('T')[0] : '',
        estimated_hours: editingProject.estimated_hours || 20,
        weekly_target_hours: editingProject.weekly_target_hours || 5,
        daily_focus_minutes: editingProject.daily_focus_minutes || 45,
        tags: editingProject.tags ? editingProject.tags.join(', ') : ''
      })
      setActiveTab('custom')
    }
  }, [editingProject])

  if (!isOpen) return null

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await createProjectFromTemplate(selectedTemplate, formData.name || undefined)
      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to create project from template.')
      } else {
        onClose()
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Server error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    const fd = new FormData()
    if (isEditMode) fd.append('project_id', editingProject.id)
    fd.append('name', formData.name)
    if (formData.domain_id) fd.append('domain_id', formData.domain_id)
    if (formData.category) fd.append('category', formData.category)
    fd.append('priority', formData.priority)
    fd.append('status', formData.status)
    if (formData.description) fd.append('description', formData.description)
    if (formData.notes) fd.append('notes', formData.notes)
    if (formData.target_completion_date) fd.append('target_completion_date', formData.target_completion_date)
    fd.append('estimated_hours', String(formData.estimated_hours))
    fd.append('weekly_target_hours', String(formData.weekly_target_hours))
    fd.append('daily_focus_minutes', String(formData.daily_focus_minutes))
    if (formData.tags) fd.append('tags', formData.tags)

    try {
      let res: any
      if (isEditMode) {
        res = await updateProject(fd)
      } else {
        res = await createProject(fd)
      }

      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to save project.')
      } else {
        onClose()
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Server error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditMode ? 'Edit Project Settings' : 'Create New Project'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODE TABS (Only when creating) */}
        {!isEditMode && (
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-1.5 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('template')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'template'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Project Starter Template
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" /> Custom Setup
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="m-6 mb-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* TEMPLATE FORM */}
        {!isEditMode && activeTab === 'template' && (
          <form onSubmit={handleTemplateSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Project Starter Template
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'SOFTWARE_DEV', name: 'Software Development', desc: 'Pre-configured with Architecture, API, UI, and QA milestones.' },
                  { id: 'RESEARCH', name: 'Academic Research', desc: 'Lit review, methodology, data collection, and thesis draft.' },
                  { id: 'STARTUP', name: 'Startup MVP', desc: 'Market validation, MVP specs, prototype, and launch campaign.' },
                  { id: 'PERSONAL', name: 'Personal Initiative', desc: 'Clean 3-phase execution framework for personal goals.' },
                ].map(tmpl => (
                  <label
                    key={tmpl.id}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedTemplate === tmpl.id
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 dark:border-blue-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{tmpl.name}</span>
                        <input
                          type="radio"
                          name="template"
                          value={tmpl.id}
                          checked={selectedTemplate === tmpl.id}
                          onChange={() => setSelectedTemplate(tmpl.id)}
                          className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-snug">{tmpl.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Project Title (Optional)
              </label>
              <input
                type="text"
                placeholder="E.g., HackX AI Assistant"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-blue-500 outline-none dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Instantiate Template
              </button>
            </div>
          </form>
        )}

        {/* CUSTOM / EDIT FORM */}
        {(isEditMode || activeTab === 'custom') && (
          <form onSubmit={handleCustomSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Project Name</label>
              <input
                type="text"
                required
                placeholder="E.g., Autonomous Drone Guidance System"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-blue-500 outline-none dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Domain / Category</label>
                <div className="flex gap-2">
                  <select
                    value={formData.domain_id}
                    onChange={e => setFormData({ ...formData, domain_id: e.target.value })}
                    className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-blue-500 outline-none dark:text-white"
                  >
                    <option value="">No Domain / General</option>
                    {domainsList.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleCreateDomainInline}
                    className="px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-black cursor-pointer shrink-0 transition-colors"
                  >
                    + New
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Category Label</label>
                <input
                  type="text"
                  placeholder="E.g., Software, Hardware, AI"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-blue-500 outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-blue-500 outline-none dark:text-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-blue-500 outline-none dark:text-white"
                >
                  <option value="IDEA">Idea / Backlog</option>
                  <option value="RESEARCHING">Researching</option>
                  <option value="ACTIVE">Active Development</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {/* STRUCTURED PLANNING MODEL */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" /> Workload & Scheduling Model
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Focus (mins)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={formData.daily_focus_minutes}
                    onChange={e => setFormData({ ...formData, daily_focus_minutes: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Weekly Target (hrs)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.weekly_target_hours}
                    onChange={e => setFormData({ ...formData, weekly_target_hours: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Est. Total Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.estimated_hours}
                    onChange={e => setFormData({ ...formData, estimated_hours: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold outline-none dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={formData.target_completion_date}
                  onChange={e => setFormData({ ...formData, target_completion_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Brief project summary and objectives..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs focus:border-blue-500 outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Tag className="h-3 w-3 text-slate-400" /> Tags (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. react, python, hardware, ai"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-semibold focus:border-blue-500 outline-none dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEditMode ? 'Save Project Settings' : 'Create Project'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
