import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('UNAUTHORIZED: No active session. Please sign in.')
  }
  return user.id
}

export async function logActivity(action: string, entityType?: string, entityId?: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null
    })
  } catch (e) {
    console.error('Failed to log activity:', e)
  }
}
