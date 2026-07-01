export interface ModuleData {
  id: string
  code: string
  name: string
  credits: number
  grade?: string | null
  status: string
  year?: number | null
  semester?: number | null
  is_archived?: boolean | null
}

export interface CurriculumModuleData {
  id: string
  course_code: string
  course_name: string
  credits: number
  year: number
  semester: number
}

// Map grade letters to grade point values on standard 4.0 scale
export function getGradePoints(grade: string | null | undefined): number | null {
  if (!grade) return null
  const cleanGrade = grade.trim().toUpperCase()
  switch (cleanGrade) {
    case 'A+': case 'A': return 4.0
    case 'A-': return 3.7
    case 'B+': return 3.3
    case 'B': return 3.0
    case 'B-': return 2.7
    case 'C+': return 2.3
    case 'C': return 2.0
    case 'C-': return 1.7
    case 'D+': return 1.3
    case 'D': return 1.0
    case 'E': case 'F': return 0.0
    default: return null
  }
}

// Calculate semester-specific metrics
export function calculateSemesterMetrics(modules: ModuleData[]) {
  const activeModules = modules.filter(m => !m.is_archived)
  const gradedModules = activeModules.filter(m => {
    const points = getGradePoints(m.grade)
    return points !== null
  })

  let totalPointsWeighted = 0
  let totalGradedCredits = 0

  gradedModules.forEach(m => {
    const points = getGradePoints(m.grade)!
    totalPointsWeighted += points * (m.credits || 0)
    totalGradedCredits += (m.credits || 0)
  })

  const semesterGpa = totalGradedCredits > 0 ? parseFloat((totalPointsWeighted / totalGradedCredits).toFixed(2)) : 0
  const totalSemesterCredits = activeModules.reduce((sum, m) => sum + (m.credits || 0), 0)

  return {
    semesterGpa,
    totalSemesterCredits,
    gradedModulesCount: gradedModules.length
  }
}

// Calculate overall degree metrics
export function calculateOverallMetrics(modules: ModuleData[], curriculumCatalog: CurriculumModuleData[]) {
  const activeModules = modules.filter(m => !m.is_archived)
  const completedModules = activeModules.filter(m => m.status === 'COMPLETED' || getGradePoints(m.grade) !== null)

  // Overall GPA calculation
  const gradedModules = activeModules.filter(m => {
    const points = getGradePoints(m.grade)
    return points !== null
  })

  let totalPointsWeighted = 0
  let totalGradedCredits = 0

  gradedModules.forEach(m => {
    const points = getGradePoints(m.grade)!
    totalPointsWeighted += points * (m.credits || 0)
    totalGradedCredits += (m.credits || 0)
  })

  const overallGpa = totalGradedCredits > 0 ? parseFloat((totalPointsWeighted / totalGradedCredits).toFixed(2)) : 0
  const creditsCompleted = completedModules.reduce((sum, m) => sum + (m.credits || 0), 0)

  const catalogCreditsSum = curriculumCatalog.reduce((sum, m) => sum + (m.credits || 0), 0)
  const totalDegreeCredits = catalogCreditsSum > 0 ? catalogCreditsSum : 120
  const creditsRemaining = Math.max(0, totalDegreeCredits - creditsCompleted)
  const progressPercentage = Math.min(100, parseFloat(((creditsCompleted / totalDegreeCredits) * 100).toFixed(1)))

  // Calculate Academic Standing
  let standing = 'Good Standing'
  if (gradedModules.length > 0) {
    if (overallGpa >= 3.7) standing = 'First Class Honors'
    else if (overallGpa >= 3.3) standing = 'Second Class Upper'
    else if (overallGpa >= 3.0) standing = 'Second Class Lower'
    else if (overallGpa < 2.0) standing = 'Academic Warning'
  }

  return {
    overallGpa,
    creditsCompleted,
    creditsRemaining,
    totalDegreeCredits,
    progressPercentage,
    standing,
    gradedModulesCount: gradedModules.length
  }
}
