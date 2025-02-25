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

import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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
        set(name: string, value: string, options: any) {
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
        remove(name: string, options: any) {
          request.cookies.delete({
            name,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Check auth condition
  if (session) {
    // If the user is signed in and tries to access auth pages, redirect them to home
    if (request.nextUrl.pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  } else {
    // If the user is not signed in and tries to access protected routes, redirect them to auth
    if (
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/history") ||
      request.nextUrl.pathname.startsWith("/settings")
    ) {
      const redirectUrl = new URL("/auth", request.url)
      redirectUrl.searchParams.set("next", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
