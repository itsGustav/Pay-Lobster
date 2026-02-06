# 🦞 LOBSTER Score Checker - Farcaster Frame

A Farcaster Frame that lets users check their LOBSTER credit score directly in Warpcast.

## Features

- ✅ Check LOBSTER score (300-850 range)
- ✅ View reputation tier (Elite, Premium, Good, Average, New)
- ✅ See transaction count
- ✅ Direct integration with Base mainnet contracts
- ✅ Beautiful gradient UI with responsive design

## Tech Stack

- **Next.js 14+** with App Router
- **Frog Framework** (frog.fm) for Farcaster Frames
- **Viem** for contract reads on Base
- **TypeScript** for type safety

## V3 Contracts (Base Mainnet)

- **Identity:** `0xA174ee274F870631B3c330a85EBCad74120BE662`
- **Reputation:** `0x02bb4132a86134684976E2a52E43D59D89E64b29`
- **Credit:** `0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1`
- **Escrow:** `0x49EdEe04c78B7FeD5248A20706c7a6c540748806`
- **USDC:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Local Development

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create OG image:**
   ```bash
   # Convert og.svg to og.png (1200x630)
   # See public/README.md for instructions
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   - Navigate to `http://localhost:3000`
   - View the frame preview page

5. **Test the frame:**
   - Frame endpoint: `http://localhost:3000/api`
   - Use [Warpcast Frame Validator](https://warpcast.com/~/developers/frames) to test

### Frame Flow

1. **Initial screen:** "🦞 Check Your LOBSTER Score"
2. **Click button:** Frame reads user's connected wallet
3. **Check registration:** Queries Identity contract
4. **Fetch score:** Reads Reputation contract for:
   - Trust score (300-850)
   - Transaction count
5. **Display results:**
   - Score with visual tier indicator
   - Transaction count
   - Call-to-action buttons

### Testing with Frame Validator

1. Go to [Warpcast Frame Validator](https://warpcast.com/~/developers/frames)
2. Enter your local URL: `http://localhost:3000/api`
3. Or use a tunnel service like ngrok:
   ```bash
   ngrok http 3000
   # Use the https URL in the validator
   ```

## Deployment to Vercel

### Option 1: Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow prompts:**
   - Link to existing project or create new
   - Confirm settings
   - Deploy!

### Option 2: Vercel Dashboard

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Framework preset: Next.js (auto-detected)
   - Click "Deploy"

3. **Configure domain:**
   - Add custom domain in Vercel dashboard
   - Update frame metadata with production URL

### Post-Deployment

1. **Test production frame:**
   - Use Warpcast Frame Validator with your production URL
   - Example: `https://your-domain.vercel.app/api`

2. **Share in Warpcast:**
   - Create a cast with your frame URL
   - Users can interact directly in their feed

## Project Structure

```
frame/
├── app/
│   ├── api/
│   │   └── [[...routes]]/
│   │       └── route.ts          # Frog frame handler
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Preview page
├── lib/
│   └── contracts.ts              # Contract ABIs and addresses
├── public/
│   ├── og.svg                    # OG image source
│   └── og.png                    # OG image (generated)
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── vercel.json                   # Vercel deployment config
```

## Environment Variables (Optional)

Create `.env.local` if you need custom configuration:

```env
# Custom RPC endpoint (default: https://mainnet.base.org)
BASE_RPC_URL=https://your-rpc-endpoint.com

# Production URL (for metadata)
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

## Troubleshooting

### Frame not loading in Warpcast
- Verify OG image exists and is 1200x630
- Check that frame endpoint returns valid Frame metadata
- Use Frame Validator to debug

### Contract read errors
- Verify Base RPC is accessible
- Check contract addresses are correct
- Ensure user wallet is connected

### Build errors
- Run `npm install` to ensure dependencies are installed
- Check TypeScript errors: `npm run build`
- Verify Node.js version: `node --version` (should be 18+)

## Resources

- [Frog Framework Docs](https://frog.fm)
- [Farcaster Frames Spec](https://docs.farcaster.xyz/reference/frames/spec)
- [Warpcast Frame Validator](https://warpcast.com/~/developers/frames)
- [Pay Lobster Docs](https://paylobster.com)
- [Base Network](https://base.org)

## License

MIT

## Support

For issues or questions:
- Visit [paylobster.com](https://paylobster.com)
- GitHub Issues: [Pay-Lobster repo]
- Warpcast: [@paylobster]
