import { PlanningCapacityEngine } from '@/lib/planning/engine'
import { getPlanningCenterData } from '@/app/actions/planning'
import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { PlanningCenterView } from '@/components/planning/PlanningCenterView'

export default async function PlanningPage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  // 1. Fetch capacity calculations & allocations
  const [
    dailyPlan,
    weeklyPlan,
    conflicts,
    dbData,
    certsRes,
    projectsRes
  ] = await Promise.all([
    PlanningCapacityEngine.buildDailyStudyPlan(userId),
    PlanningCapacityEngine.buildWeeklyPlan(userId),
    PlanningCapacityEngine.detectCapacityConflicts(userId),
    getPlanningCenterData(),
    supabase.from('certifications').select('id, name, estimated_total_hours, completed_hours').eq('user_id', userId).eq('is_archived', false),
    supabase.from('projects').select('id, name, estimated_total_hours, completed_hours').eq('user_id', userId).eq('is_archived', false)
  ])

  return (
    <PlanningCenterView
      dailyPlan={dailyPlan}
      weeklyPlan={weeklyPlan}
      conflicts={conflicts}
      capacity={dbData.capacity}
      goals={dbData.goals}
      recurring={dbData.recurring}
      recurringLogs={dbData.recurringLogs}
      fixed={dbData.fixed}
      vacation={dbData.vacation}
      decisions={dbData.decisions}
      certifications={certsRes.data || []}
      projects={projectsRes.data || []}
    />
  )
}
