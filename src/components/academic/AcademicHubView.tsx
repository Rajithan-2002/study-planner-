'use client'

import { useState } from 'react'
import { GraduationCap, Clock, Calculator, Sparkles, Settings2, ShieldCheck, Award } from 'lucide-react'
import Link from 'next/link'
import { SemesterList } from './SemesterList'
import { AcademicSetupWizard } from './AcademicSetupWizard'
import { calculateOverallMetrics } from '@/lib/academic/engine'

interface AcademicHubViewProps {
  user: any
  currentSemester: any
  allModules: any[]
  semesters: any[]
  timetable: any[]
  curriculumCatalog: any[]
}

export function AcademicHubView({
  user,
  currentSemester,
  allModules,
  semesters,
  timetable,
  curriculumCatalog
}: AcademicHubViewProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(!user?.academic_profile_completed)

  const metrics = calculateOverallMetrics(allModules, curriculumCatalog)

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todaysClasses = timetable.filter(t => t.day === todayStr).sort((a, b) => a.start_time.localeCompare(b.start_time))

  const mappedSemesters = (semesters || []).map(sem => {
    return {
      id: sem.id,
      year: sem.year,
      semester: sem.semester,
      modules: allModules.filter(m => m.semester_id === sem.id || (m.year === sem.year && m.semester === sem.semester))
    }
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
              Academic Hub
            </h2>
            {user?.academic_profile_completed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
                <ShieldCheck className="h-3 w-3" /> Verified Profile
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Track your degree progress, modules, and calculated CGPA.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs transition-all text-xs cursor-pointer"
          >
            <Settings2 className="h-4 w-4 text-indigo-500" />
            Setup Wizard
          </button>
          <Link 
            href="/academic/gpa-calculator" 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-xs hover:opacity-95 transition-all text-xs"
          >
            <Calculator className="h-4 w-4" />
            CGPA Calculator
          </Link>
          <Link 
            href="/academic/roadmap" 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors text-xs"
          >
            <GraduationCap className="h-4 w-4" />
            Curriculum Roadmap
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: Profile & Timetable */}
        <div className="col-span-1 space-y-6 md:space-y-8">
          
          {/* Academic Profile Card */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">Academic Profile</h3>
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mt-0.5 truncate">{user?.degree_name || 'Degree Not Set'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">University</span>
                <span className="text-slate-900 dark:text-white font-bold">{user?.university || 'Not Set'}</span>
              </div>
              {user?.faculty && (
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Faculty</span>
                  <span className="text-slate-900 dark:text-white font-bold truncate max-w-[160px]">{user.faculty}</span>
                </div>
              )}
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Current Standing</span>
                <span className="text-slate-900 dark:text-white font-bold">
                  {user?.current_year ? `Year ${user.current_year} Sem ${user.current_semester || 1}` : currentSemester ? `Year ${currentSemester.year} Sem ${currentSemester.semester}` : 'Not Set'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Credits Complete</span>
                <span className="text-slate-900 dark:text-white font-bold">{metrics.creditsCompleted} / {metrics.totalDegreeCredits}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Honors Standing</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">{metrics.standing}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 dark:text-slate-400">Cumulative GPA</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                  {(metrics.gradedModulesCount > 0 ? metrics.overallGpa : (Number(user?.current_gpa) || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Today's Timetable */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Today's Classes</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{todayStr}</p>
              </div>
            </div>

            <div className="space-y-3">
              {todaysClasses.length === 0 ? (
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 text-center py-4">No classes today.</p>
              ) : (
                todaysClasses.map(session => (
                  <div key={session.id} className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-4 hover:border-indigo-500 transition-colors">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{session.module?.name}</h4>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{session.session_type} • {session.location}</span>
                      <span className="text-[9px] font-black tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                        {session.start_time.substring(0, 5)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Semester Tap-to-Expand Cards */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Degree Curriculum & Modules</h3>
          </div>
          
          {mappedSemesters.length === 0 ? (
            <div className="text-center py-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No semesters found. Please set up your academic roadmap.</p>
            </div>
          ) : (
            <SemesterList semesters={mappedSemesters} curriculumCatalog={curriculumCatalog} />
          )}

        </div>

      </div>

      <AcademicSetupWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialProfile={user}
      />
    </div>
  )
}
