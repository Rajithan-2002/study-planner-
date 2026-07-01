'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Award, Sparkles, Calendar, Clock, Tag, Briefcase } from 'lucide-react'
import { createCertification, updateCertification, createCertFromTemplate } from '@/app/actions/certifications'
import { useRouter } from 'next/navigation'

interface CertModalProps {
  isOpen: boolean
  onClose: () => void
  domains: { id: string; name: string }[]
  editingCert?: any
}

export function CertModal({ isOpen, onClose, domains, editingCert }: CertModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isEditMode = !!editingCert

  const [formData, setFormData] = useState({
    name: editingCert?.name || '',
    domain_id: editingCert?.domain_id || '',
    provider: editingCert?.provider || '',
    cost: editingCert?.cost || 0,
    priority: editingCert?.priority || 'MEDIUM',
    status: editingCert?.status || 'ACTIVE',
    notes: editingCert?.notes || '',
    target_date: editingCert?.target_date ? editingCert.target_date.split('T')[0] : '',
    exam_date: editingCert?.exam_date ? editingCert.exam_date.split('T')[0] : '',
    estimated_total_hours: editingCert?.estimated_total_hours || 0,
    completed_hours: editingCert?.completed_hours || 0,
    difficulty: editingCert?.difficulty || 'MEDIUM'
  })

  useEffect(() => {
    if (editingCert) {
      setFormData({
        name: editingCert.name || '',
        domain_id: editingCert.domain_id || '',
        provider: editingCert.provider || '',
        cost: editingCert.cost || 0,
        priority: editingCert.priority || 'MEDIUM',
        status: editingCert.status || 'ACTIVE',
        notes: editingCert.notes || '',
        target_date: editingCert.target_date ? editingCert.target_date.split('T')[0] : '',
        exam_date: editingCert.exam_date ? editingCert.exam_date.split('T')[0] : '',
        estimated_total_hours: editingCert.estimated_total_hours || 0,
        completed_hours: editingCert.completed_hours || 0,
        difficulty: editingCert.difficulty || 'MEDIUM'
      })
    }
  }, [editingCert])

  if (!isOpen) return null

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    const fd = new FormData()
    if (isEditMode) fd.append('cert_id', editingCert.id)
    fd.append('name', formData.name)
    if (formData.domain_id) fd.append('domain_id', formData.domain_id)
    if (formData.provider) fd.append('provider', formData.provider)
    fd.append('cost', String(formData.cost))
    fd.append('priority', formData.priority)
    fd.append('status', formData.status)
    if (formData.notes) fd.append('notes', formData.notes)
    if (formData.target_date) fd.append('target_date', formData.target_date)
    if (formData.exam_date) fd.append('exam_date', formData.exam_date)
    fd.append('estimated_total_hours', String(formData.estimated_total_hours))
    fd.append('completed_hours', String(formData.completed_hours))
    fd.append('difficulty', formData.difficulty)

    try {
      let res: any
      if (isEditMode) {
        res = await updateCertification(fd)
      } else {
        res = await createCertification(fd)
      }

      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to save certification.')
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
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditMode ? 'Edit Certification' : 'Add Professional Certification'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CUSTOM / EDIT FORM */}
        <form onSubmit={handleCustomSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Certification Title</label>
            <input
              type="text"
              required
              placeholder="E.g., CompTIA Security+"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-emerald-500 outline-none dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Provider</label>
              <input
                type="text"
                placeholder="E.g., CompTIA, Cisco, AWS"
                value={formData.provider}
                onChange={e => setFormData({ ...formData, provider: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-emerald-500 outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Associated Domain</label>
              <select
                value={formData.domain_id}
                onChange={e => setFormData({ ...formData, domain_id: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-emerald-500 outline-none dark:text-white"
              >
                <option value="">No Domain / General</option>
                {domains.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-emerald-500 outline-none dark:text-white"
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
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-emerald-500 outline-none dark:text-white"
              >
                <option value="IDEA">Idea</option>
                <option value="ACTIVE">Preparing</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Exam Cost ($)</label>
              <input
                type="number"
                min="0"
                value={formData.cost}
                onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-emerald-500 outline-none dark:text-white"
              />
            </div>
          </div>

          {/* SCHEDULING MODEL */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/65 space-y-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-500" /> Study Scheduling Model
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Estimated Total (hrs)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.estimated_total_hours}
                  onChange={e => setFormData({ ...formData, estimated_total_hours: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Completed Hours</label>
                <input
                  type="number"
                  min="0"
                  value={formData.completed_hours}
                  onChange={e => setFormData({ ...formData, completed_hours: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold outline-none dark:text-white"
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Target Completion</label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={e => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Exam Date</label>
                <input
                  type="date"
                  value={formData.exam_date}
                  onChange={e => setFormData({ ...formData, exam_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold outline-none dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Notes / Highlights</label>
            <textarea
              rows={2}
              placeholder="Study portals, learning materials, URLs..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs focus:border-emerald-500 outline-none dark:text-white"
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
              className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEditMode ? 'Save Certification' : 'Create Certification'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
