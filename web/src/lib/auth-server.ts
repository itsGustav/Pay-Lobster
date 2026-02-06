// Server-only auth config with Firebase adapter (Node.js runtime)
import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import type { NextAuthConfig } from "next-auth"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { initAdmin } from "./firebase"

export const authServerConfig: NextAuthConfig = {
  adapter: FirestoreAdapter(initAdmin()) as any,
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "noreply@paylobster.com",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      // Add custom user properties to session
      if (session.user) {
        session.user.id = user.id;
        // @ts-ignore - Add custom fields
        session.user.walletAddress = user.walletAddress;
        // @ts-ignore
        session.user.agentId = user.agentId;
        // @ts-ignore
        session.user.tier = user.tier || 'free';
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore
        token.walletAddress = user.walletAddress;
        // @ts-ignore
        token.agentId = user.agentId;
        // @ts-ignore
        token.tier = user.tier || 'free';
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      // Update lastLogin when user is created
      const db = initAdmin();
      await db.collection('users').doc(user.id).update({
        lastLogin: new Date(),
        createdAt: new Date(),
        tier: 'free',
      });
    },
    async signIn({ user }) {
      // Update lastLogin on each sign in
      const db = initAdmin();
      await db.collection('users').doc(user.id!).update({
        lastLogin: new Date(),
      });
    },
  },
  session: {
    strategy: "jwt", // JWT sessions for Edge Runtime compatibility
  },
}

export const authServer = NextAuth(authServerConfig)
