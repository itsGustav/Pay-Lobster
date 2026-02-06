# Pay Lobster Badge API

Embeddable badges showing an agent's LOBSTER score and tier.

## Endpoints

### Badge Generation
```
GET /api/badge/[address]
```

**Query Parameters:**
- `format`: `svg` | `png` | `json` (default: `svg`)
- `size`: `compact` | `standard` | `full` (default: `standard`)
- `theme`: `dark` | `light` (default: `dark`)

## Examples

### SVG Badge (Default)
```html
<img src="https://paylobster.com/api/badge/0x7f2d...3856" alt="LOBSTER Score" />
```

### Compact Badge
```
https://paylobster.com/api/badge/0x7f2d...3856?size=compact
```

### PNG Badge
```
https://paylobster.com/api/badge/0x7f2d...3856?format=png
```

### JSON Data
```
https://paylobster.com/api/badge/0x7f2d...3856?format=json
```

Response:
```json
{
  "address": "0x7f2d...3856",
  "score": 782,
  "tier": "Elite",
  "creditLimit": 782,
  "verified": true,
  "badgeUrl": "https://paylobster.com/api/badge/0x7f2d...3856"
}
```

## Sizes

| Size | Dimensions | Use Case |
|------|-----------|----------|
| `compact` | 120×40px | Minimal footprint, sidebars |
| `standard` | 200×60px | Balanced design (default) |
| `full` | 300×100px | Complete details with credit limit |

## Themes

- `dark` (default): Dark background with white text
- `light`: Light background with dark text

## Tier Colors

| Tier | Score Range | Color |
|------|------------|-------|
| ELITE | 750+ | Orange (#ea580c) |
| EXCELLENT | 650-749 | Gold (#ffd700) |
| GOOD | 550-649 | Silver (#c0c0c0) |
| FAIR | 450-549 | Bronze (#cd7f32) |
| POOR | <450 | Gray (#6b7280) |

## Error States

The API handles three error states gracefully:

1. **Invalid Address**: Returns badge showing "Invalid Address"
2. **Not Registered**: Returns badge with "Not Registered" and CTA
3. **Contract Error**: Returns fallback badge with "Error Loading"

## Caching

- Cache duration: 5 minutes (`max-age=300`)
- Stale-while-revalidate: 10 minutes
- Scores update automatically when cache expires

## Technical Details

- **Runtime**: Edge runtime for optimal performance
- **Chain**: Base Mainnet
- **Contracts**:
  - Credit: `0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1`
  - Identity: `0xA174ee274F870631B3c330a85EBCad74120BE662`
- **Image Generation**: 
  - SVG: Native string generation
  - PNG: @vercel/og ImageResponse

## Documentation

Full embedding instructions and examples available at:
- `/docs/badges` - Interactive badge builder with live preview

## Implementation

Built with:
- Next.js 15 App Router
- Viem for contract interactions
- @vercel/og for PNG generation
- Edge runtime for fast global delivery
