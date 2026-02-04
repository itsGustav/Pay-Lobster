# Escrow Templates

Pre-built escrow configurations for common use cases across multiple verticals.

## Available Verticals

- **real_estate** — Earnest money, security deposits, closing funds
- **freelance** — Milestone-based payments, project delivery
- **commerce** — Product purchases, trades, swaps
- **services** — Service agreements, SLAs
- **p2p** — Peer-to-peer trades, deals
- **digital** — Digital goods, licenses, subscriptions
- **custom** — User-defined

## Real Estate Templates

### earnest_money
Traditional real estate earnest money escrow with standard contingencies.

**Conditions:**
- Home inspection satisfactory (10 days)
- Financing approved (21 days)
- Title clear
- Closing completed

**Parties:** buyer, seller, agent, title_company

**Example:**
```typescript
const escrow = await escrowManager.create({
  template: 'earnest_money',
  amount: '5000',
  chain: 'polygon',
  parties: [
    { role: 'buyer', name: 'Alice Johnson', email: 'alice@example.com' },
    { role: 'seller', name: 'Bob Smith', email: 'bob@example.com' },
    { role: 'agent', name: 'Jakub Adamowicz', email: 'jakub@realtorjakub.com' }
  ]
});
```

### security_deposit
Landlord-tenant security deposit with move-out conditions.

**Conditions:**
- Lease term completed
- Property inspection passed
- No outstanding damages

**Parties:** landlord, tenant

**Example:**
```typescript
const escrow = await escrowManager.create({
  template: 'security_deposit',
  amount: '2000',
  chain: 'polygon',
  parties: [
    { role: 'landlord', name: 'Property Owner' },
    { role: 'tenant', name: 'Renter' }
  ]
});
```

### closing_funds
Full real estate transaction closing escrow.

**Conditions:**
- All contingencies satisfied
- Title transferred
- Closing documents signed

**Parties:** buyer, seller, title_company

---

## Freelance Templates

### project_milestone
Milestone-based project with staged payments.

**Conditions:**
- Design phase approved (25%)
- Development complete (50%)
- Final delivery and approval (25%)

**Parties:** client, provider

**Example:**
```typescript
const escrow = await escrowManager.create({
  template: 'project_milestone',
  amount: '10000',
  chain: 'ethereum',
  parties: [
    { role: 'client', name: 'Startup Inc', email: 'founder@startup.com' },
    { role: 'provider', name: 'Dev Agency', email: 'team@devagency.com' }
  ]
});
```

### freelance_delivery
Simple freelance delivery with client approval.

**Conditions:**
- Work delivered
- Client approval

**Auto-release:** 7 days if client doesn't respond

**Example:**
```typescript
const escrow = await escrowManager.create({
  template: 'freelance_delivery',
  amount: '1500',
  chain: 'polygon',
  parties: [
    { role: 'client', name: 'Client Name' },
    { role: 'provider', name: 'Freelancer Name' }
  ]
});
```

### consulting_retainer
Monthly retainer with deliverable verification.

**Conditions:**
- Monthly report delivered
- Deliverables meet agreement

**Parties:** client, consultant

---

## Commerce Templates

### product_purchase
E-commerce purchase with shipping and receipt confirmation.

**Conditions:**
- Item shipped with tracking
- Buyer confirms receipt
- Item condition verified

**Auto-release:** 3 days if buyer doesn't dispute

**Example:**
```typescript
const escrow = await escrowManager.create({
  template: 'product_purchase',
  amount: '500',
  chain: 'polygon',
  parties: [
    { role: 'buyer', name: 'Customer' },
    { role: 'seller', name: 'Shop Owner' }
  ]
});
```

### trade_swap
Peer-to-peer item exchange.

**Conditions:**
- Both parties ship items
- Both parties confirm receipt
- Both parties approve condition

**Parties:** party_a, party_b

### marketplace_sale
Third-party marketplace transaction.

**Conditions:**
- Payment received
- Item delivered
- No disputes filed

**Auto-release:** 7 days

**Parties:** buyer, seller, marketplace

---

## P2P Trading Templates

### crypto_otc
Over-the-counter crypto/token swap.

**Conditions:**
- Both parties deposit funds
- Both parties approve swap

**Example:**
```typescript
const escrow = await escrowManager.create({
  template: 'crypto_otc',
  amount: '10000',
  chain: 'ethereum',
  parties: [
    { role: 'party_a', name: 'Trader A', walletAddress: '0x...' },
    { role: 'party_b', name: 'Trader B', walletAddress: '0x...' }
  ]
});
```

### nft_trade
NFT swap or sale with verification.

**Conditions:**
- NFT ownership verified
- Payment confirmed
- Both parties approve transfer

### peer_loan
P2P lending with collateral.

**Conditions:**
- Collateral deposited
- Repayment deadline met (30 days)

**Parties:** lender, borrower

---

## Digital Goods Templates

### digital_license
Software license or digital product sale.

**Conditions:**
- License key delivered
- License activated successfully

**Auto-release:** 3 days

**Example:**
```typescript
const escrow = await escrowManager.create({
  template: 'digital_license',
  amount: '99',
  chain: 'polygon',
  parties: [
    { role: 'buyer', name: 'Customer' },
    { role: 'vendor', name: 'Software Co' }
  ]
});
```

### saas_subscription
Recurring SaaS payment with service verification.

**Conditions:**
- Service access granted
- Uptime SLA met (99.9%)

**Parties:** subscriber, provider

### digital_content
Ebook, course, template, or other digital content.

**Conditions:**
- Content delivered
- Download successful

**Auto-release:** 1 day

---

## Services Templates

### service_agreement
General service contract with completion verification.

**Conditions:**
- Service completed
- Quality requirements met

**Parties:** client, provider

### sla_based_service
Service with SLA requirements.

**Conditions:**
- SLA metrics met
- Service period complete (30 days)
- Client approval

**Parties:** client, provider

### construction_contract
Construction project with inspection milestones.

**Conditions:**
- Foundation complete (25%)
- Framing and electrical (25%)
- Finishing work (25%)
- Final inspection passed (25%)

**Parties:** client, contractor, inspector

**Example:**
```typescript
const escrow = await escrowManager.create({
  template: 'construction_contract',
  amount: '50000',
  chain: 'polygon',
  parties: [
    { role: 'client', name: 'Homeowner' },
    { role: 'contractor', name: 'Construction Co' },
    { role: 'inspector', name: 'Building Inspector' }
  ]
});
```

---

## CLI Usage

### List templates
```bash
# All templates
usdc-cli escrow templates

# By vertical
usdc-cli escrow templates freelance
usdc-cli escrow templates commerce
usdc-cli escrow templates real_estate
```

### Create from template
```bash
usdc-cli escrow create --template project_milestone --amount 10000 --chain ethereum

usdc-cli escrow create --template product_purchase --amount 500 --chain polygon

usdc-cli escrow create --template earnest_money --amount 5000
```

---

## API Usage

```typescript
import EscrowManager from './lib/escrow';

const escrowManager = new EscrowManager();

// Create from template
const escrow = await escrowManager.create({
  template: 'project_milestone',
  amount: '10000',
  chain: 'polygon',
  parties: [
    { role: 'client', name: 'Alice', email: 'alice@example.com' },
    { role: 'provider', name: 'Bob', email: 'bob@example.com' }
  ],
  customConditions: [
    {
      description: 'Additional security audit',
      type: 'custom',
    }
  ]
});

console.log('Escrow created:', escrow.id);
```

---

## Template Structure

Each template includes:

- **name** — Display name
- **description** — What it's for
- **vertical** — Category (real_estate, freelance, etc.)
- **conditions** — Pre-configured release conditions
- **releaseRequires** — How conditions are evaluated
  - `all_conditions` — All must be satisfied
  - `majority_approval` — Majority of parties must approve
  - `condition_based` — Milestone-based partial releases
  - `any_party` — Any party can trigger release
- **recommendedPartyRoles** — Suggested party roles
- **autoReleaseDays** — Auto-release after N days (optional)

---

## Need something custom?

See [escrow-custom.md](./escrow-custom.md) for creating fully custom escrows with the ConditionBuilder API.
