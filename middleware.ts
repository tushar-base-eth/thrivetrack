/**
 * Authentication Middleware
 *
 * Handles route protection and authentication redirects.
 * Ensures users are authenticated before accessing protected routes
 * and redirects authenticated users away from auth pages.
 *
 * Features:
 * - Route protection
 * - Authentication state checks
 * - Redirect handling
 *
 * UX Considerations:
 * - Seamless authentication flow
 * - Prevents unauthorized access
 * - Maintains proper navigation state
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Check auth condition
  if (session) {
    // If the user is signed in and the current path is /auth, redirect to /
    if (request.nextUrl.pathname === "/auth") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  } else {
    // If the user is not signed in and the current path is not /auth or /auth/callback,
    // redirect to /auth
    if (
      !request.nextUrl.pathname.startsWith("/auth") ||
      (request.nextUrl.pathname === "/auth/callback" && !request.nextUrl.searchParams.has("code"))
    ) {
      const redirectUrl = request.nextUrl.pathname
      return NextResponse.redirect(
        new URL(`/auth?redirectTo=${redirectUrl}`, request.url)
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.webmanifest (PWA manifest)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)",
  ],
}
