# Email Authentication Setup

This project uses NextAuth.js v5 (beta) with email magic links via Resend and Firebase Firestore as the database.

## Architecture

- **NextAuth.js**: Authentication framework
- **Resend**: Email provider for magic links
- **Firebase Firestore**: User database (project: `agent-pay-hq`)
- **RainbowKit**: Optional wallet connection (can be linked after signup)

## Setup Instructions

### 1. Environment Variables

Copy the example values from `.env.local` and fill in your credentials:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000  # Change for production
NEXTAUTH_SECRET=$(openssl rand -base64 32)  # Generate a random secret

# Resend (get API key from https://resend.com)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@paylobster.com  # Must be a verified domain in Resend

# Firebase (agent-pay-hq project)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
# OR set FIREBASE_PROJECT_ID=agent-pay-hq and configure default credentials
```

### 2. Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select `agent-pay-hq` project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file securely
6. Set `GOOGLE_APPLICATION_CREDENTIALS` to the file path

### 3. Resend Setup

1. Sign up at [Resend](https://resend.com)
2. Add and verify your domain (`paylobster.com`)
3. Generate an API key
4. Add to `.env.local` as `RESEND_API_KEY`

**Note:** For development, Resend allows sending to your own email without domain verification.

### 4. Firestore Collections

The adapter will automatically create these collections:

- `users` - User accounts
- `sessions` - Active sessions
- `accounts` - Linked authentication methods
- `verification_tokens` - Magic link tokens

**User Schema:**

```typescript
{
  id: string              // Auto-generated
  email: string           // Primary identifier
  emailVerified: Date     // Set on first login
  displayName?: string    // Optional display name
  walletAddress?: string  // Optional, linked via API
  agentId?: number        // ERC-8004 NFT ID
  tier: 'free' | 'pro'    // Subscription tier
  createdAt: Date
  lastLogin: Date
}
```

## Usage

### Sign In

Users can sign in at `/auth/signin` with:
- Email (magic link)
- Wallet (RainbowKit - optional)

### Protecting Routes

Routes are protected via middleware (`middleware.ts`):

```typescript
// Protected routes: /dashboard, /settings, /history, /credit, /analytics
// Unauthenticated users redirect to /auth/signin
```

### Linking Wallet

Users can link their wallet after email signup:

```typescript
// POST /api/user/link-wallet
{
  "walletAddress": "0x..."
}
```

### Session Access

```typescript
import { auth } from '@/lib/auth';

// Server component
const session = await auth();

// Client component
import { useSession } from 'next-auth/react';
const { data: session } = useSession();
```

## API Endpoints

- `GET/POST /api/auth/[...nextauth]` - NextAuth handler
- `POST /api/user/link-wallet` - Link wallet to account

## Files Structure

```
src/
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   ├── firebase.ts      # Firebase Admin SDK setup
│   └── user.ts          # User management utilities
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/route.ts
│   │   └── user/
│   │       └── link-wallet/route.ts
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   ├── verify/page.tsx
│   │   └── error/page.tsx
│   └── dashboard/page.tsx  # Protected route example
├── middleware.ts        # Route protection
└── types/
    └── auth.ts          # TypeScript types
```

## Testing

1. Start dev server: `npm run dev`
2. Visit `http://localhost:3000/auth/signin`
3. Enter your email
4. Check email for magic link
5. Click link to sign in
6. Redirects to `/dashboard`

## Production Checklist

- [ ] Generate secure `NEXTAUTH_SECRET`
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Verify domain in Resend
- [ ] Update `EMAIL_FROM` to verified domain
- [ ] Add Firebase service account credentials
- [ ] Set up Firestore security rules
- [ ] Configure CORS if needed
- [ ] Test magic link flow end-to-end

## Security Notes

- Magic links expire after 24 hours (NextAuth default)
- Sessions are stored in Firestore (database strategy)
- CSRF protection enabled by default
- Wallet addresses are validated before linking
- One wallet per account (enforced in API)

## Troubleshooting

**Magic link not arriving:**
- Check Resend dashboard for delivery status
- Verify domain is configured correctly
- Check spam folder

**Firebase connection errors:**
- Verify service account JSON is valid
- Check `GOOGLE_APPLICATION_CREDENTIALS` path
- Ensure Firestore API is enabled in GCP

**Session not persisting:**
- Check `NEXTAUTH_SECRET` is set
- Verify cookies are enabled
- Check browser console for errors

## Future Enhancements

- [ ] Social login (Google, Twitter)
- [ ] Email/password option
- [ ] Two-factor authentication
- [ ] Account recovery flow
- [ ] Admin dashboard for user management
