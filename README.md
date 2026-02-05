# Pay Lobster 🦞

**Multi-chain USDC payment infrastructure for AI agents.**

The Stripe for autonomous entities. Send, receive, escrow, and build reputation — all through chat commands.

[![npm version](https://img.shields.io/npm/v/pay-lobster.svg)](https://www.npmjs.com/package/pay-lobster)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ What's New in v2.0

- **Multi-chain**: Base (Ethereum L2) + Solana support
- **x402 Protocol**: Automatic HTTP payment handling
- **Chain selection**: Choose which chain per transaction
- **Backwards compatible**: Existing v1.x code still works

## 🚀 Quick Start

```bash
npm install pay-lobster
```

### Single Chain (Base)

```typescript
import { LobsterAgent } from 'pay-lobster';

const agent = new LobsterAgent({
  privateKey: process.env.PRIVATE_KEY,
});

await agent.initialize();

// Check balance
const balance = await agent.getBalance();
console.log(`Balance: $${balance} USDC`);

// Send payment
await agent.send('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5', 10);
```

### Multi-Chain (Base + Solana)

```typescript
import { MultiChainLobsterAgent } from 'pay-lobster';

const agent = new MultiChainLobsterAgent({
  chains: {
    base: { privateKey: process.env.BASE_PRIVATE_KEY },
    solana: { privateKey: process.env.SOLANA_PRIVATE_KEY },
  },
  defaultChain: 'base',
  x402: {
    enabled: true,
    maxAutoPayUSDC: 10,
  },
});

await agent.initialize();

// Send on Base
await agent.send('0x...', 10, { chain: 'base' });

// Send on Solana
await agent.send('7xKXtg2CW...', 10, { chain: 'solana' });

// Get balances on all chains
const balances = await agent.getAllBalances();
```

### x402 Protocol

Auto-pay for APIs that return `402 Payment Required`:

```typescript
const response = await agent.payX402('https://api.example.com/premium');
const data = await response.json();
```

## 📦 Features

### Core Payments
- ✅ Send/receive USDC on Base & Solana
- ✅ Real-time balance queries
- ✅ Transaction history
- ✅ Username resolution (@handles)

### Escrow (Base)
- ✅ Create trustless escrows
- ✅ Release/refund/dispute
- ✅ On-chain smart contracts

### Trust & Discovery (Base)
- ✅ On-chain agent registry
- ✅ Trust scores & ratings
- ✅ Agent discovery

### Advanced
- ✅ Subscriptions (recurring payments)
- ✅ Invoices (payment requests)
- ✅ Splits (pay multiple recipients)
- ✅ Gamification (badges, streaks)

## 🔗 Smart Contracts

### Base Mainnet
| Contract | Address |
|----------|---------|
| PayLobsterEscrow | `0xa091fC821c85Dfd2b2B3EF9e22c5f4c8B8A24525` |
| PayLobsterRegistry | `0x10BCa62Ce136A70F914c56D97e491a85d1e050E7` |

### Solana
Coming in v2.1 — currently supports direct USDC transfers via SPL tokens.

## 📚 Documentation

- [Website](https://paylobster.com)
- [API Docs](https://paylobster.com/docs)
- [Multi-Chain Guide](./MULTICHAIN.md)
- [x402 Protocol Spec](./X402-SPEC.md)
- [Quick Start](./QUICKSTART-MULTICHAIN.md)

## 🎯 Use Cases

### AI Agent Payments
```typescript
// Accept tips for services
const balance = await agent.getBalance();
console.log(`Earned $${balance} USDC from tips!`);
```

### Agent-to-Agent Commerce
```typescript
// Pay another agent for compute/data
await agent.send('@compute-agent', 5);
```

### Trustless Escrow
```typescript
// Create escrow for freelance work
await agent.createEscrow({
  recipient: '0x...',
  amount: '100',
  description: 'Website development',
});
```

### Pay-Per-Request APIs
```typescript
// Automatically pay for premium API access
const response = await agent.payX402('https://api.example.com/generate');
```

## 🏆 Hackathons

- **Circle USDC Hackathon** (Feb 8, 2026) - Best OpenClaw Skill
- **Colosseum Agent Hackathon** (Feb 12, 2026) - $100K prizes

## 🤝 Contributing

PRs welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📄 License

MIT — See [LICENSE](./LICENSE).

---

**Built for the AI agent economy.** 🦞

Website: [paylobster.com](https://paylobster.com)  
npm: [pay-lobster](https://www.npmjs.com/package/pay-lobster)  
GitHub: [itsGustav/Pay-Lobster](https://github.com/itsGustav/Pay-Lobster)
