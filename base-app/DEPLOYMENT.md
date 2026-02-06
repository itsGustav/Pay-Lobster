# Pay Lobster PWA - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables

Create a `.env.production` file with:

```bash
# Required: Get from Coinbase Developer Platform
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_production_api_key

# Optional but recommended
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id

# Production URL
NEXT_PUBLIC_APP_URL=https://app.paylobster.com

# For push notifications (if implementing)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 2. Icon Assets

Replace placeholder icons with actual branded assets:
- `/public/icon-192.png` (192×192 PNG)
- `/public/icon-512.png` (512×512 PNG)
- `/public/badge-72.png` (72×72 PNG, for notification badge)
- `/public/screenshot-mobile.png` (390×844 PNG, for app store)

Use the lobster emoji 🦞 or Pay Lobster brand colors:
- Primary: `#ea580c` (orange-600)
- Secondary: `#dc2626` (red-600)
- Background: `#0a0a0a` (neutral-950)

### 3. Domain & SSL

- Buy domain (e.g., `app.paylobster.com`)
- Configure DNS to point to your hosting provider
- SSL certificate (automatic on Vercel/Netlify)

---

## Deployment Options

### Option 1: Vercel (Recommended)

**Pros**: Zero-config, automatic PWA optimization, edge functions

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd /Users/gustav/clawd/Pay-Lobster-Website/base-app
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_ONCHAINKIT_API_KEY production
   # Paste your API key when prompted
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

6. **Custom Domain**:
   - Go to Vercel dashboard
   - Add domain: `app.paylobster.com`
   - Update DNS as instructed

### Option 2: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Build the app**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

4. **Configure**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Add environment variables in Netlify dashboard

### Option 3: Self-Hosted (VPS/Docker)

**Requirements**: Node.js 18+, nginx, PM2

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Start with PM2**:
   ```bash
   pm2 start npm --name "paylobster-pwa" -- start
   pm2 save
   pm2 startup
   ```

3. **Nginx reverse proxy** (`/etc/nginx/sites-available/paylobster`):
   ```nginx
   server {
       listen 80;
       server_name app.paylobster.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # PWA files
       location ~* ^/(manifest\.json|sw\.js|workbox-.*\.js)$ {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           add_header Cache-Control "public, max-age=0, must-revalidate";
       }
   }
   ```

4. **Enable SSL with Let's Encrypt**:
   ```bash
   sudo certbot --nginx -d app.paylobster.com
   ```

---

## Post-Deployment

### 1. Test PWA Installability

**iOS (Safari)**:
1. Open app in Safari
2. Check for "Add to Home Screen" option
3. Install and verify it opens fullscreen

**Android (Chrome)**:
1. Open app in Chrome
2. Look for install prompt
3. Or: Menu → "Install app"

**Desktop (Chrome)**:
1. Look for install icon in address bar
2. Click to install

### 2. Verify Smart Wallet

1. Connect wallet
2. Test passkey creation (Face ID/Touch ID)
3. Send test transaction (small amount)
4. Check gas sponsorship is working

### 3. Test Core Features

- ✅ Dashboard loads LOBSTER score
- ✅ Send USDC transaction completes
- ✅ Escrow creation works
- ✅ Agent trust check displays data
- ✅ Notifications permission prompt appears

### 4. Performance Audit

Run Lighthouse audit:
```bash
npx lighthouse https://app.paylobster.com --view
```

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+
- PWA: 100

### 5. Base.org Listing

Submit to Base ecosystem directory:

1. Go to [base.org/ecosystem](https://base.org/ecosystem)
2. Click "Submit Project"
3. Fill in details:
   - **Name**: Pay Lobster
   - **Category**: DeFi, Infrastructure
   - **Description**: Decentralized escrow and AI agent trust scoring on Base
   - **URL**: https://app.paylobster.com
   - **Twitter**: @PayLobster
   - **Contracts**: 
     - Escrow: `0x49EdEe04c78B7FeD5248A20706c7a6c540748806`
     - Reputation: `0x02bb4132a86134684976E2a52E43D59D89E64b29`
     - Credit: `0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1`
   - **PWA**: Yes
   - **Smart Wallet Support**: Yes (Coinbase)

---

## Push Notifications Setup

### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Save output to `.env.production`:
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public_key>
VAPID_PRIVATE_KEY=<private_key>
```

### Backend Integration

Create push notification service (in separate backend or serverless function):

```typescript
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@paylobster.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Send notification
export async function sendNotification(
  subscription: PushSubscription,
  payload: {
    title: string;
    body: string;
    url?: string;
  }
) {
  await webpush.sendNotification(
    subscription,
    JSON.stringify(payload)
  );
}
```

### Contract Event Listeners

Set up listeners for escrow events:

```typescript
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const client = createPublicClient({
  chain: base,
  transport: http(),
});

// Listen for escrow funded events
client.watchContractEvent({
  address: ESCROW_CONTRACT,
  abi: ESCROW_ABI,
  eventName: "EscrowFunded",
  onLogs: (logs) => {
    logs.forEach(async (log) => {
      const { recipient } = log.args;
      
      // Get user's push subscription from DB
      const subscription = await getUserSubscription(recipient);
      
      if (subscription) {
        await sendNotification(subscription, {
          title: "Escrow Funded! 🦞",
          body: "Your escrow has been funded",
          url: "/escrow",
        });
      }
    });
  },
});
```

---

## Monitoring

### Analytics

Add analytics to track PWA usage:

**app/layout.tsx**:
```typescript
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Error Tracking

Use Sentry for error monitoring:

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## Maintenance

### Regular Updates

- Update dependencies monthly: `npm update`
- Check for Next.js updates: `npx @next/codemod upgrade latest`
- Monitor contract upgrades (if any)

### Backup Strategy

- Database backups (if storing push subscriptions)
- Environment variable backups
- Git tags for each production release

### Security

- Rotate API keys quarterly
- Review contract interactions
- Audit dependencies: `npm audit`
- Keep SSL certificates valid

---

## Troubleshooting

### PWA Not Installing

- Ensure HTTPS is enabled (or localhost for testing)
- Check `manifest.json` is accessible
- Verify service worker registers
- Clear cache and try again

### Wallet Connection Issues

- Verify OnchainKit API key is valid
- Check Base RPC is responding
- Test with different browsers
- Ensure user is on Base mainnet

### Transaction Failures

- Check USDC balance
- Verify contract addresses
- Ensure correct network (Base mainnet)
- Check gas prices

---

## Support

For deployment issues:
- **Docs**: https://docs.paylobster.com
- **Discord**: https://discord.gg/paylobster
- **Email**: support@paylobster.com

For Base-specific help:
- **Base Docs**: https://docs.base.org
- **Base Discord**: https://discord.gg/buildonbase
