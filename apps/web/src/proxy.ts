import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const session = await auth()
  const { pathname } = req.nextUrl
  const isLoggedIn = !!session

  const isAdminRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/workshops') ||
    pathname.startsWith('/assignments') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/departments') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/billing') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/leaderboard')

  const isLearnerRoute = pathname.startsWith('/learn')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')
  const role = (session as { user?: { role?: string } })?.user?.role

  if (isAuthRoute && isLoggedIn) {
    if (role === 'learner') return NextResponse.redirect(new URL('/learn/dashboard', req.url))
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if ((isAdminRoute || isLearnerRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAdminRoute && role === 'learner') {
    return NextResponse.redirect(new URL('/learn/dashboard', req.url))
  }

  if (isLearnerRoute && (role === 'org_admin' || role === 'manager')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
