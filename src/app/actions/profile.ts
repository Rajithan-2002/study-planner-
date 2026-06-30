'use server'

import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserProfile() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      // Upsert default profile for dev user
      const { data: newData, error: upsertErr } = await supabase
        .from('users')
        .upsert({
          id: userId,
          full_name: 'Student User',
          email: 'student@studyplanner.com',
          degree_name: 'Information Technology (MIT)',
          university: 'University of Kelaniya',
          graduation_year: 2028,
          current_gpa: 0.0,
          target_gpa: 4.0,
          academic_profile_completed: false
        })
        .select()
        .single()
      
      if (upsertErr) {
        console.error('Failed to auto-create user profile:', upsertErr)
        return { full_name: 'Student User', degree_name: 'Information Technology (MIT)', academic_profile_completed: false }
      }
      return newData
    }

    return data
  } catch (err) {
    console.error('getUserProfile exception:', err)
    return { full_name: 'Student User', degree_name: 'Information Technology (MIT)', academic_profile_completed: false }
  }
}

export async function updateUserProfile(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const fullName = formData.get('full_name') as string
    const university = formData.get('university') as string | null
    const faculty = formData.get('faculty') as string | null
    const degreeName = formData.get('degree_name') as string | null
    const department = formData.get('department') as string | null
    const graduationYear = formData.get('graduation_year') ? Number(formData.get('graduation_year')) : null
    const careerGoal = formData.get('career_goal') as string | null
    const currentGpa = formData.get('current_gpa') ? Number(formData.get('current_gpa')) : null
    const targetGpa = formData.get('target_gpa') ? Number(formData.get('target_gpa')) : null
    const currentYear = formData.get('current_year') ? Number(formData.get('current_year')) : null
    const currentSemester = formData.get('current_semester') ? Number(formData.get('current_semester')) : null
    const academicProfileCompleted = formData.get('academic_profile_completed') === 'true'

    if (!fullName) {
      return { success: false, error: 'Full Name is required' }
    }

    const updatePayload: any = {
      full_name: fullName,
      university,
      degree_name: degreeName,
      graduation_year: graduationYear,
      career_goal: careerGoal,
      current_gpa: currentGpa,
      target_gpa: targetGpa,
      current_year: currentYear,
      current_semester: currentSemester,
      updated_at: new Date().toISOString()
    }

    if (faculty !== null) updatePayload.faculty = faculty
    if (department !== null) updatePayload.department = department
    if (formData.has('academic_profile_completed')) updatePayload.academic_profile_completed = academicProfileCompleted

    const { data, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return { success: false, error: error.message || 'Failed to update user profile' }
    }

    revalidatePath('/')
    revalidatePath('/academic')
    revalidatePath('/academic/roadmap')
    revalidatePath('/today')
    
    return { success: true, data }
  } catch (err: any) {
    console.error('updateUserProfile exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function saveAcademicProfileWizard(wizardData: {
  university: string
  faculty?: string
  degree_name: string
  department?: string
  current_year: number
  current_semester: number
  graduation_year: number
  target_gpa?: number
}) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('users')
      .update({
        university: wizardData.university,
        faculty: wizardData.faculty || null,
        degree_name: wizardData.degree_name,
        department: wizardData.department || null,
        current_year: wizardData.current_year,
        current_semester: wizardData.current_semester,
        graduation_year: wizardData.graduation_year,
        target_gpa: wizardData.target_gpa || 4.0,
        academic_profile_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error in saveAcademicProfileWizard:', error)
      return { success: false, error: error.message || 'Failed to save academic profile setup' }
    }

    revalidatePath('/')
    revalidatePath('/academic')
    revalidatePath('/academic/roadmap')
    revalidatePath('/today')

    return { success: true, data }
  } catch (err: any) {
    console.error('saveAcademicProfileWizard exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function updateCapacityPreferences(prefs: {
  weekday_hours?: number
  saturday_hours?: number
  sunday_hours?: number
  max_weekly_hours?: number
  preferred_focus_block_minutes?: number
  minimum_break_minutes?: number
}) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('user_schedule_preferences')
      .upsert({
        user_id: userId,
        ...prefs,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating capacity preferences:', error)
      return { success: false, error: error.message || 'Failed to update capacity preferences' }
    }

    revalidatePath('/')
    revalidatePath('/settings')
    revalidatePath('/today')
    return { success: true, data }
  } catch (err: any) {
    console.error('updateCapacityPreferences exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

