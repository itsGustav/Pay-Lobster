import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import type { NextAuthConfig } from "next-auth"

// Base config for middleware (Edge Runtime compatible - no adapter)
export const authConfig: NextAuthConfig = {
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "Pay Lobster <noreply@paylobster.com>",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isOnSettings = nextUrl.pathname.startsWith('/settings')
      const isOnHistory = nextUrl.pathname.startsWith('/history')
      const isOnCredit = nextUrl.pathname.startsWith('/credit')
      const isOnAnalytics = nextUrl.pathname.startsWith('/analytics')

      if (isOnDashboard || isOnSettings || isOnHistory || isOnCredit || isOnAnalytics) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      }
      return true
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
