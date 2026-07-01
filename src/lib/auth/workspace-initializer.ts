import { createClient } from '@/utils/supabase/server'

// ─── Workspace Initializer ────────────────────────────────────────────────────
// Called once after a user's first verified sign-in.
// Idempotent — safe to call multiple times. Uses upsert everywhere.
// Initializes ALL modules so the user never has to manually configure them.

export interface WorkspaceInitResult {
  success: boolean
  isNewUser: boolean
  error?: string
}

export class WorkspaceInitializer {
  static async initialize(
    userId: string,
    metadata?: {
      full_name?: string
      university?: string
      graduation_year?: number
      avatar_url?: string
      email?: string
    }
  ): Promise<WorkspaceInitResult> {
    const supabase = await createClient()

    try {
      // 1. Check if this is a new user
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      const isNewUser = !existingProfile

      // 2. Upsert user profile
      await supabase.from('users').upsert({
        id: userId,
        email: metadata?.email ?? '',
        full_name: metadata?.full_name ?? 'New User',
        avatar_url: metadata?.avatar_url ?? null,
        university: metadata?.university ?? null,
        graduation_year: metadata?.graduation_year ?? null,
        current_gpa: null
      }, { onConflict: 'id' })

      // 3. Initialize academic semesters (Years 1-4)
      if (isNewUser) {
        const semesters = []
        for (let year = 1; year <= 4; year++) {
          for (let sem = 1; sem <= 2; sem++) {
            semesters.push({ user_id: userId, year, semester: sem })
          }
        }
        await supabase.from('academic_semesters').upsert(semesters, {
          onConflict: 'user_id,year,semester',
          ignoreDuplicates: true
        })
      }

      // 4. Initialize planning capacity defaults
      await supabase.from('planning_capacity').upsert({
        user_id: userId,
        monday_hours: 4.0,
        tuesday_hours: 4.0,
        wednesday_hours: 4.0,
        thursday_hours: 4.0,
        friday_hours: 4.0,
        saturday_hours: 8.0,
        sunday_hours: 6.0,
        preferred_focus_block: 90,
        minimum_break: 15,
        maximum_weekly_hours: 32.0,
        preferred_start_time: '08:00:00',
        preferred_end_time: '22:00:00',
        sleep_time: '23:00:00',
        wake_time: '07:00:00',
        energy_profile: 'BALANCED'
      }, { onConflict: 'user_id' })

      // 5. Initialize scheduler preferences (legacy compatibility)
      await supabase.from('user_schedule_preferences').upsert({
        user_id: userId,
        preferred_focus_time: 'MORNING',
        max_daily_study_hours: 4.0,
        max_daily_project_hours: 3.0,
        buffer_minutes: 10,
        sleep_start_time: '23:00',
        sleep_end_time: '07:00',
        work_start_time: '08:00',
        work_end_time: '22:00'
      }, { onConflict: 'user_id' })

      return { success: true, isNewUser }
    } catch (err: any) {
      console.error('[WorkspaceInitializer] Failed:', err)
      return { success: false, isNewUser: false, error: err.message }
    }
  }
}
