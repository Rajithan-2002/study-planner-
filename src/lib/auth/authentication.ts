'use server'

import { createClient } from '@/utils/supabase/server'

// ─── Authentication Service ───────────────────────────────────────────────────
// Centralized wrapper around Supabase Auth for all auth operations.
// Business logic modules never call supabase.auth directly — they go through here.

export interface AuthUser {
  id: string
  email: string
  emailConfirmedAt: string | null
  provider: string
  lastSignIn: string | null
  metadata: Record<string, any>
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
}

function mapUser(raw: any): AuthUser {
  return {
    id: raw.id,
    email: raw.email ?? '',
    emailConfirmedAt: raw.email_confirmed_at ?? null,
    provider: raw.app_metadata?.provider ?? 'email',
    lastSignIn: raw.last_sign_in_at ?? null,
    metadata: raw.user_metadata ?? {}
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return mapUser(user)
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHORIZED: Authentication required')
  }
  return user
}

export async function isEmailVerified(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!(user?.emailConfirmedAt)
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return { success: false, error: error?.message ?? 'Login failed' }
  }
  return { success: true, user: mapUser(data.user) }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function signUpWithPassword(
  email: string,
  password: string,
  metadata: { full_name: string; university: string; graduation_year: number }
): Promise<AuthResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
    }
  })
  if (error || !data.user) {
    return { success: false, error: error?.message ?? 'Signup failed' }
  }
  return { success: true, user: mapUser(data.user) }
}

export async function verifyEmailOtp(email: string, token: string): Promise<AuthResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  })
  if (error || !data.user) {
    return { success: false, error: error?.message ?? 'Invalid or expired OTP' }
  }
  return { success: true, user: mapUser(data.user) }
}

export async function resendVerificationEmail(email: string): Promise<AuthResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function sendPasswordResetEmail(email: string): Promise<AuthResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  if (error || !data.user) {
    return { success: false, error: error?.message ?? 'Failed to update password' }
  }
  return { success: true, user: mapUser(data.user) }
}

export async function getGoogleOAuthUrl(): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' }
    }
  })
  if (error || !data.url) return null
  return data.url
}
