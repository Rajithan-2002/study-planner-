'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, BookOpen, GraduationCap, Plus, Edit3, Archive, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ModuleModal } from './ModuleModal'
import { archiveModule } from '@/app/actions/academic'
import { calculateSemesterMetrics } from '@/lib/academic/engine'

type Module = {
  id: string
  code: string
  name: string
  credits: number
  status: string
  grade?: string | null
  priority?: string | null
  notes?: string | null
  year?: number | null
  semester?: number | null
  is_archived?: boolean | null
}

type Semester = {
  id: string
  year: number
  semester: number
  modules: Module[]
}

interface SemesterListProps {
  semesters: Semester[]
  curriculumCatalog?: any[]
}

export function SemesterList({ semesters, curriculumCatalog = [] }: SemesterListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(semesters[0]?.id || null)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    semesterId?: string
    year?: number
    semester?: number
    editingModule?: Module
  }>({ isOpen: false })

  const [isPending, startTransition] = useTransition()

  const handleArchive = (e: React.MouseEvent, moduleId: string) => {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      try {
        await archiveModule(moduleId)
      } catch (err) {
        console.error(err)
      }
    })
  }

  const openAddModal = (e: React.MouseEvent, sem: Semester) => {
    e.stopPropagation()
    setModalState({
      isOpen: true,
      semesterId: sem.id,
      year: sem.year,
      semester: sem.semester
    })
  }

  const openEditModal = (e: React.MouseEvent, mod: Module) => {
    e.preventDefault()
    e.stopPropagation()
    setModalState({
      isOpen: true,
      editingModule: mod
    })
  }

  return (
    <div className="space-y-4">
      {semesters.map((sem) => {
        const isExpanded = expandedId === sem.id
        const activeModules = sem.modules.filter(m => !m.is_archived)
        const metrics = calculateSemesterMetrics(activeModules)
        
        return (
          <div 
            key={sem.id} 
            className="rounded-[24px] border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-xs overflow-hidden transition-all duration-300"
          >
            {/* Header (Tap to expand) */}
            <div className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer select-none">
              <div 
                onClick={() => setExpandedId(isExpanded ? null : sem.id)}
                className="flex items-center gap-4 flex-1 min-w-0 pr-4"
              >
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Year {sem.year} • Semester {sem.semester}
                    </h3>
                    {metrics.semesterGpa > 0 && (
                      <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                        GPA: {metrics.semesterGpa.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeModules.length} Modules • {metrics.totalSemesterCredits} Credits
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={(e) => openAddModal(e, sem)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Module
                </button>

                <button 
                  onClick={() => setExpandedId(isExpanded ? null : sem.id)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80">
                {activeModules.length === 0 ? (
                  <div className="text-center py-8 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/40 rounded-2xl mt-4 border border-dashed border-slate-200 dark:border-slate-800">
                    No modules added for this semester. Click "+ Module" above to add one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {activeModules.map(module => (
                      <div key={module.id} className="group/card relative flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-4 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-xs">
                        <Link href={`/academic/module/${module.id}`} className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                          <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center group-hover/card:bg-indigo-50 dark:group-hover/card:bg-indigo-950/50 text-slate-400 group-hover/card:text-indigo-600 transition-colors shrink-0 border border-slate-200 dark:border-slate-700/60">
                            <BookOpen className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-400 transition-colors truncate">
                              {module.name}
                            </h4>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                              {module.code} • {module.credits} Credits
                            </p>
                          </div>
                        </Link>

                        <div className="flex items-center gap-2 shrink-0">
                          {module.grade && (
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/30">
                              {module.grade}
                            </span>
                          )}
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            module.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                            module.status === 'ONGOING' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400' :
                            'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {module.status.replace('_', ' ')}
                          </span>

                          {/* Action icons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity ml-1">
                            <button
                              onClick={(e) => openEditModal(e, module)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors cursor-pointer"
                              title="Edit Module"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleArchive(e, module.id)}
                              disabled={isPending}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors cursor-pointer"
                              title="Archive Module"
                            >
                              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      <ModuleModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false })}
        semesterId={modalState.semesterId}
        defaultYear={modalState.year}
        defaultSemester={modalState.semester}
        editingModule={modalState.editingModule}
        curriculumCatalog={curriculumCatalog}
      />
    </div>
  )
}

