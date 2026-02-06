# Email Authentication - Quick Start

## ✅ What's Been Built

Your Pay Lobster web app now has a complete email authentication system:

- ✅ **NextAuth.js v5** (beta) integration
- ✅ **Magic link emails** via Resend
- ✅ **Firebase Firestore** user database (agent-pay-hq project)
- ✅ **Protected routes** via middleware
- ✅ **Wallet linking** optional after signup
- ✅ **Session management** with database strategy

## 🚀 Setup (5 minutes)

### 1. Update Environment Variables

Edit `.env.local` and add:

```bash
# Generate a secret (run: openssl rand -base64 32)
NEXTAUTH_SECRET=your_random_secret_here

# Get from https://resend.com
RESEND_API_KEY=re_your_api_key_here

# For local dev (optional - uses Resend test mode)
EMAIL_FROM=noreply@paylobster.com

# Firebase service account path
GOOGLE_APPLICATION_CREDENTIALS=/path/to/agent-pay-hq-service-account.json
```

### 2. Get Firebase Service Account

```bash
# 1. Go to Firebase Console
#    https://console.firebase.google.com
#
# 2. Select "agent-pay-hq" project
#
# 3. Settings → Service Accounts → Generate New Private Key
#
# 4. Save JSON file somewhere secure
#
# 5. Set path in .env.local
```

### 3. Get Resend API Key

```bash
# 1. Sign up at https://resend.com
#
# 2. For DEV: You can send to your own email without domain verification
#
# 3. For PROD: Add and verify paylobster.com domain
#
# 4. Generate API key and add to .env.local
```

### 4. Start Dev Server

```bash
npm run dev
```

## 🧪 Testing the Auth Flow

1. **Visit sign in page**
   ```
   http://localhost:3000/auth/signin
   ```

2. **Enter your email**
   - Click "Sign in with Email"
   - Check your inbox for magic link
   - Click link to sign in

3. **Access dashboard**
   ```
   http://localhost:3000/dashboard
   ```
   - Now protected by auth
   - Shows your email
   - Option to link wallet (optional)

4. **Link wallet** (optional)
   - Click "Connect Wallet" in dashboard
   - Connect via RainbowKit
   - Click "Link Wallet" to associate with account

## 📁 File Structure

```
src/
├── lib/
│   ├── auth.ts          ← NextAuth config
│   ├── firebase.ts      ← Firebase Admin setup
│   └── user.ts          ← User management utils
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  ← Auth API handler
│   │   └── user/link-wallet/route.ts    ← Wallet linking API
│   ├── auth/
│   │   ├── signin/page.tsx   ← Sign in page
│   │   ├── verify/page.tsx   ← Email sent confirmation
│   │   └── error/page.tsx    ← Auth errors
│   └── dashboard/page.tsx    ← Protected route example
├── components/
│   └── WalletLinkButton.tsx  ← Reusable wallet link component
├── middleware.ts         ← Route protection
└── types/
    └── auth.ts          ← TypeScript augmentations
```

## 🔐 Protected Routes

These routes automatically redirect to `/auth/signin` if not authenticated:

- `/dashboard` - Main user dashboard
- `/settings` - User settings
- `/history` - Transaction history
- `/credit` - Credit details
- `/analytics` - Analytics page

Add more in `src/middleware.ts`.

## 🎯 Key Features

### Email Authentication
- Magic link (no password needed)
- Automatic account creation
- Session persistence
- `lastLogin` tracking

### Wallet Linking (Optional)
- Users can sign up with email first
- Link wallet later via `/api/user/link-wallet`
- One wallet per account (enforced)
- Check already linked via `session.user.walletAddress`

### Session Access

**Server Components:**
```typescript
import { auth } from '@/lib/auth';

const session = await auth();
if (session?.user) {
  console.log(session.user.email);
  console.log(session.user.walletAddress); // if linked
}
```

**Client Components:**
```typescript
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
if (session?.user) {
  // User is authenticated
}
```

**Sign Out:**
```typescript
import { signOut } from 'next-auth/react';

<button onClick={() => signOut({ callbackUrl: '/' })}>
  Sign Out
</button>
```

## 📦 Database Schema (Firestore)

**Collection: `users`**
```typescript
{
  id: string              // Auto-generated document ID
  email: string           // User's email
  emailVerified: Date     // When email was verified
  displayName?: string    // Optional display name
  walletAddress?: string  // Optional linked wallet
  agentId?: number        // ERC-8004 NFT ID (optional)
  tier: 'free' | 'pro'    // Subscription tier
  createdAt: Date         // Account creation
  lastLogin: Date         // Last sign in
}
```

**Collection: `sessions`**
```typescript
{
  sessionToken: string
  userId: string
  expires: Date
}
```

**Collection: `verification_tokens`**
```typescript
{
  identifier: string  // Email
  token: string       // Magic link token
  expires: Date       // 24h expiry
}
```

## 🛠 API Endpoints

### POST /api/user/link-wallet
Link a wallet address to the authenticated user.

**Request:**
```json
{
  "walletAddress": "0x1234..."
}
```

**Response:**
```json
{
  "success": true
}
```

**Errors:**
- `401` - Not authenticated
- `400` - Invalid wallet address
- `500` - Wallet already linked to another account

## 🚨 Troubleshooting

### Magic link not arriving
- Check Resend dashboard for delivery status
- Look in spam folder
- Verify `RESEND_API_KEY` is correct
- For dev, you can only send to your own email

### Firebase connection error
- Check `GOOGLE_APPLICATION_CREDENTIALS` path
- Verify service account JSON is valid
- Ensure Firestore API is enabled in GCP
- Check project ID is `agent-pay-hq`

### Session not persisting
- Verify `NEXTAUTH_SECRET` is set
- Check cookies are enabled in browser
- Clear browser cookies and try again

### Build errors
- Run `npm install` to ensure all deps are installed
- Check TypeScript errors with `npm run build`
- Verify all imports are correct

## 🎉 You're Done!

Your authentication system is ready. Users can now:

1. Sign up with email (magic link)
2. Access protected dashboard
3. Optionally link wallet for on-chain features
4. Manage sessions and sign out

For detailed documentation, see `AUTH_SETUP.md`.

## 🔜 Next Steps

- [ ] Set up Resend production domain
- [ ] Add user profile editing
- [ ] Implement role-based access control
- [ ] Add social login (Google, Twitter)
- [ ] Set up email templates in Resend
- [ ] Configure Firestore security rules
- [ ] Add user onboarding flow
- [ ] Implement account deletion
