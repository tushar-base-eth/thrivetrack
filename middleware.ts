/**
 * Authentication Middleware
 *
 * Handles authentication for all routes except public ones.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Create a response object
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Always forward cookies to the response
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Always forward cookies to the response
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get the session from the server
  const { data: { session } } = await supabase.auth.getSession()

  // For API routes, we just ensure cookies are passed along
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Clone the request headers and add the auth cookie for API routes
    const requestHeaders = new Headers(request.headers)
    if (session?.access_token) {
      requestHeaders.set('Authorization', `Bearer ${session.access_token}`)
    }
    
    // Return with the updated request headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // For protected routes, redirect to login if not authenticated
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isPublicRoute = 
    request.nextUrl.pathname === '/' || 
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/manifest.webmanifest') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.includes('.')

  if (!session && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // If on auth route and already logged in, redirect to dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
