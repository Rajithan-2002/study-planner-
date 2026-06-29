'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateUserProfile } from '@/app/actions/profile'
import { X, Loader2, User } from 'lucide-react'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  university: string | null
  degree_name: string | null
  graduation_year: number | null
  career_goal: string | null
  current_gpa: number | null
  target_gpa: number | null
  current_year: number | null
  current_semester: number | null
}

export function ProfileModal({
  isOpen,
  onClose,
  initialProfile,
  onUpdate
}: {
  isOpen: boolean
  onClose: () => void
  initialProfile: Profile | null
  onUpdate: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  // Local form states
  const [fullName, setFullName] = useState('')
  const [university, setUniversity] = useState('')
  const [degreeName, setDegreeName] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [careerGoal, setCareerGoal] = useState('')
  const [currentGpa, setCurrentGpa] = useState('')
  const [targetGpa, setTargetGpa] = useState('')
  const [currentYear, setCurrentYear] = useState('')
  const [currentSemester, setCurrentSemester] = useState('')

  // Sync form states with initial profile when modal opens
  useEffect(() => {
    if (initialProfile) {
      setFullName(initialProfile.full_name || '')
      setUniversity(initialProfile.university || '')
      setDegreeName(initialProfile.degree_name || '')
      setGraduationYear(initialProfile.graduation_year?.toString() || '')
      setCareerGoal(initialProfile.career_goal || '')
      setCurrentGpa(initialProfile.current_gpa?.toString() || '')
      setTargetGpa(initialProfile.target_gpa?.toString() || '')
      setCurrentYear(initialProfile.current_year?.toString() || '')
      setCurrentSemester(initialProfile.current_semester?.toString() || '')
    }
  }, [initialProfile, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await updateUserProfile(formData)
        onUpdate()
        onClose()
      } catch (err: any) {
        setError(err.message || 'Something went wrong.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Setup Profile Manually</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400 font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                required
                id="full_name"
                name="full_name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Akhil Shetty"
                className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              />
            </div>

            {/* University & Degree */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="university" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  University
                </label>
                <input
                  id="university"
                  name="university"
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. State University"
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="degree_name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Degree
                </label>
                <input
                  id="degree_name"
                  name="degree_name"
                  type="text"
                  value={degreeName}
                  onChange={(e) => setDegreeName(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>

            {/* Standing (Year & Semester) */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="current_year" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Year Standing
                </label>
                <input
                  id="current_year"
                  name="current_year"
                  type="number"
                  min={1}
                  max={6}
                  value={currentYear}
                  onChange={(e) => setCurrentYear(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="current_semester" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Semester Standing
                </label>
                <input
                  id="current_semester"
                  name="current_semester"
                  type="number"
                  min={1}
                  max={2}
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="graduation_year" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Graduation Year
                </label>
                <input
                  id="graduation_year"
                  name="graduation_year"
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="e.g. 2028"
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>

            {/* GPA Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="current_gpa" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Current GPA
                </label>
                <input
                  id="current_gpa"
                  name="current_gpa"
                  type="number"
                  step="0.01"
                  min="0.00"
                  max="10.00"
                  value={currentGpa}
                  onChange={(e) => setCurrentGpa(e.target.value)}
                  placeholder="e.g. 8.24"
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="target_gpa" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Target GPA
                </label>
                <input
                  id="target_gpa"
                  name="target_gpa"
                  type="number"
                  step="0.01"
                  min="0.00"
                  max="10.00"
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(e.target.value)}
                  placeholder="e.g. 9.50"
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>

            {/* Career Goal */}
            <div>
              <label htmlFor="career_goal" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Career Goal
              </label>
              <textarea
                id="career_goal"
                name="career_goal"
                rows={2}
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                placeholder="e.g. Senior Software Architect / AI Engineer at Stripe"
                className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
