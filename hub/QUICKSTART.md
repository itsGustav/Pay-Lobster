# Pay Lobster Hub - Quick Start

## 🚀 60-Second Deploy

```bash
# 1. Navigate to hub
cd /Users/gustav/clawd/Pay-Lobster-Website/hub

# 2. Deploy to Vercel
npx vercel --prod

# 3. Done! Copy the URL
```

## 🧪 Local Development

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3002
```

## 📦 What You Got

✅ **Next.js 15 app** with App Router
✅ **3D Globe** showing live transactions
✅ **Live metrics** from Base contracts
✅ **Premium animations** with Framer Motion
✅ **4 product cards** linking to all platforms
✅ **Activity feed** with real-time updates
✅ **Mobile responsive** design
✅ **Dark theme** with orange accent
✅ **Production build** passing

## 🎯 Files to Know

- `src/app/page.tsx` - Main page
- `src/components/` - All components
- `src/lib/contracts.ts` - Contract addresses
- `tailwind.config.js` - Design tokens
- `README.md` - Full documentation
- `DEPLOYMENT.md` - Detailed deploy guide
- `COMPLETION_REPORT.md` - Feature checklist

## 🔧 Customize

### Change Colors
```js
// tailwind.config.js
colors: {
  primary: '#ea580c',  // Orange accent
  background: '#0a0a0a', // Dark bg
}
```

### Update Contracts
```ts
// src/lib/contracts.ts
export const CONTRACTS = {
  IDENTITY: '0x...',
  // ...
}
```

### Modify Links
```tsx
// src/components/BentoCards.tsx
const cards = [
  { href: 'https://...', ... },
  // ...
]
```

## 🐛 Troubleshooting

**Build fails?**
```bash
rm -rf node_modules .next
npm install
npm run build
```

**Globe not showing?**
- Check browser console
- Ensure WebGL is supported
- Try in Chrome/Safari

**Metrics showing 0?**
- Check Base RPC connection
- Contracts may be on testnet
- Verify contract addresses

## 📸 Screenshots

Take these for the hackathon:
1. Full homepage with globe
2. Hover effect on bento cards
3. Activity feed updating
4. Mobile responsive view

## 🏆 Deployment Checklist

- [ ] Build passes locally
- [ ] Deploy to Vercel
- [ ] Test on mobile
- [ ] Check all 4 links work
- [ ] Verify metrics load
- [ ] Test wallet connect
- [ ] Record demo video
- [ ] Submit to hackathon

## 📞 Need Help?

Check the other docs:
- **README.md** - Full feature list
- **DEPLOYMENT.md** - Deployment options
- **COMPLETION_REPORT.md** - What was built

---

**That's it!** You have a stunning command center ready to impress. 🦞
