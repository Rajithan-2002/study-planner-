import { GraduationCap, CheckCircle, Plus, Map } from 'lucide-react'
import { getAcademicRoadmap, addModuleToPlan } from '@/app/actions/academic'
import Link from 'next/link'

export default async function AcademicRoadmapPage() {
  const { curriculum, studentModules, user } = await getAcademicRoadmap()

  async function addModuleAction(formData: FormData) {
    'use server'
    await addModuleToPlan(formData)
  }

  // Helper to check if a curriculum module has been completed or added
  const isModuleSelected = (curriculumId: string, courseCode: string) => {
    return studentModules.some(m => m.curriculum_module_id === curriculumId || m.code?.trim().toLowerCase() === courseCode?.trim().toLowerCase())
  }

  // Calculate totals dynamically from curriculum catalog
  const catalogTotalCredits = curriculum.reduce((sum, m) => sum + (m.credits || 0), 0)
  const totalCreditsRequired = catalogTotalCredits > 0 ? catalogTotalCredits : 120
  const completedModules = studentModules.filter(m => m.status === 'COMPLETED')
  const earnedCredits = completedModules.reduce((sum, m) => sum + (m.credits || 0), 0)
  const progressPercentage = Math.min((earnedCredits / totalCreditsRequired) * 100, 100)

  // Group curriculum by year and semester
  const years = [1, 2, 3, 4]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out pb-20">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-sans flex items-center gap-3">
            <Map className="h-7 w-7 text-primary" />
            Curriculum Roadmap
          </h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Map out your entire degree path. Track required courses and select specializations.
          </p>
        </div>
        <Link href="/academic" className="text-xs font-bold text-primary hover:underline">
          &larr; Back to Academic Hub
        </Link>
      </div>

      {/* DEGREE PROGRESS TRACKER */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Degree Progress</h3>
          </div>
          <div className="text-right font-semibold">
            <span className="text-xl font-black text-primary">{earnedCredits}</span>
            <span className="text-xs text-muted-foreground"> / {totalCreditsRequired} Credits</span>
          </div>
        </div>
        
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground font-semibold">{progressPercentage.toFixed(1)}% of your degree completed.</p>
      </div>

      {/* ROADMAP YEARS */}
      <div className="space-y-6">
        {years.map(year => {
          const yearModules = curriculum.filter(m => m.year === year)
          if (yearModules.length === 0 && year > 2) return null
          
          // Determine Year Status dynamically
          const userYear = user?.current_year || 2
          const studentModsInYear = studentModules.filter(sm => sm.year === year || curriculum.some(cm => cm.id === sm.curriculum_module_id && cm.year === year))
          const hasOngoing = studentModsInYear.some(m => m.status === 'ONGOING')
          const allCompleted = studentModsInYear.length > 0 && studentModsInYear.every(m => m.status === 'COMPLETED')
          
          let yearStatus = 'Planned'
          let statusColor = 'text-muted-foreground border-border bg-secondary'
          
          if (allCompleted || year < userYear) { 
            yearStatus = 'Completed' 
            statusColor = 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200' 
          } else if (hasOngoing || year === userYear) { 
            yearStatus = 'In Progress' 
            statusColor = 'text-primary bg-primary/10 border-primary/20' 
          }

          return (
            <div key={year} className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              
              {/* Year Header */}
              <div className="bg-secondary/40 p-5 border-b border-border flex justify-between items-center">
                <h3 className="text-base font-bold text-foreground">Year {year}</h3>
                <span className={`px-2.5 py-0.5 text-[10px] font-black rounded uppercase tracking-wider border ${statusColor}`}>
                  {yearStatus}
                </span>
              </div>

              {/* Semesters */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2].map(sem => {
                  const semModules = yearModules.filter(m => m.semester === sem)
                  if (semModules.length === 0) return null

                  return (
                    <div key={sem} className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                        Semester {sem}
                      </h4>
                      
                      <div className="space-y-3">
                        {semModules.map(mod => {
                          const selected = isModuleSelected(mod.id, mod.course_code)
                          
                          return (
                            <div key={mod.id} className={`p-4 rounded-lg border ${selected || mod.is_compulsory ? 'bg-background border-border' : 'bg-secondary/30 border-dashed border-border'}`}>
                              <div className="flex justify-between items-start gap-4">
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-foreground truncate">{mod.course_name}</h5>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-1">{mod.course_code} • {mod.credits} Credits</p>
                                  {mod.category && (
                                    <span className="inline-block mt-2 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-secondary text-muted-foreground border border-border">
                                      {mod.category}
                                    </span>
                                  )}
                                  {mod.track && (
                                    <span className="inline-block mt-2 ml-2 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-primary/10 text-primary border border-primary/10">
                                      {mod.track}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-right shrink-0">
                                  {mod.is_compulsory ? (
                                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                      <CheckCircle className="h-3.5 w-3.5" /> Compulsory
                                    </span>
                                  ) : selected ? (
                                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <CheckCircle className="h-3.5 w-3.5" /> Added to Plan
                                    </span>
                                  ) : (
                                    <form action={addModuleAction}>
                                      <input type="hidden" name="curriculum_module_id" value={mod.id} />
                                      <input type="hidden" name="code" value={mod.course_code} />
                                      <input type="hidden" name="name" value={mod.course_name} />
                                      <input type="hidden" name="credits" value={mod.credits} />
                                      <input type="hidden" name="is_compulsory" value="false" />
                                      <button type="submit" className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground hover:bg-primary/95 rounded text-[10px] font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer">
                                        <Plus className="h-3 w-3" /> Add to Plan
                                      </button>
                                    </form>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
