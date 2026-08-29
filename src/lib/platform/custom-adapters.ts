import { ISearchAdapter, SearchItem } from './types'
import { createClient } from '@/utils/supabase/server'

export class GoalSearchAdapter implements ISearchAdapter {
  entityType = 'GOAL'
  async search(query: string, userId: string): Promise<SearchItem[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)

      return (data || []).map(g => ({
        id: g.id,
        title: g.title,
        subtitle: `Goal | Category: ${g.category} | Status: ${g.status}`,
        entityType: 'GOAL',
        url: `/goals`,
        snippet: g.description || undefined
      }))
    } catch (err) {
      console.error('GoalSearchAdapter error:', err)
      return []
    }
  }
}

export class ReflectionSearchAdapter implements ISearchAdapter {
  entityType = 'REFLECTION'
  async search(query: string, userId: string): Promise<SearchItem[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', userId)
        .ilike('content', `%${query}%`)

      return (data || []).map(r => ({
        id: r.id,
        title: r.content.length > 50 ? `${r.content.substring(0, 47)}...` : r.content,
        subtitle: `Reflected on: ${new Date(r.created_at).toLocaleDateString()}`,
        entityType: 'REFLECTION',
        url: `/timeline`,
        snippet: r.content
      }))
    } catch (err) {
      console.error('ReflectionSearchAdapter error:', err)
      return []
    }
  }
}

export class WorkSessionSearchAdapter implements ISearchAdapter {
  entityType = 'WORK_SESSION'
  async search(query: string, userId: string): Promise<SearchItem[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', userId)
        .ilike('notes', `%${query}%`)

      return (data || []).map(w => ({
        id: w.id,
        title: `Work Session: ${w.notes || 'No description'}`,
        subtitle: `Duration: ${w.duration_minutes} mins | Entity: ${w.entity_type}`,
        entityType: 'WORK_SESSION',
        url: `/projects`,
        snippet: w.notes || undefined
      }))
    } catch (err) {
      console.error('WorkSessionSearchAdapter error:', err)
      return []
    }
  }
}

export class RecurringActivitySearchAdapter implements ISearchAdapter {
  entityType = 'RECURRING_ACTIVITY'
  async search(query: string, userId: string): Promise<SearchItem[]> {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('recurring_activities')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)

      return (data || []).map(ra => ({
        id: ra.id,
        title: ra.title,
        subtitle: `Recurring Activity | Status: ${ra.is_active ? 'Active' : 'Inactive'}`,
        entityType: 'RECURRING_ACTIVITY',
        url: `/planning`,
        snippet: ra.description || undefined
      }))
    } catch (err) {
      console.error('RecurringActivitySearchAdapter error:', err)
      return []
    }
  }
}
