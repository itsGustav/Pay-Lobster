# Pay Lobster SDK V3 Documentation

## Overview

Pay Lobster SDK V3 introduces enhanced smart contract wrappers for the V3 protocol deployment on Base Mainnet. The SDK provides TypeScript interfaces for:

- **Identity Management** - Agent registration and discovery
- **Reputation System** - Trust scores and feedback
- **Credit Scoring** - On-chain credit limits and lending
- **Escrow Payments** - Secure transactions with credit support

## Contract Addresses (Base Mainnet)

```typescript
const V3_ADDRESSES = {
  Identity: '0xA174ee274F870631B3c330a85EBCad74120BE662',
  Reputation: '0x02bb4132a86134684976E2a52E43D59D89E64b29',
  Credit: '0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1',
  Escrow: '0x49EdEe04c78B7FeD5248A20706c7a6c540748806',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};
```

## Installation

```bash
npm install pay-lobster@3.0.0
```

## Quick Start

```typescript
import { ethers } from 'ethers';
import { createV3Contracts, V3_ADDRESSES } from 'pay-lobster';

// Connect to Base
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Create all V3 contract instances
const { identity, reputation, credit, escrow } = createV3Contracts(wallet);
```

## API Reference

### PayLobsterIdentity

Agent registration and identity management on-chain.

#### Methods

**`register(metadata: AgentMetadata): Promise<TransactionResponse>`**
Register a new agent with metadata.

```typescript
await identity.register({
  name: 'My AI Agent',
  description: 'Autonomous payment processor',
  category: 'payment-processor',
  capabilities: ['escrow', 'recurring-payments'],
  contact: 'agent@example.com',
});
```

**`getAgent(address: string): Promise<AgentInfo | null>`**
Get agent information by address.

```typescript
const agent = await identity.getAgent('0x...');
console.log(agent.metadata.name, agent.id);
```

**`isRegistered(address: string): Promise<boolean>`**
Check if an address is registered.

```typescript
const registered = await identity.isRegistered('0x...');
```

**`getAgentId(address: string): Promise<bigint>`**
Get agent's unique ID (returns 0n if not registered).

**`getTotalAgents(): Promise<bigint>`**
Get total number of registered agents.

**`updateMetadata(metadata: AgentMetadata): Promise<TransactionResponse>`**
Update agent metadata (owner only).

**`deactivate(): Promise<TransactionResponse>`**
Temporarily deactivate agent.

**`reactivate(): Promise<TransactionResponse>`**
Reactivate a deactivated agent.

---

### PayLobsterReputation

Reputation system with trust scores and feedback tracking.

#### Methods

**`getTrustScore(address: string): Promise<number>`**
Get overall trust score (0-1000).

```typescript
const score = await reputation.getTrustScore('0x...');
console.log(`Trust: ${score}/1000`);
```

**`getTrustVector(address: string): Promise<TrustVector>`**
Get detailed trust breakdown across categories.

```typescript
const vector = await reputation.getTrustVector('0x...');
// Returns: { payment, delivery, quality, response, security }
```

**`getCategoryScore(address: string, category: number): Promise<number>`**
Get score for specific category (0=Payment, 1=Delivery, 2=Quality, 3=Response, 4=Security).

**`getRecentFeedback(address: string, limit: number): Promise<FeedbackEntry[]>`**
Get recent feedback entries.

```typescript
const feedback = await reputation.getRecentFeedback('0x...', 10);
feedback.forEach(f => {
  console.log(`Rating: ${f.rating}/100 - ${f.comment}`);
});
```

**`getFeedbackCount(address: string): Promise<bigint>`**
Get total feedback count.

**`submitFeedback(escrowId, ratedAgent, rating, category, comment): Promise<TransactionResponse>`**
Submit feedback after escrow completion.

```typescript
await reputation.submitFeedback(
  escrowId,
  '0x...', // rated agent
  85, // rating (0-100)
  0, // category (0=Payment)
  'Great service!'
);
```

**`canRate(escrowId: bigint, rater: string): Promise<boolean>`**
Check if user can rate an escrow.

---

### PayLobsterCredit

On-chain credit scoring and lending system.

#### Methods

**`getScore(address: string): Promise<number>`**
Get credit score (0-1000).

```typescript
const score = await credit.getScore('0x...');
console.log(`Credit Score: ${score}/1000`);
```

**`getCreditLimit(address: string): Promise<bigint>`**
Get credit limit in USDC (6 decimals).

```typescript
const limit = await credit.getCreditLimit('0x...');
console.log(`Limit: ${ethers.formatUnits(limit, 6)} USDC`);
```

**`getAvailableCredit(address: string): Promise<bigint>`**
Get available credit (limit - used).

**`getProfile(address: string): Promise<CreditProfile>`**
Get full credit profile.

```typescript
const profile = await credit.getProfile('0x...');
console.log({
  score: profile.score,
  limit: ethers.formatUnits(profile.limit, 6),
  used: ethers.formatUnits(profile.used, 6),
  available: ethers.formatUnits(profile.available, 6),
  activeLoans: profile.activeLoans,
  totalBorrowed: ethers.formatUnits(profile.totalBorrowed, 6),
  totalRepaid: ethers.formatUnits(profile.totalRepaid, 6),
  defaultCount: profile.defaultCount,
});
```

**`getActiveLoans(address: string): Promise<LoanInfo[]>`**
Get all active loans.

**`hasActiveDebt(address: string): Promise<boolean>`**
Check if agent has unpaid debt.

**`checkCreditEligibility(address: string, amount: bigint): Promise<boolean>`**
Check if agent is eligible for credit amount.

```typescript
const eligible = await credit.checkCreditEligibility(
  '0x...',
  ethers.parseUnits('100', 6) // 100 USDC
);
```

**`syncFromReputation(address: string): Promise<TransactionResponse>`**
Update credit score based on reputation (anyone can call).

---

### PayLobsterEscrow

Escrow and payment management with credit support.

#### Methods

**`create(payee, amount, description, metadata?): Promise<TransactionResponse>`**
Create a new escrow (not funded yet).

```typescript
const tx = await escrow.create(
  '0x...', // payee
  ethers.parseUnits('50', 6), // 50 USDC
  'Payment for services',
  JSON.stringify({ invoiceId: '123' })
);
```

**`fund(escrowId: bigint): Promise<TransactionResponse>`**
Fund an existing escrow (approves USDC automatically).

```typescript
await escrow.fund(escrowId);
```

**`createAndFund(payee, amount, description, useCredit, metadata?): Promise<TransactionResponse>`**
Create and fund escrow in one transaction.

```typescript
// Pay with USDC
await escrow.createAndFund(
  '0x...', // payee
  ethers.parseUnits('50', 6),
  'Payment for services',
  false // useCredit
);

// Pay with credit (no USDC needed upfront)
await escrow.createAndFund(
  '0x...',
  ethers.parseUnits('50', 6),
  'Payment for services',
  true // useCredit
);
```

**`release(escrowId: bigint): Promise<TransactionResponse>`**
Release funds to payee (payer only).

**`refund(escrowId: bigint, reason: string): Promise<TransactionResponse>`**
Request refund (payer only).

**`approveRefund(escrowId: bigint): Promise<TransactionResponse>`**
Approve refund request (payee only).

**`rate(escrowId, ratedAgent, rating, category, comment): Promise<TransactionResponse>`**
Submit rating after completion.

```typescript
await escrow.rate(
  escrowId,
  '0x...', // rated agent
  90, // rating
  2, // category (2=Quality)
  'Excellent work!'
);
```

**`getEscrow(escrowId: bigint): Promise<EscrowInfo>`**
Get escrow details.

```typescript
const escrow = await escrow.getEscrow(escrowId);
console.log({
  payer: escrow.payer,
  payee: escrow.payee,
  amount: ethers.formatUnits(escrow.amount, 6),
  status: escrow.status, // 0=Created, 1=Funded, 2=Released, 3=Refunded
  description: escrow.description,
});
```

**`getEscrowStatus(escrowId: bigint): Promise<number>`**
Get escrow status code.

**`cancel(escrowId: bigint): Promise<TransactionResponse>`**
Cancel unfunded escrow.

**`repayCredit(escrowId: bigint, amount: bigint): Promise<TransactionResponse>`**
Repay credit used in escrow.

**`canRate(escrowId: bigint, rater: string): Promise<boolean>`**
Check if user can rate.

---

## TypeScript Types

```typescript
interface AgentMetadata {
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  contact: string;
}

interface AgentInfo {
  id: bigint;
  owner: string;
  metadata: AgentMetadata;
  registered: boolean;
  active: boolean;
}

interface TrustVector {
  payment: number;
  delivery: number;
  quality: number;
  response: number;
  security: number;
}

interface FeedbackEntry {
  id: bigint;
  escrowId: bigint;
  rater: string;
  rated: string;
  rating: number;
  category: number;
  comment: string;
  timestamp: bigint;
}

interface CreditProfile {
  score: number;
  limit: bigint;
  used: bigint;
  available: bigint;
  activeLoans: bigint;
  totalBorrowed: bigint;
  totalRepaid: bigint;
  defaultCount: bigint;
  lastUpdated: bigint;
}

interface LoanInfo {
  id: bigint;
  borrower: string;
  amount: bigint;
  repaidAmount: bigint;
  dueDate: bigint;
  repaidAt: bigint;
  status: number; // 0=Active, 1=Repaid, 2=Defaulted
}

interface EscrowInfo {
  id: bigint;
  payer: string;
  payee: string;
  amount: bigint;
  status: number; // 0=Created, 1=Funded, 2=Released, 3=Refunded, 4=Disputed
  createdAt: bigint;
  fundedAt: bigint;
  completedAt: bigint;
  description: string;
  metadata: string;
}
```

## Examples

### Complete Workflow

```typescript
import { createV3Contracts } from 'pay-lobster';
import { ethers } from 'ethers';

const wallet = new ethers.Wallet(privateKey, provider);
const { identity, reputation, credit, escrow } = createV3Contracts(wallet);

// 1. Register agent
await identity.register({
  name: 'AI Payment Agent',
  description: 'Automated escrow manager',
  category: 'payment-processor',
  capabilities: ['escrow', 'invoicing'],
  contact: 'agent@example.com',
});

// 2. Check reputation
const trustScore = await reputation.getTrustScore(wallet.address);
console.log(`Trust: ${trustScore}/1000`);

// 3. Check credit
const creditLimit = await credit.getCreditLimit(wallet.address);
console.log(`Credit: ${ethers.formatUnits(creditLimit, 6)} USDC`);

// 4. Create escrow with credit
const tx = await escrow.createAndFund(
  payeeAddress,
  ethers.parseUnits('100', 6),
  'Service payment',
  true // use credit
);
const receipt = await tx.wait();

// 5. Release payment
await escrow.release(escrowId);

// 6. Rate counterparty
await escrow.rate(escrowId, payeeAddress, 95, 0, 'Excellent service!');
```

## Backward Compatibility

V3 SDK maintains full backward compatibility with V1/V2 exports:

```typescript
// V1/V2 still works
import { LobsterAgent, createLobsterAgent } from 'pay-lobster';

// V3 new features
import { createV3Contracts } from 'pay-lobster';
```

## Migration from V2

If you're using Pay Lobster SDK v2.x, no changes are required. V3 adds new functionality without breaking existing code:

1. Update package: `npm install pay-lobster@3.0.0`
2. Existing V1/V2 code continues to work
3. Import V3 contracts when you need advanced features

## Resources

- **Website**: https://paylobster.com
- **GitHub**: https://github.com/itsGustav/Pay-Lobster
- **Base Explorer**: https://basescan.org
- **NPM**: https://www.npmjs.com/package/pay-lobster

## Support

For issues or questions:
- Open an issue on GitHub
- Email: realtorjakub@gmail.com
- Twitter: @PayLobster

---

**Version**: 3.0.0  
**License**: MIT  
**Author**: Jakub Adamowicz
