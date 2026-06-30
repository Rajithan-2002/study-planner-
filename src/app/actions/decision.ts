'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { DecisionIntelligenceEngine } from '@/lib/ai/decision/engine'
import { platformRegistry } from '@/lib/platform/registry'

export async function getRecommendations(policy: 'BALANCED' | 'ACADEMIC_FIRST' | 'CAREER_FIRST' | 'DEADLINE_FIRST' = 'BALANCED') {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    // Query platform coordinators to fetch decision context
    const decisionEngine = platformRegistry.getEngine('decision')
    if (!decisionEngine) return { success: false, error: 'Decision engine not found' }

    const res = await decisionEngine.calculate(userId)
    if (!res.success || !res.data) return { success: false, error: 'Failed to compute recommendations' }

    const decisionObj = res.data

    // Persist calculated recommendations to DB recommendations table
    const inserts = decisionObj.recommendations.map((r: any) => ({
      user_id: userId,
      title: r.title,
      description: r.description,
      category: r.category,
      status: r.status,
      priority_score: r.priorityScore,
      impact_score: r.impactScore,
      urgency_score: r.urgencyScore,
      effort_score: r.effortScore,
      explainability: r.explainability
    }))

    // Clean old generated recommendations before saving new ones
    await supabase.from('recommendations').delete().eq('user_id', userId).eq('status', 'GENERATED')

    if (inserts.length > 0) {
      await supabase.from('recommendations').insert(inserts)
    }

    revalidatePath('/')
    return { success: true, data: decisionObj }
  } catch (err: any) {
    console.error('getRecommendations exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function acceptRecommendation(recId: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('recommendations')
      .update({ status: 'ACCEPTED' })
      .eq('id', recId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error accepting recommendation:', error)
      return { success: false, error: error.message || 'Failed to accept recommendation' }
    }

    await logActivity('ACCEPT_RECOMMENDATION', 'RECOMMENDATION', recId)

    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('acceptRecommendation exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function dismissRecommendation(recId: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('recommendations')
      .update({ status: 'DISMISSED' })
      .eq('id', recId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error dismissing recommendation:', error)
      return { success: false, error: error.message || 'Failed to dismiss recommendation' }
    }

    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('dismissRecommendation exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}

export async function simulateScenarioAction(scenarioName: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    // Load active state stats for base GPA
    const { data: userProfile } = await supabase.from('users').select('current_gpa').eq('id', userId).single()
    const baseGpa = userProfile?.current_gpa ? Number(userProfile.current_gpa) : 3.8

    // Trigger simulation
    const result = DecisionIntelligenceEngine.simulateScenario(scenarioName, baseGpa, 85.0)

    return { success: true, data: result }
  } catch (err: any) {
    console.error('simulateScenarioAction exception:', err)
    return { success: false, error: err.message || 'Server error' }
  }
}
