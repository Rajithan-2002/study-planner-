import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { WorkspaceInitializer } from '@/lib/auth/workspace-initializer'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type')

  // ─── Password Reset Deep Link ─────────────────────────────────────────────
  // When user clicks reset link from email, Supabase sends type=recovery
  if (type === 'recovery') {
    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
    }
    return NextResponse.redirect(`${origin}/auth/forgot-password?error=reset_link_expired`)
  }

  // ─── OAuth & Email Confirmation Callback ──────────────────────────────────
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Initialize workspace (idempotent — safe for returning users too)
        await WorkspaceInitializer.initialize(user.id, {
          email: user.email,
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
          university: user.user_metadata?.university,
          graduation_year: user.user_metadata?.graduation_year
            ? Number(user.user_metadata.graduation_year)
            : undefined
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
