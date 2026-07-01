'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { WorkspaceInitializer } from '@/lib/auth/workspace-initializer'

// ─── Sign In ──────────────────────────────────────────────────────────────────
export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Please provide both email and password' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return { error: 'Incorrect email or password. Please try again.' }
    }
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Please verify your email. Check your inbox for the OTP code.', needsVerification: true, email }
    }
    return { error: error.message }
  }

  if (data.user) {
    // Ensure workspace is initialized (idempotent)
    await WorkspaceInitializer.initialize(data.user.id, {
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name,
      avatar_url: data.user.user_metadata?.avatar_url
    })
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = (formData.get('fullName') as string) || ''
  const university = (formData.get('university') as string) || ''
  const graduationYear = parseInt(formData.get('graduationYear') as string) || new Date().getFullYear() + 3

  if (!email || !password) {
    return { error: 'Please provide email and password' }
  }
  if (!fullName.trim()) {
    return { error: 'Please enter your full name' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, university, graduation_year: graduationYear },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
    }
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'An account with this email already exists. Please sign in instead.' }
    }
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Signup failed. Please try again.' }
  }

  // Pre-initialize workspace so it's ready when OTP is verified
  await WorkspaceInitializer.initialize(data.user.id, {
    email,
    full_name: fullName,
    university,
    graduation_year: graduationYear
  })

  // Redirect to OTP verification page
  return { success: true, email, redirectTo: `/auth/verify-otp?email=${encodeURIComponent(email)}` }
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export async function verifyOtp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const token = formData.get('token') as string

  if (!email || !token) {
    return { error: 'Missing email or verification code' }
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: token.replace(/\s/g, ''),
    type: 'email'
  })

  if (error || !data.user) {
    return { error: 'Invalid or expired code. Please check your email or request a new code.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

// ─── Resend Verification ──────────────────────────────────────────────────────
export async function resendVerification(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) {
    return { error: error.message }
  }
  return { success: true }
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' }
    }
  })
  if (error || !data.url) {
    return { error: 'Failed to initiate Google login. Please try again.' }
  }
  redirect(data.url)
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Please enter your email address' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password) {
    return { error: 'Please enter a new password' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
