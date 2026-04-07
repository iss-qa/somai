import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'soma_ai_secret_key_2026'
)

const PROTECTED_PATHS = ['/app', '/admin']
const ADMIN_PATHS = ['/admin']
const AUTH_PATHS = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('soma-token')?.value

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p))
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p))

  // If on login page with valid token, redirect to dashboard
  if (isAuth && token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      return NextResponse.redirect(new URL('/app/dashboard', request.url))
    } catch {
      // Token invalid, let them stay on login
      const response = NextResponse.next()
      response.cookies.delete('soma-token')
      return response
    }
  }

  // If accessing protected route without token, redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token for protected routes
  if (isProtected && token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)

      // Admin routes require superadmin or support role
      if (isAdmin) {
        const role = payload.role as string
        if (role !== 'superadmin' && role !== 'support') {
          return NextResponse.redirect(new URL('/app/dashboard', request.url))
        }
      }

      // Add user info to headers for downstream use
      const response = NextResponse.next()
      response.headers.set('x-user-id', payload.sub as string)
      response.headers.set('x-user-role', payload.role as string)
      if (payload.companyId) {
        response.headers.set('x-company-id', payload.companyId as string)
      }
      return response
    } catch {
      // Token invalid
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('soma-token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*', '/login', '/register'],
}
