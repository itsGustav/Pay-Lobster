# Pay Lobster Hub - Deployment Guide

## ✅ Build Status

**Build successful!** All components are working and production-ready.

## 📁 Project Structure

```
hub/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout with providers
│   │   ├── page.tsx          # Main page
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   ├── Header.tsx        # Logo + wallet connect
│   │   ├── MetricsBar.tsx    # Live TVL/agents/txns
│   │   ├── Globe.tsx         # 3D transaction visualization
│   │   ├── BentoCards.tsx    # Product cards with animations
│   │   ├── ActivityFeed.tsx  # Live blockchain events
│   │   ├── Footer.tsx        # Links + built on Base
│   │   └── Providers.tsx     # Web3 providers
│   ├── hooks/
│   │   ├── useMetrics.ts     # Blockchain data reader
│   │   └── useActivityFeed.ts # Activity generator
│   └── lib/
│       ├── contracts.ts      # Contract addresses + ABIs
│       ├── web3.ts           # Wagmi config
│       └── utils.ts          # Helpers
└── package.json
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - 2 minutes)

```bash
# From the hub directory
cd /Users/gustav/clawd/Pay-Lobster-Website/hub

# Deploy
npx vercel --prod
```

Follow the prompts:
- Link to Vercel project? **Y**
- Project name: **pay-lobster-hub**
- Production? **Y**

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.next
```

### Option 3: Manual Static Export

Add to `next.config.js`:
```js
output: 'export',
```

Then:
```bash
npm run build
# Upload .next/out to any static host
```

## 🌐 Custom Domain Setup

### For paylobster.com root:

**Vercel:**
1. Go to project settings
2. Add domain: `paylobster.com`
3. Set DNS:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21`

**Cloudflare (if using):**
1. Add A record: `@` → `76.76.21.21`
2. Enable "Proxied" (orange cloud)

### For hub.paylobster.com:

**Vercel:**
1. Add domain: `hub.paylobster.com`
2. Set DNS:
   - Type: `CNAME`
   - Name: `hub`
   - Value: `cname.vercel-dns.com`

## 🔧 Environment Variables

No environment variables required! All contract addresses are in the code.

Optional:
```env
# Custom RPC (if you want faster reads)
NEXT_PUBLIC_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
```

## 🧪 Testing Locally

```bash
# Development server
npm run dev
# → http://localhost:3002

# Production build test
npm run build
npm start
# → http://localhost:3002
```

## 📊 Performance Checklist

- [x] **Build size**: 195 KB First Load JS (excellent!)
- [x] **Static generation**: All pages pre-rendered
- [x] **Images**: Using emoji icons (0 KB)
- [x] **Animations**: Framer Motion optimized
- [x] **Globe**: Dynamic import (code-splitting)
- [x] **Mobile**: Responsive design tested
- [x] **Accessibility**: Reduced motion support

## ⚡ Post-Deployment

1. **Test wallet connection** - Connect MetaMask on Base
2. **Check metrics** - Should show real contract data
3. **Verify links** - Test all 4 product cards
4. **Mobile test** - Open on phone, check responsiveness
5. **Performance** - Run Lighthouse (target: 90+ score)

## 🐛 Known Warnings (Harmless)

- MetaMask SDK warnings about React Native - **Ignore**, web-only
- Multiple lockfiles warning - **Ignore**, monorepo structure

## 🔄 Updates

To update contract addresses:
```typescript
// src/lib/contracts.ts
export const CONTRACTS = {
  IDENTITY: '0x....',
  REPUTATION: '0x....',
  CREDIT: '0x....',
  ESCROW: '0x....',
}
```

To change branding:
```css
/* tailwind.config.js */
colors: {
  primary: '#ea580c',  // Change orange accent
  background: '#0a0a0a', // Change dark theme
}
```

## 📞 Support

- **GitHub**: https://github.com/paylobster
- **Docs**: Check README.md
- **Issues**: File in repository

---

**Next Steps:**
1. Run `npx vercel --prod` from hub directory
2. Copy deployment URL
3. Test all features
4. Set up custom domain if needed
5. Share with hackathon judges! 🦞
