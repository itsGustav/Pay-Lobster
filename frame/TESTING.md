# Testing Guide

## ✅ Build Status

The project builds successfully! ✓ Compiled and ready for deployment.

## Local Testing

### 1. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3001` (or 3000 if available)

### 2. Test Endpoints

**Preview Page:**
```
http://localhost:3001
```
Opens the landing page with frame information.

**Frame Endpoint:**
```
http://localhost:3001/api
```
This is the Farcaster Frame entry point.

**OG Image Generator:**
```
http://localhost:3001/api/og?type=initial
http://localhost:3001/api/og?type=score&score=750&tier=Elite&txs=42
```

### 3. Frame Validator Testing

**Option A: Using ngrok (Recommended)**

1. Install ngrok: `brew install ngrok` (Mac) or download from https://ngrok.com
2. Start tunnel: `ngrok http 3001`
3. Copy the https URL (e.g., `https://abc123.ngrok.io`)
4. Go to [Warpcast Frame Validator](https://warpcast.com/~/developers/frames)
5. Enter your frame URL: `https://abc123.ngrok.io/api`
6. Test the frame interactions

**Option B: Deploy to Vercel first**

1. Deploy to Vercel (see README.md)
2. Use your production URL in the Frame Validator

## Testing the Frame Flow

### Expected Behavior:

1. **Initial Screen**
   - Shows "🦞 Check Your LOBSTER Score"
   - Two buttons: "Check My Score" and "Visit PayLobster.com"

2. **Click "Check My Score"**
   - Frame reads connected wallet address
   - If no wallet: Shows "No Wallet Connected" message
   - If wallet connected: Proceeds to next step

3. **Registration Check**
   - Queries Identity contract on Base
   - If not registered: Shows "Not Registered Yet" with link to register
   - If registered: Proceeds to score fetch

4. **Score Display**
   - Queries Reputation contract
   - Shows trust score (300-850)
   - Displays tier (Elite, Premium, Good, Average, New)
   - Shows transaction count
   - Provides "Check Again" and "View Dashboard" options

## Contract Verification

The frame connects to Base Mainnet contracts:

```
Identity:   0xA174ee274F870631B3c330a85EBCad74120BE662
Reputation: 0x02bb4132a86134684976E2a52E43D59D89E64b29
```

You can verify these on [Base Scan](https://basescan.org)

## Debugging

### Check Logs

```bash
# In the terminal running npm run dev
# Errors will appear here
```

### Common Issues

**Frame not loading:**
- Verify OG images are accessible
- Check browser console for errors
- Ensure frame URL is https (required by Warpcast)

**Score not displaying:**
- Check Base RPC is accessible
- Verify contract addresses are correct
- Check wallet has transactions on Base

**Build errors:**
- Run `npm install` to ensure dependencies
- Clear `.next` folder: `rm -rf .next`
- Rebuild: `npm run build`

## Frame Debugger

Use the [Warpcast Frame Debugger](https://warpcast.com/~/developers/frames) to:
- Validate frame metadata
- Test button interactions
- Simulate wallet connections
- Debug image rendering

## Production Testing

After deploying to Vercel:

1. Test frame in Warpcast Frame Validator
2. Create a test cast with the frame URL
3. Verify all interactions work
4. Check OG images load correctly
5. Test with different wallet addresses

## Performance

- Initial load: ~1-2s (includes OG image generation)
- Contract reads: ~500ms-1s (depends on Base RPC)
- Total interaction: ~2-3s per action

## Security

- No private keys stored
- Read-only contract interactions
- No user data collected
- All contract reads are public blockchain data
