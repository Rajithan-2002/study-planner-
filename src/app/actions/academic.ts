'use server'

import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// FETCH ACTIONS
export async function getAcademicProfile() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single()
    const { data: semesters } = await supabase.from('academic_semesters').select('*').eq('user_id', userId).order('year', { ascending: false }).order('semester', { ascending: false })
    
    let currentSemester = semesters?.[0]
    
    let allModules: any[] = []
    if (semesters && semesters.length > 0) {
      const { data: m } = await supabase.from('modules').select('*').eq('user_id', userId)
      allModules = m || []
    }

    return {
      user,
      currentSemester,
      semesters: semesters || [],
      allModules
    }
  } catch (err) {
    console.error('getAcademicProfile exception:', err)
    return {
      user: null,
      currentSemester: null,
      semesters: [],
      allModules: []
    }
  }
}

export async function getAcademicRoadmap() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: curriculum } = await supabase.from('curriculum_modules').select('*').order('year').order('semester')
    const { data: studentModules } = await supabase.from('modules').select('*').eq('user_id', userId)

    return {
      curriculum: curriculum || [],
      studentModules: studentModules || []
    }
  } catch (err) {
    console.error('getAcademicRoadmap exception:', err)
    return {
      curriculum: [],
      studentModules: []
    }
  }
}

export async function getModuleWorkspace(moduleId: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: moduleData } = await supabase.from('modules').select('*').eq('id', moduleId).eq('user_id', userId).single()
    if (!moduleData) {
      return {
        module: null,
        assignments: [],
        exams: [],
        results: [],
        sessions: [],
        resources: []
      }
    }

    const { data: assignments } = await supabase.from('assignments').select('*').eq('module_id', moduleId)
    const { data: exams } = await supabase.from('exams').select('*').eq('module_id', moduleId)
    const { data: results } = await supabase.from('module_results').select('*').eq('module_id', moduleId)
    const { data: sessions } = await supabase.from('timetable_sessions').select('*').eq('module_id', moduleId)
    
    const { data: knowledge_files } = await supabase.from('knowledge_files').select('*').eq('entity_type', 'MODULE').eq('entity_id', moduleId)

    return {
      module: moduleData,
      assignments: assignments || [],
      exams: exams || [],
      results: results || [],
      sessions: sessions || [],
      resources: knowledge_files || []
    }
  } catch (err) {
    console.error('getModuleWorkspace exception:', err)
    return {
      module: null,
      assignments: [],
      exams: [],
      results: [],
      sessions: [],
      resources: []
    }
  }
}

export async function getWeeklyTimetable() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: semesters } = await supabase.from('academic_semesters').select('id').eq('user_id', userId)
    if (!semesters || semesters.length === 0) return []

    const { data: modules } = await supabase.from('modules').select('id, name, code').in('semester_id', semesters.map(s => s.id)).eq('status', 'ONGOING').eq('user_id', userId)
    if (!modules || modules.length === 0) return []

    const { data: sessions } = await supabase.from('timetable_sessions').select('*').in('module_id', modules.map(m => m.id))

    return (sessions || []).map(session => ({
      ...session,
      module: modules.find(m => m.id === session.module_id)
    }))
  } catch (err) {
    console.error('getWeeklyTimetable exception:', err)
    return []
  }
}

// WRITE ACTIONS

export async function addModuleToPlan(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    const curriculum_module_id = formData.get('curriculum_module_id') as string
    const code = formData.get('code') as string
    const name = formData.get('name') as string
    const credits = parseInt(formData.get('credits') as string)
    const is_compulsory = formData.get('is_compulsory') === 'true'

    if (!code || !name) {
      return { success: false, error: 'Module code and name are required' }
    }

    const { data, error } = await supabase.from('modules').insert({
      user_id: userId,
      curriculum_module_id,
      code,
      name,
      credits,
      status: 'NOT_STARTED',
      is_selected: !is_compulsory
    }).select().single()

    if (error) {
      console.error('Error adding module to plan:', error)
      return { success: false, error: error.message || 'Failed to add module to plan' }
    }

    revalidatePath('/academic/roadmap')
    return { success: true, data }
  } catch (err: any) {
    console.error('addModuleToPlan exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function createSemester(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const year = parseInt(formData.get('year') as string)
    const semester = parseInt(formData.get('semester') as string)

    if (isNaN(year) || isNaN(semester)) {
      return { success: false, error: 'Invalid year or semester value' }
    }

    const { data, error } = await supabase.from('academic_semesters').insert({
      user_id: userId,
      year,
      semester
    }).select().single()

    if (error) {
      console.error('Error creating semester:', error)
      return { success: false, error: error.message || 'Failed to create semester' }
    }

    revalidatePath('/academic')
    return { success: true, data }
  } catch (err: any) {
    console.error('createSemester exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function createModule(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    const semester_id = formData.get('semester_id') as string
    const code = formData.get('code') as string
    const name = formData.get('name') as string
    const credits = parseInt(formData.get('credits') as string)

    if (!code || !name || isNaN(credits)) {
      return { success: false, error: 'Module code, name, and credits are required' }
    }

    const { data, error } = await supabase.from('modules').insert({
      user_id: userId,
      semester_id,
      code,
      name,
      credits,
      status: 'NOT_STARTED',
      is_selected: true
    }).select().single()

    if (error) {
      console.error('Error creating module:', error)
      return { success: false, error: error.message || 'Failed to create module' }
    }

    revalidatePath('/academic')
    return { success: true, data }
  } catch (err: any) {
    console.error('createModule exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function addModuleResult(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    const module_id = formData.get('module_id') as string
    const component = formData.get('component') as string
    const weight = parseFloat(formData.get('weight') as string)
    const marks = formData.get('marks') ? parseFloat(formData.get('marks') as string) : null
    const grade = formData.get('grade') as string || null

    if (!module_id || !component || isNaN(weight)) {
      return { success: false, error: 'Module, component, and weight are required' }
    }

    // Verify ownership of the referenced module
    const { data: moduleData, error: modErr } = await supabase
      .from('modules')
      .select('id')
      .eq('id', module_id)
      .eq('user_id', userId)
      .single()

    if (modErr || !moduleData) {
      return { success: false, error: 'Unauthorized: Module does not belong to user' }
    }

    const { data, error } = await supabase.from('module_results').insert({
      module_id,
      component,
      weight,
      marks,
      grade
    }).select().single()

    if (error) {
      console.error('Error inserting module result:', error)
      return { success: false, error: error.message || 'Failed to add module result' }
    }

    revalidatePath(`/academic/module/${module_id}`)
    return { success: true, data }
  } catch (err: any) {
    console.error('addModuleResult exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
