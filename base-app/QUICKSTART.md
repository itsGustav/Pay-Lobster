# Pay Lobster PWA - Quick Start

Get the app running in under 2 minutes! 🦞

## 1. Get an OnchainKit API Key

Visit: https://portal.cdp.coinbase.com/

1. Sign in with your Coinbase account
2. Create a new project
3. Copy your API key
4. Add to `.env.local`:

```bash
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_key_here
```

## 2. Start the App

```bash
cd /Users/gustav/clawd/Pay-Lobster-Website/base-app
npm run dev
```

Opens at: **http://localhost:3001**

## 3. Connect Your Wallet

1. Click "Connect Wallet"
2. Choose "Coinbase Wallet"
3. Select "Create new wallet"
4. Use Face ID or Touch ID (passkey)
5. Done! No extension needed 🎉

## 4. Test Features

### Dashboard
- View your LOBSTER score (will be 0 initially)
- Check USDC balance
- See trust vectors

### Send USDC
- Click "Send USDC" card
- Enter recipient address
- Enter amount
- Send transaction

### Create Escrow
- Click "Create Escrow" card
- Enter recipient and amount
- Add description
- Approve USDC → Create escrow

### Check Agent Trust
- Click "Check Agent Trust" card
- Enter any Ethereum address
- View their trust score and recommendations

## 5. Test PWA Install

### iOS (Safari)
1. Open http://localhost:3001 in Safari
2. Tap Share button
3. "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open http://localhost:3001 in Chrome
2. Tap menu (three dots)
3. "Install app"
4. Tap "Install"

## Common Issues

### "API key missing"
- Make sure `.env.local` exists
- Key should start with `NEXT_PUBLIC_`
- Restart dev server after adding

### "Wrong network"
- App uses Base mainnet
- Switch to Base in wallet settings
- Or use Base Sepolia testnet for testing

### "Wallet not connecting"
- Try incognito/private mode
- Clear browser cache
- Use supported browser (Chrome, Safari, Edge)

### "PWA not installing"
- Must use HTTPS (or localhost)
- Check manifest.json loads
- Service worker must register

## What's Next?

- **Production Deploy**: See `DEPLOYMENT.md`
- **Full Documentation**: See `README.md`
- **Build Details**: See `BUILD_SUMMARY.md`

## Ready to Launch?

Once testing is complete:

1. Replace icon placeholders in `/public/`
2. Get production API key from Coinbase
3. Deploy to Vercel: `vercel deploy`
4. Test on real mobile devices
5. Submit to base.org

---

**Built with 🦞 on Base**

Need help? Check the README or deployment guide!
