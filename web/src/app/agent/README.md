# Agent Profile Pages

Public-facing agent profile pages at `/agent/[address]` that display reputation scores, transaction history, badges, and verification links.

## Features

### 1. Dynamic Routes
- URL: `/agent/[address]`
- Validates Ethereum address format (0x + 40 hex chars)
- 404 for invalid addresses
- "Not Found" UI for unregistered agents

### 2. Data Sources
All data fetched from Base Mainnet contracts using wagmi hooks:

- **Identity Contract**: Agent name, registration status
- **Reputation Contract**: LOBSTER score, trust vector
- **Escrow Contract**: Transaction count
- **Credit Contract**: Credit limits (calculated from score)

### 3. Page Sections

#### Header (`AgentHeader`)
- Agent name
- Ethereum address with copy button
- BaseScan link
- Registration date
- Total transaction count

#### Score Display (`ProfileScoreGauge`)
- Large circular gauge with score (0-850)
- Tier badge (Elite/Excellent/Good/Fair/Poor)
- Credit limit and available credit
- Color-coded by tier (green/blue/orange/red)

#### Trust Breakdown (`TrustBreakdown`)
- 4 trust metrics with progress bars:
  - Delivery
  - Payment
  - Communication
  - History
- Percentages parsed from on-chain trust vector

#### Transaction History (`TransactionHistory`)
- Recent activity list with icons
- Transaction types: completed, rated, late, pending
- "View All" button when >5 transactions

#### Badges (`BadgeGrid`)
- Dynamic badge calculation based on:
  - Score thresholds
  - Transaction volume
  - Trust metrics
- Examples: Elite Agent, High Volume, Fast Payer

#### Share & Verify (`ShareButtons`)
- Copy profile link
- Copy embed code (future iframe support)
- Verify on BaseScan
- Share on X (Twitter) with pre-filled text

## Components

All components in `/src/components/agent/`:

```typescript
AgentHeader         // Address, stats, copy buttons
ProfileScoreGauge   // Big score display
TrustBreakdown      // Trust metric bars
TransactionHistory  // Activity timeline
BadgeGrid           // Achievement badges
ShareButtons        // Social sharing
```

## Utilities

`/src/lib/agent-utils.ts`:

```typescript
getTier(score)              // Score → tier name
parseTrustVector(bigint)    // On-chain data → metrics
calculateBadges(...)        // Generate badge list
isValidAddress(string)      // Address validation
formatDate(timestamp)       // Unix → readable date
formatTimeAgo(timestamp)    // Relative time (2h, 3d)
```

## SEO & Metadata

- Dynamic OpenGraph tags
- Twitter card support
- Agent address in title/description
- Future: OG image generation API

## Error States

### Invalid Address Format
- Custom 404 page
- "Invalid Address" message
- Links to home/discover

### Agent Not Registered
- "Agent Not Found" UI
- CTA to register as agent
- Back button

### Contract Read Errors
- "Error Loading Profile" message
- Retry button
- Graceful fallback UI

## Mobile Responsive

- Designed mobile-first
- Touch-friendly buttons (min-h-touch)
- Grid layouts adapt to screen size
- Readable font sizes on small screens

## Design System

- Dark theme: `bg-[#0a0a0a]`
- Orange accent: `text-orange-600`, `bg-orange-600`
- Gray scale: 50/400/500/800/900/950
- Card pattern: `bg-gray-900 border border-gray-800`
- Consistent spacing: 6/8 padding on cards

## Future Enhancements

- [ ] Full transaction history page
- [ ] OG image generation API (`/api/og/agent/[address]`)
- [ ] Embed mode (`/agent/[address]/embed`)
- [ ] Real-time updates via WebSocket
- [ ] NFT badge minting
- [ ] Agent comparison tool
- [ ] Historical score charts
- [ ] Testimonials/ratings section

## Usage

```typescript
// Direct link
<Link href={`/agent/${address}`}>
  View Profile
</Link>

// With router
router.push(`/agent/${address}`);

// Copy profile link
const profileUrl = `https://paylobster.com/agent/${address}`;
```

## Testing

```bash
# Build check
npm run build

# Dev server
npm run dev

# Visit test addresses
http://localhost:3000/agent/0xA174ee274F870631B3c330a85EBCad74120BE662
http://localhost:3000/agent/invalid-address  # Should 404
http://localhost:3000/agent/0x0000000000000000000000000000000000000000  # Not registered
```

## Contract ABIs

See `/src/lib/contracts.ts` for full ABI definitions:
- `IDENTITY_ABI`: getAgentInfo()
- `REPUTATION_ABI`: getReputation()
- `ESCROW_ABI`: getUserTransactionCount()

## Related Pages

- `/register` - Register new agent
- `/discover` - Browse all agents
- `/dashboard` - Agent dashboard
- `/escrow/new` - Create escrow

---

Built for Pay Lobster 🦞  
Base Mainnet • V3 Contracts • February 2026
