import { createClient } from '@/utils/supabase/server'

// ─── Session Manager ──────────────────────────────────────────────────────────
// Typed session utilities. Never call supabase.auth.getSession() directly —
// always use supabase.auth.getUser() per Supabase SSR best practices.

export interface SessionMetadata {
  userId: string
  email: string
  provider: string
  lastSignIn: string | null
  createdAt: string | null
  emailConfirmed: boolean
  avatarUrl: string | null
  fullName: string | null
}

export async function getSessionMetadata(): Promise<SessionMetadata | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  return {
    userId: user.id,
    email: user.email ?? '',
    provider: user.app_metadata?.provider ?? 'email',
    lastSignIn: user.last_sign_in_at ?? null,
    createdAt: user.created_at ?? null,
    emailConfirmed: !!user.email_confirmed_at,
    avatarUrl: user.user_metadata?.avatar_url ?? null,
    fullName: user.user_metadata?.full_name ?? null
  }
}

export async function isSessionValid(): Promise<boolean> {
  const meta = await getSessionMetadata()
  return meta !== null
}

export async function getActiveProvider(): Promise<'email' | 'google' | null> {
  const meta = await getSessionMetadata()
  if (!meta) return null
  if (meta.provider === 'google') return 'google'
  return 'email'
}
