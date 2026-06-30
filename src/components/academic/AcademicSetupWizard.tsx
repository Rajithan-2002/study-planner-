'use client'

import { useState } from 'react'
import { GraduationCap, Sparkles, CheckCircle2, Loader2, BookOpen, School, Calendar, Target } from 'lucide-react'
import { saveAcademicProfileWizard } from '@/app/actions/profile'
import { useRouter } from 'next/navigation'

interface AcademicSetupWizardProps {
  isOpen: boolean
  onClose: () => void
  initialProfile?: any
}

export function AcademicSetupWizard({ isOpen, onClose, initialProfile }: AcademicSetupWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    university: initialProfile?.university || 'University of Kelaniya',
    faculty: initialProfile?.faculty || 'Faculty of Computing & Technology',
    degree_name: initialProfile?.degree_name || 'Information Technology (MIT)',
    department: initialProfile?.department || 'Department of Industrial Management',
    current_year: initialProfile?.current_year || 2,
    current_semester: initialProfile?.current_semester || 2,
    graduation_year: initialProfile?.graduation_year || 2028,
    target_gpa: initialProfile?.target_gpa || 3.8
  })

  if (!isOpen) return null

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await saveAcademicProfileWizard({
        university: formData.university,
        faculty: formData.faculty,
        degree_name: formData.degree_name,
        department: formData.department,
        current_year: Number(formData.current_year),
        current_semester: Number(formData.current_semester),
        graduation_year: Number(formData.graduation_year),
        target_gpa: Number(formData.target_gpa)
      })

      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to save academic setup.')
      } else {
        onClose()
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'An error occurred during setup.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* HEADER BANNER */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold mb-3 backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Academic Setup Wizard
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Set Up Your Academic Profile</h2>
            <p className="text-sm font-medium text-indigo-100 mt-1">
              Configure your degree structure once. All GPA metrics, progress reports, and AI tools will adapt automatically.
            </p>
          </div>
          <GraduationCap className="absolute -bottom-6 -right-6 h-40 w-40 text-white/10" />
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-semibold border border-red-100 dark:border-red-900/30">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <School className="h-3.5 w-3.5 text-indigo-500" /> University
              </label>
              <input 
                type="text" 
                required
                value={formData.university}
                onChange={(e) => handleChange('university', e.target.value)}
                placeholder="E.g., University of Kelaniya"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Faculty
              </label>
              <input 
                type="text" 
                value={formData.faculty}
                onChange={(e) => handleChange('faculty', e.target.value)}
                placeholder="E.g., Faculty of Computing & Tech"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> Degree Program
              </label>
              <select 
                required
                value={formData.degree_name}
                onChange={(e) => handleChange('degree_name', e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white cursor-pointer"
              >
                <option value="BSc. Honours in Management and Information Technology (MIT)">
                  MIT (Management & IT)
                </option>
                <option value="BSc. Honours in Information Technology (IT)">
                  IT (Information Technology)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Department (Optional)
              </label>
              <input 
                type="text" 
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="E.g., Dept. of Software Engineering"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white font-semibold"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Current Year</label>
              <select 
                value={formData.current_year}
                onChange={(e) => handleChange('current_year', e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white font-semibold"
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
                <option value={4}>Year 4</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Current Sem</label>
              <select 
                value={formData.current_semester}
                onChange={(e) => handleChange('current_semester', e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white font-semibold"
              >
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Grad Year</label>
              <input 
                type="number"
                value={formData.graduation_year}
                onChange={(e) => handleChange('graduation_year', e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-amber-500" /> Target GPA
              </label>
              <input 
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                value={formData.target_gpa}
                onChange={(e) => handleChange('target_gpa', e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white font-semibold text-amber-600 dark:text-amber-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save & Complete Setup
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
