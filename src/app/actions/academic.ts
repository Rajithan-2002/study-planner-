'use server'

import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateOverallMetrics } from '@/lib/academic/engine'
import { MASTER_MIT_SEMESTER_2_TIMETABLE, getTimetableForDegree } from '@/lib/academic/timetable-data'

export async function syncAcademicMetrics(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data: modules } = await supabase.from('modules').select('*').eq('user_id', userId)
    const { data: curriculum } = await supabase.from('curriculum_modules').select('*')

    const metrics = calculateOverallMetrics(modules || [], curriculum || [])

    await supabase
      .from('users')
      .update({
        current_gpa: metrics.overallGpa,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    revalidatePath('/')
    revalidatePath('/academic')
    revalidatePath('/academic/roadmap')
    revalidatePath('/academic/gpa-calculator')
    revalidatePath('/today')

    return metrics
  } catch (err) {
    console.error('syncAcademicMetrics error:', err)
    return null
  }
}

// FETCH ACTIONS
export async function getAcademicProfile() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    let { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
    
    if (!user) {
      const { data: newUser } = await supabase.from('users').upsert({
        id: userId,
        full_name: 'Student User',
        email: 'student@studyplanner.com',
        degree_name: 'Information Technology (MIT)',
        university: 'University of Kelaniya',
        graduation_year: 2028,
        current_gpa: 3.77
      }).select().maybeSingle()
      user = newUser
    }

    let { data: semesters } = await supabase.from('academic_semesters').select('*').eq('user_id', userId).order('year', { ascending: true }).order('semester', { ascending: true })
    
    if (!semesters || semesters.length === 0) {
      const defaultSems = [
        { user_id: userId, year: 1, semester: 1 },
        { user_id: userId, year: 1, semester: 2 },
        { user_id: userId, year: 2, semester: 1 },
        { user_id: userId, year: 2, semester: 2 },
      ]
      const { data: createdSems } = await supabase.from('academic_semesters').insert(defaultSems).select()
      semesters = createdSems || []
    }
    
    // Current standing is Year 2 Sem 2
    let currentSemester = semesters.find(s => s.year === 2 && s.semester === 2) || semesters[semesters.length - 1] || { year: 2, semester: 2 }
    
    const { data: m } = await supabase.from('modules').select('*').eq('user_id', userId)
    const allModules = m || []

    return {
      user: user || {
        degree_name: 'Information Technology (MIT)',
        university: 'University of Kelaniya',
        current_gpa: 3.77
      },
      currentSemester,
      semesters: semesters || [],
      allModules
    }
  } catch (err) {
    console.error('getAcademicProfile exception:', err)
    return {
      user: {
        degree_name: 'Information Technology (MIT)',
        university: 'University of Kelaniya',
        current_gpa: 3.77
      },
      currentSemester: { year: 2, semester: 2 },
      semesters: [],
      allModules: []
    }
  }
}

export async function getAcademicRoadmap() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
    let { data: curriculum } = await supabase.from('curriculum_modules').select('*').order('year').order('semester')
    
    if (!curriculum || curriculum.length === 0) {
      await seedMasterCurriculum()
      const { data: refreshedCurriculum } = await supabase.from('curriculum_modules').select('*').order('year').order('semester')
      curriculum = refreshedCurriculum || []
    }

    const { data: studentModules } = await supabase.from('modules').select('*').eq('user_id', userId)

    return {
      curriculum: curriculum || [],
      studentModules: studentModules || [],
      user
    }
  } catch (err) {
    console.error('getAcademicRoadmap exception:', err)
    return {
      curriculum: [],
      studentModules: [],
      user: null
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

    const { data: user } = await supabase.from('users').select('degree_name').eq('id', userId).maybeSingle()
    const masterTimetable = getTimetableForDegree(user?.degree_name)

    const { data: semesters } = await supabase.from('academic_semesters').select('id').eq('user_id', userId)
    let dbSessions: any[] = []
    let modulesList: any[] = []

    if (semesters && semesters.length > 0) {
      const { data: modules } = await supabase.from('modules').select('id, name, code').in('semester_id', semesters.map(s => s.id)).eq('user_id', userId)
      modulesList = modules || []
      if (modulesList.length > 0) {
        const { data: sessions } = await supabase.from('timetable_sessions').select('*').in('module_id', modulesList.map(m => m.id))
        dbSessions = sessions || []
      }
    }

    if (dbSessions.length > 0) {
      return dbSessions.map(session => ({
        ...session,
        module: modulesList.find(m => m.id === session.module_id) || { name: session.code, code: session.code }
      }))
    }

    // Return filtered Master Timetable based on student's degree track (MIT vs IT)
    return masterTimetable.map((item, index) => ({
      id: `master-${index}`,
      day: item.day,
      start_time: item.start_time,
      end_time: item.end_time,
      location: item.location,
      session_type: item.session_type,
      lecturer: item.lecturer,
      module: {
        code: item.code,
        name: item.name
      }
    }))
  } catch (err) {
    console.error('getWeeklyTimetable exception:', err)
    return MASTER_MIT_SEMESTER_2_TIMETABLE.map((item, index) => ({
      id: `master-${index}`,
      day: item.day,
      start_time: item.start_time,
      end_time: item.end_time,
      location: item.location,
      session_type: item.session_type,
      lecturer: item.lecturer,
      module: {
        code: item.code,
        name: item.name
      }
    }))
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
    let semester_id = formData.get('semester_id') as string
    let year = parseInt(formData.get('year') as string)
    let semester = parseInt(formData.get('semester') as string)

    if (!code || !name) {
      return { success: false, error: 'Module code and name are required' }
    }

    // Lookup year and semester from curriculum template if not directly provided
    if ((isNaN(year) || isNaN(semester)) && curriculum_module_id) {
      const { data: cm } = await supabase.from('curriculum_modules').select('year, semester').eq('id', curriculum_module_id).maybeSingle()
      if (cm) {
        year = cm.year
        semester = cm.semester
      }
    }

    if (isNaN(year)) year = 1
    if (isNaN(semester)) semester = 1

    if (!semester_id) {
      const { data: sems } = await supabase.from('academic_semesters').select('id').eq('user_id', userId).eq('year', year).eq('semester', semester).limit(1)
      let sem = sems && sems.length > 0 ? sems[0] : null
      if (!sem) {
        const { data: newSem } = await supabase.from('academic_semesters').insert({ user_id: userId, year, semester }).select().single()
        sem = newSem
      }
      if (sem) {
        semester_id = sem.id
      }
    }

    const { data: existingMod } = await supabase
      .from('modules')
      .select('*')
      .eq('user_id', userId)
      .eq('semester_id', semester_id)
      .eq('code', code)
      .maybeSingle()

    let data, error
    if (existingMod) {
      if (existingMod.is_archived) {
        const { data: updateData, error: updateErr } = await supabase
          .from('modules')
          .update({
            is_archived: false,
            status: 'NOT_STARTED',
            grade: null
          })
          .eq('id', existingMod.id)
          .select()
          .single()
        data = updateData
        error = updateErr
      } else {
        return { success: true, data: existingMod }
      }
    } else {
      const { data: insData, error: insErr } = await supabase.from('modules').insert({
        user_id: userId,
        curriculum_module_id,
        semester_id,
        code,
        name,
        credits,
        year,
        semester,
        status: 'NOT_STARTED',
        is_selected: !is_compulsory
      }).select().single()
      data = insData
      error = insErr
    }

    if (error) {
      console.error('Error adding module to plan:', error)
      return { success: false, error: error.message || 'Failed to add module to plan' }
    }

    revalidatePath('/academic')
    revalidatePath('/academic/roadmap')
    return { success: true, data }
  } catch (err: any) {
    console.error('addModuleToPlan exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function importSemesterModulesAction(semesterId: string | null | undefined, year: number, semester: number) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    let activeSemesterId = semesterId

    if (!activeSemesterId) {
      const { data: sems } = await supabase.from('academic_semesters').select('id').eq('user_id', userId).eq('year', year).eq('semester', semester).limit(1)
      let sem = sems && sems.length > 0 ? sems[0] : null
      if (!sem) {
        const { data: newSem, error: semErr } = await supabase.from('academic_semesters').insert({ user_id: userId, year, semester }).select().single()
        if (semErr) throw semErr
        sem = newSem
      }
      activeSemesterId = sem?.id
    }

    if (!activeSemesterId) {
      return { success: false, error: 'Failed to resolve academic semester' }
    }

    // 1. Get curriculum modules for this year & semester
    const { data: cmList, error: cmErr } = await supabase
      .from('curriculum_modules')
      .select('*')
      .eq('year', year)
      .eq('semester', semester)

    if (cmErr) throw cmErr
    if (!cmList || cmList.length === 0) {
      return { success: false, error: 'No courses found in curriculum catalog for this year and semester.' }
    }

    // 2. Fetch user's existing modules in this semester to prevent duplication
    const { data: existingMods, error: modErr } = await supabase
      .from('modules')
      .select('id, code, curriculum_module_id, is_archived')
      .eq('user_id', userId)
      .eq('semester_id', activeSemesterId)

    if (modErr) throw modErr

    const activeCodes = new Set<string>()
    const activeCmIds = new Set<string>()
    const archivedIdsToRestore: string[] = []

    const existingModsList = existingMods || []
    
    // Process existing modules
    existingModsList.forEach(m => {
      if (!m.is_archived) {
        if (m.code) activeCodes.add(m.code)
        if (m.curriculum_module_id) activeCmIds.add(m.curriculum_module_id)
      }
    })

    // Identify which curriculum modules to insert vs restore
    const modulesToInsert = []
    
    for (const cm of cmList) {
      // If it's already active, skip
      if (activeCodes.has(cm.course_code) || (cm.id && activeCmIds.has(cm.id))) {
        continue
      }

      // Check if there is an archived version we can restore
      const archivedMatch = existingModsList.find(m => 
        m.is_archived && 
        (m.curriculum_module_id === cm.id || m.code === cm.course_code)
      )

      if (archivedMatch) {
        archivedIdsToRestore.push(archivedMatch.id)
      } else {
        modulesToInsert.push({
          user_id: userId,
          curriculum_module_id: cm.id,
          semester_id: activeSemesterId,
          code: cm.course_code,
          name: cm.course_name,
          credits: cm.credits,
          year: cm.year,
          semester: cm.semester,
          status: 'NOT_STARTED',
          is_selected: !cm.is_compulsory,
          is_archived: false
        })
      }
    }

    let countRestored = 0
    let countInserted = 0

    // Restore archived matches
    if (archivedIdsToRestore.length > 0) {
      const { error: restoreErr } = await supabase
        .from('modules')
        .update({ is_archived: false, status: 'NOT_STARTED', grade: null })
        .in('id', archivedIdsToRestore)
      if (restoreErr) throw restoreErr
      countRestored = archivedIdsToRestore.length
    }

    // Insert new matches
    if (modulesToInsert.length > 0) {
      const { error: insErr } = await supabase.from('modules').insert(modulesToInsert)
      if (insErr) throw insErr
      countInserted = modulesToInsert.length
    }

    revalidatePath('/academic')
    revalidatePath('/academic/roadmap')
    revalidatePath('/')
    
    const totalCount = countRestored + countInserted
    return { success: true, count: totalCount }
  } catch (err: any) {
    console.error('importSemesterModulesAction exception:', err)
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
    const year = formData.get('year') ? parseInt(formData.get('year') as string) : null
    const semester = formData.get('semester') ? parseInt(formData.get('semester') as string) : null
    const grade = formData.get('grade') as string || null
    const status = formData.get('status') as string || (grade ? 'COMPLETED' : 'NOT_STARTED')
    const notes = formData.get('notes') as string || null

    if (!code || !name || isNaN(credits)) {
      return { success: false, error: 'Module code, name, and credits are required' }
    }

    const { data: existingMod } = await supabase
      .from('modules')
      .select('*')
      .eq('user_id', userId)
      .eq('semester_id', semester_id || null)
      .eq('code', code)
      .maybeSingle()

    let data, error
    if (existingMod) {
      const { data: updateData, error: updateErr } = await supabase
        .from('modules')
        .update({
          name,
          credits,
          status,
          grade,
          notes,
          year,
          semester,
          is_archived: false
        })
        .eq('id', existingMod.id)
        .select()
        .single()
      data = updateData
      error = updateErr
    } else {
      const { data: insData, error: insErr } = await supabase.from('modules').insert({
        user_id: userId,
        semester_id: semester_id || null,
        code,
        name,
        credits,
        grade,
        status,
        year,
        semester,
        notes,
        is_selected: true,
        is_archived: false
      }).select().single()
      data = insData
      error = insErr
    }

    if (error) {
      console.error('Error creating module:', error)
      return { success: false, error: error.message || 'Failed to create module' }
    }

    await syncAcademicMetrics(userId)
    revalidatePath('/academic')
    revalidatePath('/academic/roadmap')
    return { success: true, data }
  } catch (err: any) {
    console.error('createModule exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function updateModule(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const moduleId = formData.get('module_id') as string
    const code = formData.get('code') as string
    const name = formData.get('name') as string
    const credits = parseInt(formData.get('credits') as string)
    const grade = formData.get('grade') as string || null
    const status = formData.get('status') as string || (grade ? 'COMPLETED' : 'ONGOING')
    const priority = formData.get('priority') as string || 'LOW'
    const notes = formData.get('notes') as string || null
    const year = formData.get('year') ? parseInt(formData.get('year') as string) : null
    const semester = formData.get('semester') ? parseInt(formData.get('semester') as string) : null

    if (!moduleId || !code || !name || isNaN(credits)) {
      return { success: false, error: 'Module ID, code, name, and credits are required' }
    }

    const { data, error } = await supabase
      .from('modules')
      .update({
        code,
        name,
        credits,
        grade,
        status,
        priority,
        notes,
        year,
        semester,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating module:', error)
      return { success: false, error: error.message || 'Failed to update module' }
    }

    await syncAcademicMetrics(userId)
    revalidatePath('/academic')
    revalidatePath(`/academic/module/${moduleId}`)
    revalidatePath('/academic/roadmap')
    return { success: true, data }
  } catch (err: any) {
    console.error('updateModule exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function archiveModule(moduleId: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('modules')
      .update({
        is_archived: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error archiving module:', error)
      return { success: false, error: error.message || 'Failed to archive module' }
    }

    await syncAcademicMetrics(userId)
    revalidatePath('/academic')
    revalidatePath('/academic/roadmap')
    return { success: true, data }
  } catch (err: any) {
    console.error('archiveModule exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function deleteModule(moduleId: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting module:', error)
      return { success: false, error: error.message || 'Failed to delete module' }
    }

    await syncAcademicMetrics(userId)
    revalidatePath('/academic')
    revalidatePath('/academic/roadmap')
    return { success: true }
  } catch (err: any) {
    console.error('deleteModule exception:', err)
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

export async function updateCalculatedCgpa(cgpa: number, completedModulesPayload?: Array<{
  code: string
  name: string
  credits: number
  grade: string
  year: number
  semester: number
}>) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    // 1. Upsert User Profile CGPA cleanly
    let { data: user, error } = await supabase.from('users').upsert({
      id: userId,
      current_gpa: cgpa,
      full_name: 'Student User',
      email: 'student@studyplanner.com',
      degree_name: 'Information Technology (MIT)',
      university: 'University of Kelaniya',
      graduation_year: 2028
    }).select().maybeSingle()

    if (error) {
      console.error('Error updating CGPA in user profile:', error)
      // Fallback update
      await supabase.from('users').update({ current_gpa: cgpa }).eq('id', userId)
    }

    // 2. Sync Completed Modules to database if provided
    if (completedModulesPayload && completedModulesPayload.length > 0) {
      const semMap: Record<string, string> = {}
      
      for (const item of completedModulesPayload) {
        const key = `${item.year}-${item.semester}`
        if (!semMap[key]) {
          let { data: existingSem } = await supabase
            .from('academic_semesters')
            .select('id')
            .eq('user_id', userId)
            .eq('year', item.year)
            .eq('semester', item.semester)
            .maybeSingle()

          if (existingSem?.id) {
            semMap[key] = existingSem.id
          } else {
            const { data: newSem } = await supabase
              .from('academic_semesters')
              .insert({ user_id: userId, year: item.year, semester: item.semester })
              .select()
              .maybeSingle()
            if (newSem?.id) semMap[key] = newSem.id
          }
        }

        const semId = semMap[key]
        if (semId) {
          let { data: existingMod } = await supabase
            .from('modules')
            .select('id')
            .eq('user_id', userId)
            .eq('code', item.code)
            .maybeSingle()

          let modId = existingMod?.id
          if (modId) {
            await supabase.from('modules').update({
              semester_id: semId,
              name: item.name,
              credits: item.credits,
              status: 'COMPLETED'
            }).eq('id', modId)
          } else {
            const { data: newMod } = await supabase
              .from('modules')
              .insert({
                user_id: userId,
                semester_id: semId,
                code: item.code,
                name: item.name,
                credits: item.credits,
                status: 'COMPLETED'
              })
              .select()
              .maybeSingle()
            modId = newMod?.id
          }

          if (modId && item.grade) {
            let { data: existingRes } = await supabase.from('module_results').select('id').eq('module_id', modId).maybeSingle()
            if (existingRes?.id) {
              await supabase.from('module_results').update({ grade: item.grade }).eq('id', existingRes.id)
            } else {
              await supabase.from('module_results').insert({ module_id: modId, grade: item.grade })
            }
          }
        }
      }
    }

    await syncAcademicMetrics(userId)
    revalidatePath('/academic')
    revalidatePath('/academic/roadmap')
    revalidatePath('/')
    return { success: true, data: user }
  } catch (err: any) {
    console.error('updateCalculatedCgpa exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function importTimetableSchedule(sessionsList: Array<{
  module_name: string
  module_code?: string
  day: string
  start_time: string
  end_time: string
  location?: string
  session_type?: string
}>) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    if (!sessionsList || sessionsList.length === 0) {
      return { success: false, error: 'No sessions provided' }
    }

    // 1. Ensure an active semester exists
    let { data: semesters } = await supabase.from('academic_semesters').select('*').eq('user_id', userId).order('year', { ascending: true }).order('semester', { ascending: true })
    let activeSemesterId = semesters?.[0]?.id

    if (!activeSemesterId) {
      const { data: newSem, error: semErr } = await supabase.from('academic_semesters').insert({
        user_id: userId,
        year: 1,
        semester: 1
      }).select().single()
      if (semErr) throw semErr
      activeSemesterId = newSem.id
    }

    // 2. Ensure modules exist and insert timetable sessions
    const insertedSessions = []
    for (const item of sessionsList) {
      const modName = item.module_name || 'General Course'
      const modCode = item.module_code || modName.substring(0, 8).toUpperCase()

      // Find or create module
      let { data: existingMod } = await supabase.from('modules').select('id').eq('user_id', userId).ilike('name', modName).single()
      let moduleId = existingMod?.id

      if (!moduleId) {
        const { data: newMod, error: modErr } = await supabase.from('modules').insert({
          user_id: userId,
          semester_id: activeSemesterId,
          code: modCode,
          name: modName,
          credits: 3,
          status: 'ONGOING'
        }).select().single()
        if (modErr) {
          console.error('Failed to create module for session:', modErr)
          continue
        }
        moduleId = newMod.id
      }

      // Ensure day is capitalized properly e.g. "Monday"
      const formattedDay = item.day.charAt(0).toUpperCase() + item.day.slice(1).toLowerCase()

      const { data: sess, error: sessErr } = await supabase.from('timetable_sessions').insert({
        module_id: moduleId,
        day: formattedDay,
        start_time: item.start_time,
        end_time: item.end_time,
        location: item.location || 'Lecture Hall',
        session_type: item.session_type || 'LECTURE'
      }).select().single()

      if (!sessErr && sess) {
        insertedSessions.push(sess)
      }
    }

    revalidatePath('/today')
    revalidatePath('/academic')
    revalidatePath('/academic/timetable')
    revalidatePath('/')
    return { success: true, count: insertedSessions.length }
  } catch (err: any) {
    console.error('importTimetableSchedule exception:', err)
    return { success: false, error: err.message || 'Failed to import timetable schedule' }
  }
}

export async function seedMasterCurriculum() {
  try {
    const supabase = await createClient()
    
    const curriculum = [
      // YEAR 1 SEMESTER 1
      { course_code: "MGTE 11243", course_name: "Principles of Management", credits: 3, year: 1, semester: 1, is_compulsory: true, category: "Management" },
      { course_code: "MGTE 11233", course_name: "Business Statistics and Economics", credits: 3, year: 1, semester: 1, is_compulsory: true, category: "Economics" },
      { course_code: "INTE 11213", course_name: "Fundamentals of Computing", credits: 3, year: 1, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "INTE 11223", course_name: "Programming Concepts", credits: 3, year: 1, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "DELT 11232", course_name: "English for Professionals", credits: 2, year: 1, semester: 1, is_compulsory: true, category: "Languages" },
      { course_code: "PMAT 11212", course_name: "Discrete Mathematics I", credits: 2, year: 1, semester: 1, is_compulsory: true, category: "Maths" },

      // YEAR 1 SEMESTER 2
      { course_code: "MGTE 12253", course_name: "Accounting Concepts and Costing", credits: 3, year: 1, semester: 2, is_compulsory: true, category: "Management" },
      { course_code: "INTE 12243", course_name: "Computer Networks", credits: 3, year: 1, semester: 2, is_compulsory: true, category: "IT" },
      { course_code: "INTE 12213", course_name: "Object Oriented Programming", credits: 3, year: 1, semester: 2, is_compulsory: true, category: "IT" },
      { course_code: "INTE 12223", course_name: "Database Design and Development", credits: 3, year: 1, semester: 2, is_compulsory: true, category: "IT" },
      { course_code: "MGTE 12263", course_name: "Optimization Methods in Management Science", credits: 3, year: 1, semester: 2, is_compulsory: true, category: "Management" },
      { course_code: "MGTE 12273", course_name: "Industry and Technology", credits: 3, year: 1, semester: 2, is_compulsory: true, category: "Management" },
      { course_code: "PMAT 12212", course_name: "Discrete Mathematics II", credits: 2, year: 1, semester: 2, is_compulsory: true, category: "Maths" },

      // YEAR 2 SEMESTER 1
      { course_code: "INTE 21213", course_name: "Information Systems Modelling", credits: 3, year: 2, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "INTE 21243", course_name: "Computer Architecture and Operating Systems", credits: 3, year: 2, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "INTE 21313", course_name: "Business Information Systems", credits: 3, year: 2, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "INTE 21323", course_name: "Web Application Development", credits: 3, year: 2, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "INTE 21333", course_name: "Event Driven Programming", credits: 3, year: 2, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "ACLT 21032", course_name: "Academic Literacy III", credits: 2, year: 2, semester: 1, is_compulsory: false, category: "Languages" },
      { course_code: "GNCT 23212", course_name: "Personal Progress Development", credits: 2, year: 2, semester: 1, is_compulsory: false, category: "General" },

      // YEAR 2 SEMESTER 2
      { course_code: "INTE 22253", course_name: "Distributed Systems and Cloud Computing", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },
      { course_code: "INTE 22263", course_name: "Embedded Systems Development", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },
      { course_code: "INTE 22283", course_name: "Mobile Applications Development", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },
      { course_code: "INTE 22293", course_name: "Software Architecture and Process Models", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },
      { course_code: "INTE 22303", course_name: "Artificial Intelligence", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },
      { course_code: "INTE 22313", course_name: "Software Design Patterns and Frameworks", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },
      { course_code: "INTE 22343", course_name: "Data Structures and Algorithms", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },

      // YEAR 3 SEMESTER 1
      { course_code: "INTE 31233", course_name: "Human Computer Interaction", credits: 3, year: 3, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "INTE 31283", course_name: "Big Data and Data Warehousing", credits: 3, year: 3, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "INTE 31356", course_name: "Software Development Project", credits: 6, year: 3, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "INTE 31393", course_name: "Information Security", credits: 3, year: 3, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "INTE 31403", course_name: "System Administration and Maintenance", credits: 3, year: 3, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "MGTE 31373", course_name: "Project Management", credits: 3, year: 3, semester: 1, is_compulsory: true, category: "Management" },
      { course_code: "MGTE 31383", course_name: "Research Methods", credits: 3, year: 3, semester: 1, is_compulsory: true, category: "Management" },

      // YEAR 3 SEMESTER 2
      { course_code: "GNCT 32216", course_name: "Internship (6 Months)", credits: 6, year: 3, semester: 2, is_compulsory: false, category: "General" },

      // YEAR 4 SEMESTER 1
      { course_code: "INTE 41393", course_name: "System Integration Technologies", credits: 3, year: 4, semester: 1, is_compulsory: true, category: "IT" },
      { course_code: "MGTE 41323", course_name: "Professional Practices", credits: 3, year: 4, semester: 1, is_compulsory: true, category: "Management" },
      { course_code: "MGTE 41313", course_name: "Statistical Data Modelling", credits: 3, year: 4, semester: 1, is_compulsory: true, category: "Management" },
      { course_code: "INTE 41323", course_name: "Neural Networks and Deep Learning", credits: 3, year: 4, semester: 1, is_compulsory: true, category: "IT" },

      // YEAR 4 SEMESTER 2
      { course_code: "INTE 43216", course_name: "Research Project", credits: 6, year: 4, semester: 2, is_compulsory: true, category: "IT" },
      { course_code: "MGTE 42323", course_name: "Strategic Quality Management & Lean Six Sigma", credits: 3, year: 4, semester: 2, is_compulsory: true, category: "Management" },
      { course_code: "MGTE 42333", course_name: "Business and IT Law", credits: 3, year: 4, semester: 2, is_compulsory: true, category: "Management" }
    ]

    const { data, error } = await supabase
      .from('curriculum_modules')
      .upsert(curriculum, { onConflict: 'course_code' })
      .select()

    if (error) throw error
    return { success: true, count: data ? data.length : 0 }
  } catch (err: any) {
    console.error('seedMasterCurriculum error:', err)
    return { success: false, error: err.message }
  }
}
