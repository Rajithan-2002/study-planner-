'use client'

import { useState } from 'react'
import { ChevronDown, BookOpen, GraduationCap, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

type Module = {
  id: string
  code: string
  name: string
  credits: number
  status: string
}

type Semester = {
  id: string
  year: number
  semester: number
  modules: Module[]
}

export function SemesterList({ semesters }: { semesters: Semester[] }) {
  // Expand the first semester by default
  const [expandedId, setExpandedId] = useState<string | null>(semesters[0]?.id || null)

  return (
    <div className="space-y-4">
      {semesters.map((sem) => {
        const isExpanded = expandedId === sem.id
        const totalCredits = sem.modules.reduce((acc, m) => acc + (m.credits || 0), 0)
        
        return (
          <div 
            key={sem.id} 
            className="rounded-[24px] border border-gray-100 dark:border-gray-800/60 bg-white dark:bg-gray-900/50 shadow-sm overflow-hidden transition-all duration-300"
          >
            {/* Header (Tap to expand) */}
            <button 
              onClick={() => setExpandedId(isExpanded ? null : sem.id)}
              className="w-full flex items-center justify-between p-5 hover:bg-secondary/40 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Year {sem.year} • Semester {sem.semester}
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {sem.modules.length} Modules • {totalCredits} Credits
                  </p>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Expanded Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-5 pt-0 border-t border-border">
                {sem.modules.length === 0 ? (
                  <div className="text-center py-6 text-xs font-semibold text-muted-foreground bg-secondary/35 rounded-lg mt-4">
                    No modules added for this semester.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {sem.modules.map(module => (
                      <Link key={module.id} href={`/academic/module/${module.id}`}>
                        <div className="group flex items-center justify-between rounded-lg border border-border bg-background p-4 hover:border-primary transition-all cursor-pointer">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <BookOpen className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                {module.name}
                              </h4>
                              <p className="text-[10px] font-black text-muted-foreground mt-0.5 uppercase tracking-wider">
                                {module.code} • {module.credits} Credits
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 ml-2">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              module.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                              module.status === 'ONGOING' ? 'bg-primary/10 text-primary' :
                              'bg-secondary text-muted-foreground'
                            }`}>
                              {module.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
