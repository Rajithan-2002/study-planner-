import { createClient } from '@/utils/supabase/server'
import { ReflectionInsight } from '../memory/types'

export class ReflectionEngine {
  static async generateReflections(userId: string): Promise<ReflectionInsight[]> {
    const supabase = await createClient()

    const reflections: ReflectionInsight[] = []

    // Analyze GPA trends
    const { data: profile } = await supabase.from('users').select('current_gpa').eq('id', userId).single()
    
    if (profile?.current_gpa !== null && profile?.current_gpa !== undefined) {
      const gpa = Number(profile.current_gpa)
      if (gpa >= 3.7) {
        reflections.push({
          userId,
          reflectionType: 'ACHIEVEMENT_RECOGNITION',
          title: 'Academic Honor Standing',
          content: `Your current GPA of ${gpa} maintains an Dean's List honors trajectory across active semesters.`
        })
      }
    }

    // Analyze active certifications
    const { data: certs } = await supabase.from('certifications').select('id, title').eq('user_id', userId).eq('status', 'ACTIVE')
    if (certs && certs.length > 0) {
      reflections.push({
        userId,
        reflectionType: 'HABIT_DETECTION',
        title: 'Professional Skill Momentum',
        content: `You have ${certs.length} active certification paths currently in progress (including ${certs[0].title}).`
      })
    }

    // Persist to database reflections table
    for (const r of reflections) {
      await supabase.from('reflections').insert({
        user_id: userId,
        reflection_type: r.reflectionType,
        title: r.title,
        content: r.content
      })
    }

    return reflections
  }
}
