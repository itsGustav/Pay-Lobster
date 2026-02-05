# Pay Lobster Donation API

Real Circle USDC payment endpoint for the Pay Lobster donation box.

## Setup

### 1. Get Circle Credentials

1. Sign up at [console.circle.com](https://console.circle.com)
2. Create a Developer Controlled Wallet
3. Get your API Key and Entity Secret

### 2. Configure Vercel Environment Variables

```bash
vercel env add CIRCLE_API_KEY
vercel env add CIRCLE_ENTITY_SECRET
vercel env add CIRCLE_WALLET_ID
```

### 3. Enable Real Payments

In `api/donate.ts`, uncomment the Circle API integration code (around line 55).

### 4. Deploy

```bash
cd /tmp/usdc-agent
vercel --yes --prod
```

## Testing Locally

```bash
vercel dev
```

Then test with:

```bash
curl -X POST http://localhost:3000/api/donate \
  -H "Content-Type: application/json" \
  -d '{"amount": 25}'
```

## Current Status

✓ MAINNET LIVE badge shown
✓ Dancing lobster animation on success
✓ Amount selection ($5/$10/$25/$50)
✓ Wallet address: 0xf775f0224A680E2915a066e53A389d0335318b7B

⚠️ Currently returns simulated transactions
→ Uncomment Circle API code once credentials are configured
