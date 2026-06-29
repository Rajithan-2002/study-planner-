'use client'

import { useState, useTransition } from 'react'
import { Target, FileText, Calendar, Flame, CheckCircle, BrainCircuit, Plus, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addModuleResult } from '@/app/actions/academic'

type ModuleWorkspaceTabsProps = {
  module: any
  assignments: any[]
  exams: any[]
  results: any[]
  sessions: any[]
  resources: any[]
  currentGrade: string
  currentGradePercentage: number
  bestCaseGrade: string
  bestCasePercentage: number
  worstCaseGrade: string
  worstCasePercentage: number
}

export function ModuleWorkspaceTabs({
  module,
  assignments,
  exams,
  results,
  sessions,
  resources,
  currentGrade,
  currentGradePercentage,
  bestCaseGrade,
  bestCasePercentage,
  worstCaseGrade,
  worstCasePercentage
}: ModuleWorkspaceTabsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'overview' | 'assessments' | 'resources'>('overview')
  const [isOpen, setIsOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleResultSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    const formData = new FormData(e.currentTarget)
    formData.append('module_id', module.id)

    startTransition(async () => {
      const res = await addModuleResult(formData)
      if (res && res.success) {
        setIsOpen(false)
        router.refresh()
      } else {
        setErrorMsg(res?.error || 'Failed to add assessment result.')
      }
    })
  }

  return (
    <div className="space-y-6">
      
      {/* iOS-Style Segmented Control */}
      <div className="bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-md p-1 rounded-[16px] inline-flex w-full md:w-auto overflow-x-auto shadow-inner border border-gray-200/50 dark:border-gray-800/50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-300 ${
            activeTab === 'overview' 
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('assessments')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-300 ${
            activeTab === 'assessments' 
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Assessments
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-300 ${
            activeTab === 'resources' 
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Resources
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="col-span-1 lg:col-span-2 space-y-6">
              {/* GPA PREDICTION ENGINE */}
              <div className="rounded-[24px] border border-gray-100 dark:border-gray-800/60 bg-white dark:bg-gray-900/50 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 rounded-[14px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                    <Target className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">GPA Engine</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-[16px] bg-gray-50 dark:bg-gray-800/50 p-5 border border-gray-100 dark:border-gray-800">
                    <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Current Grade</p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{currentGrade}</span>
                      <span className="text-sm font-bold text-gray-400">({currentGradePercentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="rounded-[16px] bg-emerald-50/50 dark:bg-emerald-900/10 p-5 border border-emerald-100 dark:border-emerald-900/30 shadow-sm shadow-emerald-100/50 dark:shadow-none">
                    <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Best Case</p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter">{bestCaseGrade}</span>
                      <span className="text-sm font-bold text-emerald-500/70">({bestCasePercentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="rounded-[16px] bg-red-50/50 dark:bg-red-900/10 p-5 border border-red-100 dark:border-red-900/30 shadow-sm shadow-red-100/50 dark:shadow-none">
                    <p className="text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">Worst Case</p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-red-600 dark:text-red-500 tracking-tighter">{worstCaseGrade}</span>
                      <span className="text-sm font-bold text-red-500/70">({worstCasePercentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TIMETABLE SESSIONS */}
              <div className="rounded-[24px] border border-gray-100 dark:border-gray-800/60 bg-white dark:bg-gray-900/50 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Schedule</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sessions.length === 0 ? (
                    <p className="text-sm font-medium text-gray-500 py-4 col-span-2">No classes scheduled.</p>
                  ) : (
                    sessions.map(sess => (
                      <div key={sess.id} className="flex flex-col p-4 rounded-[16px] border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">{sess.day}</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {sess.start_time.substring(0, 5)} - {sess.end_time.substring(0, 5)}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{sess.session_type}</p>
                        <p className="text-xs font-semibold text-gray-500 mt-1">{sess.location}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="col-span-1 space-y-6">
              
              {/* STUDY PLANNER (EXAMS) */}
              <div className="rounded-[24px] border border-orange-100 dark:border-orange-900/30 bg-gradient-to-b from-orange-50/50 to-white dark:from-orange-900/10 dark:to-gray-900/50 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-[14px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    <Flame className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Study Targets</h3>
                </div>
                
                <div className="space-y-4">
                  {exams.length === 0 ? (
                    <p className="text-sm font-medium text-gray-500">No upcoming exams mapped.</p>
                  ) : (
                    exams.map(exam => {
                      const progress = Math.min((exam.weight || 0) * 1.5, 100); 
                      const hours = Math.max(1, Math.round((100 - progress) / 20));

                      return (
                        <div key={exam.id} className="rounded-[16px] bg-white dark:bg-gray-800/60 p-5 border border-orange-100 dark:border-orange-900/20 shadow-sm">
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{exam.name}</p>
                          <p className="text-xs font-bold text-orange-600/80 dark:text-orange-400 mb-5">{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'TBD'}</p>
                          
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-500 dark:text-gray-400">Prep Progress</span>
                            <span className="font-bold text-orange-600">{progress}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-orange-100 dark:bg-gray-700">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          
                          <div className="mt-5 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50 pt-4">
                            <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">Daily Target</p>
                            <p className="text-sm font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">{hours} Hrs</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ASSESSMENTS TAB */}
        {activeTab === 'assessments' && (
          <div className="rounded-[24px] border border-gray-100 dark:border-gray-800/60 bg-white dark:bg-gray-900/50 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[14px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Assessments & Results</h3>
              </div>
              <button 
                onClick={() => {
                  setIsOpen(true)
                  setErrorMsg(null)
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2.5 rounded-[12px] transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Component
              </button>
            </div>
            
            <div className="space-y-4">
              {results.length === 0 ? (
                <div className="text-center py-12 rounded-[24px] border border-dashed border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-500">No assessments added yet.</p>
                </div>
              ) : (
                results.map(res => (
                  <div key={res.id} className="flex items-center justify-between p-5 rounded-[16px] border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{res.component}</p>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Weight: {res.weight}%</p>
                    </div>
                    <div className="text-right">
                      {res.marks !== null ? (
                        <>
                          <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{res.marks}%</p>
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md mt-1 inline-block">{res.grade}</p>
                        </>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-yellow-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-500">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* NEW ASSESSMENT MODAL */}
            {isOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Assessment Component</h3>
                    <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleResultSubmit} className="p-6 space-y-4">
                    {errorMsg && (
                      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-semibold">
                        {errorMsg}
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Component Name
                      </label>
                      <input 
                        type="text" 
                        name="component" 
                        required
                        placeholder="e.g. Midterm Exam, Assignment 1"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Weight (%)</label>
                        <input 
                          type="number" 
                          name="weight" 
                          required
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="e.g. 20"
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Marks (% - Optional)</label>
                        <input 
                          type="number" 
                          name="marks" 
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="e.g. 85 (leave blank if pending)"
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Grade (Optional)</label>
                      <input 
                        type="text" 
                        name="grade" 
                        placeholder="e.g. A, B+"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        type="button" 
                        onClick={() => setIsOpen(false)}
                        disabled={isPending}
                        className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {isPending && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 lg:col-span-2 rounded-[24px] border border-gray-100 dark:border-gray-800/60 bg-white dark:bg-gray-900/50 p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Academic Resources</h3>
                </div>
                <Link href="/knowledge" className="text-sm font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-[12px] transition-colors">
                  Open Knowledge Hub
                </Link>
              </div>
              
              {resources.length === 0 ? (
                <div className="text-center py-16 rounded-[24px] border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                  <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">No resources uploaded for this module.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {resources.map(file => (
                    <a key={file.id} href={file.file_url} target="_blank" rel="noopener noreferrer" className="rounded-[16px] border border-gray-100 dark:border-gray-800 p-5 text-center hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all bg-white dark:bg-gray-800/40 group block">
                      <FileText className="h-8 w-8 text-indigo-200 dark:text-indigo-900/50 mx-auto mb-3 group-hover:text-indigo-500 transition-colors" />
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={file.file_name}>{file.file_name}</p>
                      <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-wider">{file.file_type || 'Document'}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* AI ASSISTANT WIDGET */}
            <div className="col-span-1 rounded-[24px] border border-purple-100 dark:border-purple-900/30 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900/50 p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-[14px] bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Module AI</h3>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-6">
                Ask the AI to summarize lectures, generate flashcards, or explain complex concepts from this module's resources.
              </p>
              <Link href="/assistant" className="mt-auto flex items-center justify-center gap-2 w-full rounded-[14px] bg-gray-900 dark:bg-white px-4 py-3.5 text-sm font-bold text-white dark:text-gray-900 shadow-sm hover:scale-[1.02] transition-transform">
                Chat with AI
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
