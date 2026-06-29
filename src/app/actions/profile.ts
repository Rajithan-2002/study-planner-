'use server'

import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserProfile() {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('getUserProfile exception:', err)
    return null
  }
}

export async function updateUserProfile(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const fullName = formData.get('full_name') as string
    const university = formData.get('university') as string | null
    const degreeName = formData.get('degree_name') as string | null
    const graduationYear = formData.get('graduation_year') ? Number(formData.get('graduation_year')) : null
    const careerGoal = formData.get('career_goal') as string | null
    const currentGpa = formData.get('current_gpa') ? Number(formData.get('current_gpa')) : null
    const targetGpa = formData.get('target_gpa') ? Number(formData.get('target_gpa')) : null
    const currentYear = formData.get('current_year') ? Number(formData.get('current_year')) : null
    const currentSemester = formData.get('current_semester') ? Number(formData.get('current_semester')) : null

    if (!fullName) {
      return { success: false, error: 'Full Name is required' }
    }

    const { data, error } = await supabase
      .from('users')
      .update({
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
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return { success: false, error: error.message || 'Failed to update user profile' }
    }

    revalidatePath('/')
    revalidatePath('/academic')
    revalidatePath('/today')
    
    return { success: true, data }
  } catch (err: any) {
    console.error('updateUserProfile exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
