import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { getUserProfile } from '@/app/actions/profile'
import { PersonalizationEngine } from '@/lib/personalization/engine'
import { SettingsView } from '@/components/layout/SettingsView'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const userId = await getCurrentUserId()
  const supabase = await createClient()

  // 1. Fetch User Profile
  const profile = await getUserProfile()

  // 2. Fetch Scheduler Preferences
  let { data: schedulerPrefs } = await supabase
    .from('user_schedule_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!schedulerPrefs) {
    schedulerPrefs = {
      preferred_focus_time: 'MORNING',
      max_daily_study_hours: 4.0,
      max_daily_project_hours: 3.0,
      buffer_minutes: 10,
      sleep_start_time: '23:00',
      sleep_end_time: '07:00',
      work_start_time: '08:00',
      work_end_time: '18:00'
    }
  }

  // 3. Fetch Personalization/AI/Memory preferences
  const personalizationPrefs = await PersonalizationEngine.getPreferences(userId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-650 dark:from-white dark:via-slate-200 dark:to-slate-450 bg-clip-text text-transparent">
          System Settings
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal academic profiles, AI tutor style, and time block constraints.
        </p>
      </div>

      <SettingsView
        initialProfile={profile}
        initialSchedulerPrefs={schedulerPrefs}
        initialPersonalizationPrefs={personalizationPrefs}
      />
    </div>
  )
}
