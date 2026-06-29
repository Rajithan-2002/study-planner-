import { BookOpen } from 'lucide-react'
import { getModuleWorkspace } from '@/app/actions/academic'
import { ModuleWorkspaceTabs } from '@/components/academic/ModuleWorkspaceTabs'

export default async function ModuleWorkspacePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params
  const { module, assignments, exams, results, sessions, resources } = await getModuleWorkspace(resolvedParams.id)

  if (!module) {
    return (
      <div className="py-12 text-center text-sm font-semibold text-muted-foreground">
        Module not found
      </div>
    )
  }

  // GPA Engine Calculations
  let totalWeightCompleted = 0
  let currentStandingMarks = 0
  let totalWeightPending = 0

  results.forEach(res => {
    if (res.marks !== null) {
      totalWeightCompleted += Number(res.weight || 0)
      currentStandingMarks += (Number(res.marks) * Number(res.weight)) / 100
    } else {
      totalWeightPending += Number(res.weight || 0)
    }
  })

  // Basic scaling
  const currentGradePercentage = totalWeightCompleted > 0 ? (currentStandingMarks / totalWeightCompleted) * 100 : 0
  const bestCasePercentage = Math.min(100, currentStandingMarks + totalWeightPending)
  const worstCasePercentage = Math.min(100, currentStandingMarks)

  // Determine expected grade mapping
  const getGradeLetter = (pct: number) => {
    if (pct >= 90) return 'A+'
    if (pct >= 85) return 'A'
    if (pct >= 80) return 'A-'
    if (pct >= 75) return 'B+'
    if (pct >= 70) return 'B'
    if (pct >= 65) return 'B-'
    if (pct >= 60) return 'C+'
    if (pct >= 55) return 'C'
    if (pct >= 50) return 'C-'
    return 'F'
  }

  const currentGrade = totalWeightCompleted > 0 ? getGradeLetter(currentGradePercentage) : 'N/A'
  const bestCaseGrade = getGradeLetter(bestCasePercentage)
  const worstCaseGrade = getGradeLetter(worstCasePercentage)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div className="flex items-center gap-5">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground font-sans">
              {module.name}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-xs font-semibold">
              <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
                {module.code}
              </span>
              <span className="text-muted-foreground">
                {module.credits} Credits
              </span>
              <span className="text-border">•</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                {module.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ModuleWorkspaceTabs 
        module={module}
        assignments={assignments}
        exams={exams}
        results={results}
        sessions={sessions}
        resources={resources}
        currentGrade={currentGrade}
        currentGradePercentage={currentGradePercentage}
        bestCaseGrade={bestCaseGrade}
        bestCasePercentage={bestCasePercentage}
        worstCaseGrade={worstCaseGrade}
        worstCasePercentage={worstCasePercentage}
      />
      
    </div>
  )
}
