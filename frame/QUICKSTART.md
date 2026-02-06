# 🦞 LOBSTER Frame Quick Start

Get your Farcaster Frame running in 5 minutes!

## 1. Install Dependencies

```bash
cd /Users/gustav/clawd/Pay-Lobster-Website/frame
npm install
```

## 2. Run Locally

```bash
npm run dev
```

Opens on `http://localhost:3001`

## 3. Test the Frame

### Option A: Local Testing with ngrok

```bash
# Terminal 1: Keep dev server running
npm run dev

# Terminal 2: Start tunnel
ngrok http 3001

# Copy the https URL and test in Frame Validator
# https://warpcast.com/~/developers/frames
```

### Option B: Deploy to Vercel

```bash
# One command deploy
npx vercel

# Or for production
npx vercel --prod
```

## 4. Share in Warpcast

Create a cast with your frame URL:
```
https://your-domain.vercel.app/api
```

## That's It! 🎉

### Next Steps:

- 📖 Read [TESTING.md](./TESTING.md) for detailed testing
- 🚀 See [DEPLOY.md](./DEPLOY.md) for deployment guide
- 📚 Check [README.md](./README.md) for full documentation

### Frame Endpoints:

- **Frame:** `/api` (Farcaster entry point)
- **Preview:** `/` (landing page)
- **OG Images:** `/api/og?type=...` (dynamic images)

### Contracts (Base Mainnet):

```
Identity:   0xA174ee274F870631B3c330a85EBCad74120BE662
Reputation: 0x02bb4132a86134684976E2a52E43D59D89E64b29
```

### Need Help?

- Frame Validator: https://warpcast.com/~/developers/frames
- Frog Docs: https://frog.fm
- Pay Lobster: https://paylobster.com

Happy framing! 🦞✨
