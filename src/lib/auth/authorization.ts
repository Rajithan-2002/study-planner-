import { requireAuth, getCurrentUser, isEmailVerified } from './authentication'

// ─── Authorization Guards ─────────────────────────────────────────────────────
// Call these at the top of every Server Action or API route handler.
// Never trust client-provided user IDs. Always derive identity from session.

export interface AuthorizationContext {
  userId: string
  email: string
  provider: string
}

/**
 * Require a valid authenticated session.
 * Throws 'UNAUTHORIZED' if no session exists.
 * Use this in every server action.
 */
export async function requireAuthentication(): Promise<AuthorizationContext> {
  const user = await requireAuth()
  return {
    userId: user.id,
    email: user.email,
    provider: user.provider
  }
}

/**
 * Require a verified email address.
 * Throws 'EMAIL_NOT_VERIFIED' if email is unconfirmed.
 */
export async function requireVerifiedEmail(): Promise<AuthorizationContext> {
  const ctx = await requireAuthentication()
  const verified = await isEmailVerified()
  if (!verified) {
    throw new Error('EMAIL_NOT_VERIFIED: Please verify your email address before continuing')
  }
  return ctx
}

/**
 * Require that the user has a complete profile in public.users.
 * Throws 'PROFILE_INCOMPLETE' if profile does not exist.
 */
export async function requireProfileCompletion(): Promise<AuthorizationContext> {
  const ctx = await requireAuthentication()
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('id').eq('id', ctx.userId).maybeSingle()
  if (!data) {
    throw new Error('PROFILE_INCOMPLETE: User profile not found')
  }
  return ctx
}

/**
 * Future-ready RBAC interface.
 * Currently always returns true if user is authenticated.
 * Expand when role system is implemented in Sprint 6B.
 */
export async function requireRole(role: 'ADMIN' | 'USER' | 'GUEST'): Promise<AuthorizationContext> {
  const ctx = await requireAuthentication()
  // TODO (Sprint 6B): Fetch user role from database and validate
  // For now, all authenticated users have 'USER' role
  if (role === 'ADMIN') {
    throw new Error('FORBIDDEN: Admin role is not yet implemented')
  }
  return ctx
}

/**
 * Safely get current user context without throwing.
 * Returns null if unauthenticated.
 * Use in optional-auth scenarios.
 */
export async function getOptionalAuthContext(): Promise<AuthorizationContext | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return {
    userId: user.id,
    email: user.email,
    provider: user.provider
  }
}
