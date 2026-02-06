// Middleware now uses JWT sessions (Edge Runtime compatible)
// Database sessions are still used for API routes via auth-server.ts

import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Protect dashboard and other authenticated routes
  const protectedRoutes = ['/dashboard', '/settings', '/history', '/credit', '/analytics']
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtected && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/history/:path*',
    '/credit/:path*',
    '/analytics/:path*',
  ],
}
