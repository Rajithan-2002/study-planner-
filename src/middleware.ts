import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── Public Routes ────────────────────────────────────────────────────────────
// These paths do not require authentication.
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/verify-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — MUST call getUser() not getSession() per Supabase SSR docs
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some(r => path === r || path.startsWith(r + '?'))
  const isStaticAsset = path.startsWith('/_next') || path.includes('.')
  const isApiRoute = path.startsWith('/api')

  // ─── Protect API Routes ──────────────────────────────────────────────────
  // Return 401 JSON instead of redirecting (for client fetch calls)
  if (!user && isApiRoute) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // ─── Protect App Routes ──────────────────────────────────────────────────
  if (!user && !isPublicRoute && !isStaticAsset) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(loginUrl)
  }

  // ─── Prevent Authenticated Users From Seeing Auth Pages ─────────────────
  if (user && isPublicRoute && path !== '/auth/callback') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
