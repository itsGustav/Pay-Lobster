# Deployment Checklist

## Pre-Deployment

- [x] Build succeeds locally (`npm run build`)
- [x] Dev server runs without errors (`npm run dev`)
- [ ] Test frame in local Frame Validator (via ngrok)
- [ ] OG images render correctly
- [ ] Contract reads work on Base mainnet

## Deploy to Vercel

### Method 1: Vercel CLI (Fastest)

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
cd /Users/gustav/clawd/Pay-Lobster-Website/frame
vercel

# Follow prompts:
# - Link to existing project or create new
# - Confirm settings (Next.js auto-detected)
# - Deploy!

# For production
vercel --prod
```

### Method 2: GitHub + Vercel Dashboard

```bash
# 1. Initialize git (if not already)
cd /Users/gustav/clawd/Pay-Lobster-Website/frame
git init
git add .
git commit -m "Initial Farcaster Frame for LOBSTER score checker"

# 2. Create GitHub repo and push
# Create new repo at github.com/new
git remote add origin https://github.com/YOUR_USERNAME/paylobster-frame.git
git branch -M main
git push -u origin main

# 3. Import to Vercel
# - Go to vercel.com/new
# - Import your repository
# - Framework: Next.js (auto-detected)
# - Root Directory: leave as is
# - Click "Deploy"
```

## Post-Deployment

### 1. Get Your Frame URL

After deployment, you'll get a URL like:
```
https://paylobster-frame.vercel.app
```

Your frame endpoint is:
```
https://paylobster-frame.vercel.app/api
```

### 2. Test in Frame Validator

1. Go to [Warpcast Frame Validator](https://warpcast.com/~/developers/frames)
2. Enter your frame URL: `https://your-domain.vercel.app/api`
3. Test all interactions:
   - Initial screen loads
   - "Check My Score" button works
   - OG images render correctly
   - Contract reads succeed

### 3. Share in Warpcast

Create a cast with your frame URL:
```
🦞 Check your LOBSTER credit score on Base!

https://paylobster-frame.vercel.app/api
```

Users can interact directly in their feed.

## Custom Domain (Optional)

### Add Custom Domain in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domain (e.g., `frame.paylobster.com`)
3. Update DNS records as instructed
4. Update frame metadata if needed

## Environment Variables

If you need custom RPC or other config:

1. In Vercel Dashboard → Settings → Environment Variables
2. Add:
   ```
   BASE_RPC_URL=https://your-custom-rpc.com
   NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
   ```
3. Redeploy

## Monitoring

### Check Deployment Logs:

```bash
vercel logs
```

### Common Issues:

**Build fails:**
- Check Vercel build logs
- Ensure all dependencies in package.json
- Verify Node.js version (18+)

**Frame not loading:**
- Verify frame URL ends with `/api`
- Check OG images are accessible
- Use Frame Validator to debug

**Contract errors:**
- Verify Base RPC is accessible from Vercel
- Check contract addresses are correct
- Ensure Base mainnet is not rate-limiting

## Rollback

If deployment has issues:

```bash
# Rollback to previous deployment
vercel rollback
```

Or use Vercel Dashboard → Deployments → Click previous deployment → Promote

## Updates

To update the frame:

```bash
# 1. Make changes
# 2. Test locally
npm run build
npm run dev

# 3. Deploy
vercel --prod
```

Or push to GitHub (auto-deploys if connected)

## Success Checklist

- [ ] Frame loads in Warpcast
- [ ] Buttons are clickable
- [ ] Wallet address is read correctly
- [ ] Contract reads return data
- [ ] Score displays correctly
- [ ] All intents (buttons/links) work
- [ ] OG images render properly
- [ ] No console errors

## Support

- Vercel Docs: https://vercel.com/docs
- Frog Docs: https://frog.fm
- Farcaster Frames: https://docs.farcaster.xyz/reference/frames/spec
- Pay Lobster: https://paylobster.com

## Frame URL for Sharing

After successful deployment, share your frame:

```
Frame endpoint: https://your-domain.vercel.app/api
Preview page: https://your-domain.vercel.app
```

🎉 Your LOBSTER Score Frame is live!
