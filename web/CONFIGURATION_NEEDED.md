# 🔧 Configuration Needed - Email Auth System

**Status:** ✅ Code Complete | ⏳ Configuration Pending

---

## What's Already Built

The entire email authentication system is **fully implemented** and **build-passing**:

✅ NextAuth.js v5 with magic links  
✅ Resend email provider integration  
✅ Firebase Firestore user database  
✅ Protected routes middleware  
✅ Sign in/out pages  
✅ Wallet linking API  
✅ Session management  
✅ Complete documentation  

**All you need to do is add API keys!**

---

## 🎯 Next Steps (10 minutes)

### Step 1: Get Resend API Key (2 min)

1. Visit https://resend.com
2. Sign up or log in
3. Go to API Keys
4. Create new API key
5. Copy the key (starts with `re_`)

**Add to `.env.local`:**
```bash
RESEND_API_KEY=re_your_actual_key_here
```

---

### Step 2: Set Up Firebase (5 min)

You have **3 options**:

#### Option A: Use agent-pay-hq (if accessible)

1. Log in with `gustav@agentpay-hq.com`:
   ```bash
   firebase login:add
   ```

2. Go to [Firebase Console](https://console.firebase.google.com/)

3. Select **agent-pay-hq** project

4. Navigate to: **Settings** → **Service Accounts**

5. Click **Generate New Private Key**

6. Download the JSON file

7. Save it securely (e.g., `~/.config/firebase/agent-pay-hq-service-account.json`)

8. Add to `.env.local`:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/Users/gustav/.config/firebase/agent-pay-hq-service-account.json
   ```

#### Option B: Use Existing Project (fastest)

Use one of your available projects:
- `gustav-collaboration`
- `gustav-hub`
- `openclawhq`

1. Get service account JSON (same steps as Option A)

2. Update `.env.local`:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   ```

3. Update `src/lib/firebase.ts` if needed (project ID)

#### Option C: Create agent-pay-hq Project

```bash
firebase projects:create agent-pay-hq --display-name "Agent Pay HQ"
```

Then follow Option A steps.

---

### Step 3: Test Locally (3 min)

1. Start the dev server:
   ```bash
   cd /Users/gustav/clawd/Pay-Lobster-Website/web
   npm run dev
   ```

2. Visit http://localhost:3000/auth/signin

3. Enter your email

4. Check inbox for magic link

5. Click link → should create account and redirect to dashboard

6. Test wallet linking (optional)

---

## 📋 Configuration Checklist

- [ ] **Resend API key** added to `.env.local`
- [ ] **Firebase service account** JSON downloaded
- [ ] **GOOGLE_APPLICATION_CREDENTIALS** path set in `.env.local`
- [ ] **Test signup flow** - email received
- [ ] **Test login flow** - magic link works
- [ ] **Test protected routes** - redirects to signin
- [ ] **Test wallet linking** (optional)

---

## 🚀 Production Deployment

Before deploying to production:

### 1. Verify Email Domain (Resend)

- Add `paylobster.com` to Resend
- Complete DNS verification (SPF, DKIM)
- Test email delivery from production domain

### 2. Update Environment Variables

```bash
NEXTAUTH_URL=https://paylobster.com  # Production domain
RESEND_API_KEY=re_prod_key_here      # Production key
```

### 3. Set Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only authenticated users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sessions collection - managed by NextAuth adapter
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    // Accounts collection - managed by NextAuth adapter
    match /accounts/{accountId} {
      allow read, write: if request.auth != null;
    }
    
    // Verification tokens - public read for magic links
    match /verification_tokens/{tokenId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Apply rules:
```bash
firebase deploy --only firestore:rules
```

---

## 🔑 Environment Variables Reference

### Local Development (.env.local)

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=uEREHwV3nqqNFFnKwcDMquSSqO5FTEoPgtby2lq7hp8=

# Resend
RESEND_API_KEY=re_your_dev_key
EMAIL_FROM=noreply@paylobster.com

# Firebase
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# WalletConnect (already set)
NEXT_PUBLIC_WALLET_CONNECT_ID=pay-lobster-demo
```

### Production (Vercel/Environment)

```bash
NEXTAUTH_URL=https://paylobster.com
NEXTAUTH_SECRET=<generate-new-secret>
RESEND_API_KEY=re_prod_key
EMAIL_FROM=noreply@paylobster.com

# For Vercel, use environment variables instead of file:
FIREBASE_PROJECT_ID=agent-pay-hq
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@agent-pay-hq.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 📖 Documentation Available

| File | Purpose |
|------|---------|
| `QUICKSTART.md` | 5-minute setup guide |
| `AUTH_SETUP.md` | Technical documentation |
| `COMPLETED.md` | Build summary |
| `TODO.md` | Future enhancements |
| `.env.local.example` | Configuration template |

---

## ❓ Troubleshooting

### Magic link not arriving?

1. Check Resend dashboard for delivery status
2. Verify `EMAIL_FROM` matches verified domain
3. Check spam folder
4. Try different email address

### Firebase connection error?

1. Verify service account JSON path is correct
2. Check file permissions (`chmod 600`)
3. Ensure project ID matches
4. Verify Firestore is enabled in Firebase Console

### Build errors?

The build was already tested and passes. If you see errors:

```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Session not persisting?

1. Check browser cookies are enabled
2. Verify `NEXTAUTH_SECRET` is set
3. Clear browser cookies and try again

---

## 🎉 That's It!

Once you add the **Resend API key** and **Firebase credentials**, the system is ready to go!

**Total setup time: ~10 minutes**

---

## Questions?

- Check existing docs (`QUICKSTART.md`, `AUTH_SETUP.md`)
- Review code comments in `src/lib/auth.ts`
- Test with `npm run dev` and visit `/auth/signin`

**Everything else is already done!** 🚀
