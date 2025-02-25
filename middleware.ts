/**
 * Authentication Middleware
 *
 * Currently disabled to allow direct access to all pages during development.
 * Will be re-enabled later for production.
 */

import { NextResponse } from "next/server"

export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: []
}
