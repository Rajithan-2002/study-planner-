'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, BookOpen, Plus, Sparkles, AlertCircle } from 'lucide-react'
import { createModule, updateModule, addModuleToPlan, importSemesterModulesAction } from '@/app/actions/academic'
import { useRouter } from 'next/navigation'

interface CurriculumModule {
  id: string
  course_code: string
  course_name: string
  credits: number
  year: number
  semester: number
  is_compulsory?: boolean
}

interface ModuleModalProps {
  isOpen: boolean
  onClose: () => void
  semesterId?: string
  defaultYear?: number
  defaultSemester?: number
  editingModule?: any
  curriculumCatalog?: CurriculumModule[]
}

export function ModuleModal({
  isOpen,
  onClose,
  semesterId,
  defaultYear = 1,
  defaultSemester = 1,
  editingModule,
  curriculumCatalog = []
}: ModuleModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>(editingModule ? 'custom' : 'catalog')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('')

  const [filterYear, setFilterYear] = useState<number>(defaultYear || 0)
  const [filterSemester, setFilterSemester] = useState<number>(defaultSemester || 0)

  const isEditMode = !!editingModule

  const [formData, setFormData] = useState({
    code: editingModule?.code || '',
    name: editingModule?.name || '',
    credits: editingModule?.credits || 3,
    grade: editingModule?.grade || '',
    status: editingModule?.status || 'NOT_STARTED',
    priority: editingModule?.priority || 'LOW',
    year: editingModule?.year || defaultYear,
    semester: editingModule?.semester || defaultSemester,
    notes: editingModule?.notes || ''
  })

  const filteredCatalog = curriculumCatalog.filter(item => {
    if (filterYear > 0 && item.year !== filterYear) return false
    if (filterSemester > 0 && item.semester !== filterSemester) return false
    return true
  })

  const selectedCatalogItem = curriculumCatalog.find(c => c.id === selectedCatalogId)

  useEffect(() => {
    if (editingModule) {
      setFormData({
        code: editingModule.code || '',
        name: editingModule.name || '',
        credits: editingModule.credits || 3,
        grade: editingModule.grade || '',
        status: editingModule.status || 'NOT_STARTED',
        priority: editingModule.priority || 'LOW',
        year: editingModule.year || defaultYear,
        semester: editingModule.semester || defaultSemester,
        notes: editingModule.notes || ''
      })
      setActiveTab('custom')
    } else {
      setFormData(prev => ({
        ...prev,
        year: defaultYear,
        semester: defaultSemester
      }))
    }
  }, [editingModule, defaultYear, defaultSemester])

  if (!isOpen) return null

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    const fd = new FormData()
    if (semesterId) fd.append('semester_id', semesterId)
    fd.append('code', formData.code)
    fd.append('name', formData.name)
    fd.append('credits', String(formData.credits))
    if (formData.grade) fd.append('grade', formData.grade)
    fd.append('status', formData.status)
    fd.append('priority', formData.priority)
    if (formData.notes) fd.append('notes', formData.notes)
    fd.append('year', String(formData.year))
    fd.append('semester', String(formData.semester))

    try {
      let res: any
      if (isEditMode) {
        fd.append('module_id', editingModule.id)
        res = await updateModule(fd)
      } else {
        res = await createModule(fd)
      }

      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to save module.')
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

  const handleCatalogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCatalogId) {
      setErrorMsg('Please select a course from the curriculum template.')
      return
    }

    const item = curriculumCatalog.find(c => c.id === selectedCatalogId)
    if (!item) return

    setIsSubmitting(true)
    setErrorMsg(null)

    const fd = new FormData()
    if (semesterId) fd.append('semester_id', semesterId)
    fd.append('curriculum_module_id', item.id)
    fd.append('code', item.course_code)
    fd.append('name', item.course_name)
    fd.append('credits', String(item.credits))
    fd.append('year', String(item.year))
    fd.append('semester', String(item.semester))
    fd.append('is_compulsory', item.is_compulsory ? 'true' : 'false')

    try {
      const res = await addModuleToPlan(fd)
      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to add module from curriculum.')
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

  const handleImportAllSemesterModules = async () => {
    if (filterYear === 0 || filterSemester === 0) {
      setErrorMsg('Please select a specific Year and Semester filter to import all matching modules.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await importSemesterModulesAction(semesterId, filterYear, filterSemester)
      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to import semester modules.')
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
    <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditMode ? 'Edit Module' : 'Add Academic Module'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODE TABS (Only if not editing) */}
        {!isEditMode && (
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-1.5 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> From Curriculum Catalog
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> Custom / Elective Module
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="m-6 mb-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
          </div>
        )}

        {/* CATALOG FORM */}
        {!isEditMode && activeTab === 'catalog' && (
          <form onSubmit={handleCatalogSubmit} className="p-6 space-y-4">
            
            {/* YEAR & SEMESTER FILTERS */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Year</label>
                <select
                  value={filterYear}
                  onChange={e => {
                    setFilterYear(Number(e.target.value))
                    setSelectedCatalogId('')
                  }}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold text-slate-900 dark:text-white focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value={0}>All Years</option>
                  <option value={1}>Year 1</option>
                  <option value={2}>Year 2</option>
                  <option value={3}>Year 3</option>
                  <option value={4}>Year 4</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Semester</label>
                <select
                  value={filterSemester}
                  onChange={e => {
                    setFilterSemester(Number(e.target.value))
                    setSelectedCatalogId('')
                  }}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold text-slate-900 dark:text-white focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value={0}>All Semesters</option>
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                </select>
              </div>
            </div>

            {/* SUBJECT SELECTION DROPDOWN MENU */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Subject (Code • Name • Credits)
              </label>
              
              {filteredCatalog.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  No unadded modules match the selected Year and Semester filter. Try changing filters or use Custom Module.
                </p>
              ) : (
                <select
                  value={selectedCatalogId}
                  onChange={e => setSelectedCatalogId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs font-bold text-slate-900 dark:text-white focus:border-indigo-500 outline-none shadow-xs cursor-pointer"
                >
                  <option value="">-- Choose a Course ({filteredCatalog.length} available) --</option>
                  {filteredCatalog.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.course_code}] {item.course_name} — ({item.credits} Credits) [Y{item.year}S{item.semester}]
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* SELECTED SUBJECT SUMMARY CARD */}
            {selectedCatalogItem && (
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between animate-in fade-in zoom-in-95 duration-150">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">
                      {selectedCatalogItem.course_code}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {selectedCatalogItem.course_name}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                    {selectedCatalogItem.credits} Academic Credits • Year {selectedCatalogItem.year}, Semester {selectedCatalogItem.semester}
                  </p>
                </div>
                {selectedCatalogItem.is_compulsory && (
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-1 rounded-lg">
                    Compulsory
                  </span>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-105 dark:border-slate-800">
              <button
                type="button"
                onClick={handleImportAllSemesterModules}
                disabled={isSubmitting || filterYear === 0 || filterSemester === 0 || filteredCatalog.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-750 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-xl border border-indigo-200 dark:border-indigo-900/40 disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
                title="Batch import all curriculum modules matching this Year and Semester"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Import All ({filteredCatalog.length})
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedCatalogId}
                  className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Add from Catalog
                </button>
              </div>
            </div>
          </form>
        )}

        {/* CUSTOM / EDIT FORM */}
        {(isEditMode || activeTab === 'custom') && (
          <form onSubmit={handleCustomSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Code</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., INTE12213"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-indigo-500 outline-none dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Module Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Programming Concepts"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-indigo-500 outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Credits</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="15"
                  value={formData.credits}
                  onChange={e => setFormData({ ...formData, credits: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-indigo-500 outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-indigo-500 outline-none dark:text-white"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="EXAM_PENDING">Exam Pending</option>
                  <option value="RESULT_PENDING">Result Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REPEAT">Repeat</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Grade (Optional)</label>
                <select
                  value={formData.grade}
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold focus:border-indigo-500 outline-none dark:text-white text-emerald-600 dark:text-emerald-400"
                >
                  <option value="">None / Pending</option>
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="B-">B-</option>
                  <option value="C+">C+</option>
                  <option value="C">C</option>
                  <option value="C-">C-</option>
                  <option value="D+">D+</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="Elective / Exchange / Course notes..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs focus:border-indigo-500 outline-none dark:text-white"
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
                className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Create Module'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
