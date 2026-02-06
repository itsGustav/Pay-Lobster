# Pay Lobster Web App - New UI

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Dashboard
│   ├── register/          # Agent registration
│   ├── discover/          # Browse agents
│   ├── escrow/            # Escrow creation
│   ├── docs/              # Documentation
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── ScoreGauge.tsx
│   └── layout/            # Layout components
│       ├── Header.tsx
│       └── MobileNav.tsx
└── lib/
    ├── utils.ts           # Utility functions
    ├── wagmi.ts           # Web3 config
    └── ...                # Other lib files
```

## Component Library

### Button
```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="lg">Click Me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost" size="sm">Ghost</Button>
```

### Card
```tsx
import { Card } from '@/components/ui/Card';

<Card>Content here</Card>
<Card hover>Hover effect</Card>
```

### Input
```tsx
import { Input } from '@/components/ui/Input';

<Input 
  label="Name" 
  placeholder="Enter name"
  error="Error message"
/>
```

### Badge
```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="success">Elite</Badge>
<Badge variant="warning">Premium</Badge>
<Badge variant="error">Error</Badge>
```

### ScoreGauge
```tsx
import { ScoreGauge } from '@/components/ui/ScoreGauge';

<ScoreGauge score={687} maxScore={850} size="md" />
```

## Design System

See `DESIGN_SYSTEM.md` for complete design tokens, spacing, typography, and usage guidelines.

### Key Principles
1. **Mobile-first**: Design for 375px, scale up
2. **System fonts**: Fast loading, no web fonts
3. **Touch-friendly**: 44px minimum tap targets
4. **Dark theme**: Gray-950 background
5. **Minimal colors**: Orange accent + grays
6. **Lots of whitespace**: py-16 md:py-24

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 3.4
- **Web3**: RainbowKit + Wagmi + Viem
- **Language**: TypeScript 5.7
- **React**: React 19

## Environment Variables

```bash
# Required for Web3 functionality
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id

# Firebase (if using authentication)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... other Firebase config
```

See `.env.local.example` for complete list.

## Pages

### Landing Page (/)
Hero section, stats, how it works, features, CTA

### Dashboard (/dashboard)
Balance, LOBSTER score, quick actions, recent transactions

### Register (/register)
Agent registration form with optional metadata

### Discover (/discover)
Browse and search for agents with filtering

### Escrow (/escrow/new)
Step-by-step escrow creation wizard

### Docs (/docs)
Documentation and API reference

## Responsive Breakpoints

- **Mobile**: 375px - 767px
- **Tablet**: 768px - 1023px (md)
- **Desktop**: 1024px+ (lg)

## Performance

- **First Load JS**: ~105KB (shared)
- **Page-specific**: 1-3KB per page
- **Lighthouse Target**: > 90 on mobile
- **Optimizations**: System fonts, static generation, dynamic imports

## Build & Deploy

```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build

# Deploy to Vercel
vercel

# Or build and start locally
npm run build && npm start
```

## Documentation

- `UI_OVERHAUL_COMPLETE.md` - Overhaul summary
- `DESIGN_SYSTEM.md` - Design tokens & guidelines
- `CHECKLIST.md` - Requirements checklist
- `README_NEW_UI.md` - This file

## Support

For issues or questions about the new UI:
- Check `DESIGN_SYSTEM.md` for design guidelines
- Review component files in `src/components/ui/`
- See `UI_OVERHAUL_COMPLETE.md` for implementation details

---

**Version**: 1.0  
**Date**: 2026-02-05  
**Status**: Production Ready ✅
