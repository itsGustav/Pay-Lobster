# Pay Lobster Base PWA

A Progressive Web App for Pay Lobster's decentralized escrow and trust protocol on Base, featuring Coinbase Smart Wallet integration with passkey authentication.

## Features

- 🦞 **LOBSTER Score Dashboard**: View your trust score, reputation vectors, and credit rating
- 💸 **Send USDC**: Instant transfers on Base with gas sponsorship
- 🔒 **Create Escrow**: Secure payments with release conditions
- 🤖 **Agent Trust Check**: Verify AI agent reputation before transacting
- 🔔 **Push Notifications**: Real-time updates on escrow status
- 📱 **PWA Ready**: Install on iOS/Android home screen
- 🔑 **Smart Wallet**: Passkey authentication (no extension needed)

## Tech Stack

- **Next.js 15**: React framework with App Router
- **OnchainKit**: Coinbase's toolkit for Smart Wallet integration
- **Wagmi v2**: React hooks for Ethereum
- **Viem**: TypeScript Ethereum library
- **next-pwa**: Progressive Web App capabilities
- **Tailwind CSS**: Utility-first styling

## Smart Contracts (Base Mainnet)

- **Identity**: `0xA174ee274F870631B3c330a85EBCad74120BE662`
- **Reputation**: `0x02bb4132a86134684976E2a52E43D59D89E64b29`
- **Credit**: `0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1`
- **Escrow**: `0x49EdEe04c78B7FeD5248A20706c7a6c540748806`
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add:
   - `NEXT_PUBLIC_ONCHAINKIT_API_KEY`: Get from [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (optional): Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Navigate to [http://localhost:3001](http://localhost:3001)

## PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Install app" or "Add to Home screen"
4. Tap "Install"

## Smart Wallet Setup

The app uses Coinbase Smart Wallet with passkey authentication:

1. Click "Connect Wallet"
2. Choose "Coinbase Wallet"
3. Follow prompts to create wallet with Face ID/Touch ID
4. No browser extension required!

### Gas Sponsorship

First transactions are sponsored through Coinbase's paymaster:
- Creating identity
- Initial reputation updates
- First few escrow operations

## Development

### Project Structure

```
base-app/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Dashboard
│   ├── send/               # Send USDC flow
│   ├── escrow/             # Escrow creation
│   ├── trust/              # Agent trust check
│   ├── providers.tsx       # Wagmi & OnchainKit setup
│   └── globals.css         # Tailwind + custom styles
├── lib/
│   ├── wagmi.ts            # Wagmi config with Smart Wallet
│   └── contracts.ts        # Contract addresses & ABIs
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   └── icons/              # App icons
└── next.config.ts          # Next.js + PWA config
```

### Key Files

- **`lib/wagmi.ts`**: Configures Coinbase Smart Wallet connector
- **`lib/contracts.ts`**: All Pay Lobster contract addresses and ABIs
- **`app/providers.tsx`**: Sets up OnchainKit with Base chain
- **`public/sw.js`**: Custom service worker for push notifications
- **`public/manifest.json`**: PWA configuration and shortcuts

## Push Notifications

To enable push notifications:

1. User grants notification permission in dashboard
2. Service worker registers for push events
3. Backend sends notifications via Web Push API
4. Users get alerts for:
   - Escrow funded
   - Escrow released
   - Reputation updated
   - Trust score changes

## Building for Production

```bash
npm run build
npm start
```

The app will be optimized for:
- Service worker caching
- Offline functionality
- Push notification support
- iOS/Android installation

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Other Platforms

Ensure these settings:
- Node.js 18+
- Build command: `npm run build`
- Output directory: `.next`
- Environment variables set

## Base.org Listing

To list on base.org:

1. Deploy to production
2. Ensure PWA is installable
3. Test on iOS and Android
4. Submit to [base.org/ecosystem](https://base.org/ecosystem)

Include:
- App name: Pay Lobster
- Description: Decentralized escrow with AI agent trust scoring
- Categories: DeFi, Infrastructure
- Smart contracts verified on BaseScan

## Troubleshooting

### Wallet Connection Issues
- Clear browser cache
- Try incognito/private mode
- Ensure you're on a supported browser (Chrome, Safari, Edge)

### Transaction Failures
- Check USDC balance
- Ensure you've approved the correct amount
- Verify you're on Base mainnet

### PWA Not Installing
- HTTPS required (localhost OK for dev)
- Service worker must register successfully
- Check manifest.json is accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on mobile devices
5. Submit a pull request

## License

MIT

## Links

- **Website**: [paylobster.com](https://paylobster.com)
- **Docs**: [docs.paylobster.com](https://docs.paylobster.com)
- **Base**: [base.org](https://base.org)
- **OnchainKit**: [onchainkit.xyz](https://onchainkit.xyz)

---

Built with 🦞 on Base
