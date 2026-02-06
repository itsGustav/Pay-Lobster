import "next-auth"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    displayName?: string
    walletAddress?: string
    agentId?: number
    tier: 'free' | 'pro'
    createdAt: Date
    lastLogin: Date
  }

  interface Session {
    user: {
      id: string
      walletAddress?: string
      agentId?: number
      tier: 'free' | 'pro'
    } & DefaultSession["user"]
  }
  
  interface JWT {
    id: string
    walletAddress?: string
    agentId?: number
    tier: 'free' | 'pro'
  }
}
