import { createClient } from '@/utils/supabase/server'
import { UserPreferences } from '../memory/types'

export class PersonalizationEngine {
  
  // 1. Get user preferences with standard defaults
  static async getPreferences(userId: string): Promise<UserPreferences> {
    const supabase = await createClient()
    const { data } = await supabase.from('user_preferences').select('*').eq('user_id', userId).single()

    if (!data) {
      return {
        userId,
        preferredStudyHours: 4.0,
        preferredAiStyle: 'BALANCED',
        preferredLearningStyle: 'VISUAL',
        focusDuration: 45
      }
    }

    return {
      id: data.id,
      userId: data.user_id,
      preferredStudyHours: Number(data.preferred_study_hours || 4.0),
      preferredAiStyle: data.preferred_ai_style || 'BALANCED',
      preferredLearningStyle: data.preferred_learning_style || 'VISUAL',
      careerGoals: data.career_goals || undefined,
      focusDuration: data.focus_duration || 45
    }
  }

  // 2. Update preferences
  static async updatePreferences(userId: string, prefs: Partial<UserPreferences>) {
    const supabase = await createClient()
    const payload: any = { user_id: userId }

    if (prefs.preferredStudyHours !== undefined) payload.preferred_study_hours = prefs.preferredStudyHours
    if (prefs.preferredAiStyle !== undefined) payload.preferred_ai_style = prefs.preferredAiStyle
    if (prefs.preferredLearningStyle !== undefined) payload.preferred_learning_style = prefs.preferredLearningStyle
    if (prefs.careerGoals !== undefined) payload.career_goals = prefs.careerGoals
    if (prefs.focusDuration !== undefined) payload.focus_duration = prefs.focusDuration

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw new Error(`Failed to update user preferences: ${error.message}`)
    return data
  }
}
