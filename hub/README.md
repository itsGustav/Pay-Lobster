# Pay Lobster Command Center

> Mission control for agent finance on Base

## 🚀 Features

- **Real-time Metrics** - Live TVL, agent count, and transaction data from blockchain
- **3D Globe Visualization** - Interactive globe showing transaction flow
- **Premium Product Cards** - Access all Pay Lobster platforms with stunning hover effects
- **Live Activity Feed** - Real-time blockchain events
- **Web3 Integration** - Optional wallet connection for personalization
- **Mobile Responsive** - Perfect on all devices
- **60fps Animations** - Smooth Framer Motion effects
- **Dark Theme** - Orange accent (#ea580c) on dark background (#0a0a0a)

## 🛠️ Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animations)
- **react-globe.gl** (3D visualization)
- **wagmi/viem** (blockchain reads)
- **@rainbow-me/rainbowkit** (wallet connection)

## 📦 Installation

```bash
cd /Users/gustav/clawd/Pay-Lobster-Website/hub
npm install
```

## 🏃 Development

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002)

## 🏗️ Build

```bash
npm run build
npm start
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Deploy automatically

```bash
vercel --prod
```

### Manual Deploy

```bash
npm run build
```

Upload the `.next` directory to your hosting provider.

## 📝 Contract Addresses (Base)

- **Identity**: `0xA174ee274F870631B3c330a85EBCad74120BE662`
- **Reputation**: `0x02bb4132a86134684976E2a52E43D59D89E64b29`
- **Credit**: `0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1`
- **Escrow**: `0x49EdEe04c78B7FeD5248A20706c7a6c540748806`

## 🔗 Links

- **Mobile App**: https://base-app-steel.vercel.app
- **Web Dashboard**: https://web-paylobster.vercel.app
- **Farcaster Frame**: https://frame.paylobster.com
- **GitHub**: https://github.com/paylobster

## ⚙️ Configuration

All blockchain configuration is in `src/lib/contracts.ts` and `src/lib/web3.ts`.

To modify:
- **Colors**: `tailwind.config.js`
- **Contracts**: `src/lib/contracts.ts`
- **Chain**: `src/lib/web3.ts`

## 🎨 Design System

- **Background**: `#0a0a0a`
- **Primary**: `#ea580c` (orange)
- **Foreground**: `#ffffff`
- **Touch Targets**: 44px minimum
- **Whitespace**: Generous padding/margins
- **Animations**: Respect `prefers-reduced-motion`

## 🐛 Troubleshooting

### Globe not loading
- Ensure `react-globe.gl` is installed
- Check browser console for WebGL errors
- Try clearing browser cache

### Wallet connection fails
- Make sure you're on Base network
- Check wallet extension is installed
- Try refreshing the page

### Build errors
- Delete `node_modules` and `.next`
- Run `npm install` again
- Ensure Node.js version is 18+

## 📄 License

MIT

---

Built with ❤️ on Base | Powered by Circle USDC
