# Pay Lobster Skill

Enable Clawdbot to interact with USDC on blockchain networks via Circle's Programmable Wallets API.

## Overview

This skill allows your Clawdbot to:
- 💰 **Check USDC balances** across multiple chains
- 📤 **Send USDC** to any address
- 📥 **Receive USDC** with generated addresses
- 🌉 **Cross-chain transfers** via Circle's CCTP
- 🤖 **Agent-to-agent payments** for autonomous commerce
- 🛡️ **Trust-gated transactions** with reputation checks (v3.1.0)
- 💸 **Spending limits** for safe autonomous operation (v3.1.0)

**Built for the Circle USDC Hackathon 2026** 🏆
**Version 3.1.0** — Now with autonomous agent safeguards!

## Requirements

### 1. Circle Developer Account
Sign up at: https://console.circle.com

### 2. API Key
Create in Console: Keys → Create a key → API key → Standard Key

### 3. Entity Secret
Register your entity secret for transaction signing.

## Configuration

Add to your Clawdbot config (`~/.clawdbot/clawdbot.json`):

```json
{
  "skills": {
    "entries": {
      "lobster-pay": {
        "apiKey": "YOUR_CIRCLE_API_KEY",
        "entitySecret": "YOUR_ENTITY_SECRET",
        "network": "testnet"
      }
    }
  }
}
```

Or set environment variables:
- `CIRCLE_API_KEY`
- `CIRCLE_ENTITY_SECRET`

## Supported Networks (Testnet)

| Chain | Network ID | USDC Contract |
|-------|------------|---------------|
| Ethereum Sepolia | ETH-SEPOLIA | Native USDC |
| Polygon Amoy | MATIC-AMOY | Native USDC |
| Avalanche Fuji | AVAX-FUJI | Native USDC |
| Arbitrum Sepolia | ARB-SEPOLIA | Native USDC |

## Usage

### Check Balance

```
User: Check my USDC balance
Agent: Your USDC balance across all wallets:
       - Ethereum Sepolia: 100.00 USDC
       - Polygon Amoy: 50.00 USDC
       Total: 150.00 USDC
```

### Send USDC

```
User: Send 10 USDC to 0x1234...abcd on Polygon
Agent: ✅ Transaction submitted!
       Amount: 10.00 USDC
       To: 0x1234...abcd
       Network: Polygon Amoy
       TX Hash: 0xabc123...
       Status: Confirmed
```

### Get Receive Address

```
User: Give me an address to receive USDC
Agent: Send USDC to this address:
       0x9876...wxyz (Ethereum Sepolia)
       
       Supported networks: ETH, MATIC, AVAX, ARB
```

### Cross-Chain Transfer (CCTP)

```
User: Bridge 25 USDC from Ethereum to Polygon
Agent: 🌉 Cross-chain transfer initiated via CCTP
       From: Ethereum Sepolia
       To: Polygon Amoy
       Amount: 25.00 USDC
       Est. time: ~15 minutes
```

## Commands

| Command | Description |
|---------|-------------|
| `usdc balance` | Check USDC balance across all wallets |
| `usdc send <amount> to <address>` | Send USDC |
| `usdc receive` | Get deposit address |
| `usdc bridge <amount> from <chain> to <chain>` | Cross-chain transfer |
| `usdc history` | Recent transactions |
| `usdc wallets` | List all managed wallets |

## Triggers

The skill activates on phrases like:
- "Check my USDC balance"
- "Send USDC..."
- "Transfer USDC..."
- "Bridge USDC..."
- "What's my wallet address?"
- "USDC balance"

## Autonomous Agent Features (v3.1.0)

### Trust-Gated Payments

Automatically reject transactions to low-reputation agents. Configure minimum trust scores and tiers to ensure safe autonomous operation.

**Configuration:**
```bash
# Check current trust-gate config
paylobster trust-gate status

# Enable trust-gating with minimum score
paylobster trust-gate set --enable --min-score 650

# Set minimum tier requirement
paylobster trust-gate set --min-tier GOOD

# Allow unscored agents (new agents with no history)
paylobster trust-gate set --allow-unscored

# Add exception (whitelist trusted address)
paylobster trust-gate add-exception 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Remove exception
paylobster trust-gate remove-exception 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Trust Tiers:**
- **STANDARD** (0-399) - New agents, limited history
- **BUILDING** (400-599) - Establishing reputation
- **GOOD** (600-749) - Reliable, eligible for credit
- **EXCELLENT** (750-899) - Highly trusted
- **ELITE** (900-1000) - Top-tier reputation

**Library Usage:**
```typescript
import { checkTrustGate, sendWithTrustGate } from 'pay-lobster';

// Check if recipient passes trust gate
const result = await checkTrustGate(
  recipientAddress,
  provider,
  config.trustGate
);

if (!result.allowed) {
  console.log(`Blocked: ${result.reason}`);
  console.log(`Score: ${result.score}`);
}

// Wrapper that checks both trust-gate and spending limits
const check = await sendWithTrustGate(
  recipientAddress,
  amount,
  provider,
  autonomousConfig
);

if (check.allowed) {
  // Proceed with payment
  await agent.transfer(recipientAddress, amount);
  recordSpending(recipientAddress, amount, txHash);
}
```

### Spending Limits

Set global and per-agent spending limits to control autonomous agent expenditure. Supports transaction, daily, weekly, and monthly caps.

**Configuration:**
```bash
# Check current limits and usage
paylobster limits status

# Set global limits
paylobster limits set-global --enable
paylobster limits set-global --max-tx 1000 --daily 5000 --weekly 20000

# Set per-agent limits
paylobster limits set 0xABC... --max-tx 500 --daily 2000 --monthly 10000

# Set lifetime limit to specific agent
paylobster limits set 0xABC... --total 50000

# Remove per-agent limits
paylobster limits remove 0xABC...

# View spending history
paylobster limits history 50
```

**Library Usage:**
```typescript
import { 
  checkSpendingLimit, 
  recordSpending,
  getSpendingSummary 
} from 'pay-lobster';

// Check if payment would exceed limits
const result = await checkSpendingLimit(
  recipientAddress,
  amount,
  config.spending
);

if (!result.allowed) {
  console.log(`Blocked: ${result.reason}`);
  if (result.remaining) {
    console.log('Remaining limits:', result.remaining);
  }
}

// After successful payment, record it
recordSpending(recipientAddress, amount, txHash);

// Get spending summary
const summary = getSpendingSummary(recipientAddress);
console.log(`Daily: ${summary.daily}`);
console.log(`Weekly: ${summary.weekly}`);
console.log(`Monthly: ${summary.monthly}`);
console.log(`Total: ${summary.total} (${summary.count} transactions)`);
```

### Audit Logging

All trust-gate and spending limit decisions are automatically logged to `~/.paylobster/audit.log` for compliance and debugging.

**View audit log:**
```typescript
import { getAuditLog } from 'pay-lobster';

const recentEntries = getAuditLog(100); // Last 100 entries
recentEntries.forEach(entry => console.log(entry));
```

### Configuration Files

Autonomous agent configuration is stored in `~/.paylobster/`:

- **`autonomous.json`** - Trust-gate and spending limit config
- **`spending-history.json`** - Transaction history for limit tracking
- **`audit.log`** - Decision log (allowed/blocked with reasons)

**Example autonomous.json:**
```json
{
  "trustGate": {
    "enabled": true,
    "minScore": 600,
    "minTier": "GOOD",
    "allowUnscored": false,
    "exceptions": ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"]
  },
  "spending": {
    "enabled": true,
    "globalLimits": {
      "maxTransaction": "1000000000",
      "dailyLimit": "5000000000",
      "weeklyLimit": "20000000000",
      "monthlyLimit": "50000000000"
    },
    "perAgent": {
      "0xabc...": {
        "address": "0xabc...",
        "maxAmount": "500000000",
        "dailyLimit": "2000000000",
        "totalLimit": "50000000000"
      }
    }
  },
  "version": "3.1.0"
}
```

### Safety Best Practices

1. **Start conservative** - Begin with low limits and gradually increase
2. **Monitor audit logs** - Review blocked transactions regularly
3. **Use exceptions wisely** - Only whitelist thoroughly vetted addresses
4. **Test with dry-run** - Always test payment logic before deploying
5. **Combine safeguards** - Use both trust-gating AND spending limits
6. **Regular reviews** - Check spending history weekly

## Security

⚠️ **TESTNET ONLY** — This skill is configured for testnet by default.

- Never use mainnet credentials in automated agents
- API keys should have minimal required permissions
- Entity secrets must be kept secure
- All transactions require proper authentication

## Architecture

```
┌─────────────────────────────────────────┐
│           Clawdbot Agent                │
│  (Claude/GPT interpreting user intent)  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          Pay Lobster Skill               │
│   - Balance queries                     │
│   - Transaction creation                │
│   - Wallet management                   │
│   - CCTP bridge calls                   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│     Circle Programmable Wallets API     │
│   - Developer-controlled wallets        │
│   - Transaction signing                 │
│   - Multi-chain support                 │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           Blockchain Networks           │
│   ETH | MATIC | AVAX | ARB (testnet)    │
└─────────────────────────────────────────┘
```

## API Reference

### CircleClient

```typescript
import { CircleClient } from './lib/circle-client';

const client = new CircleClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

// Get balance
const balance = await client.getBalance(walletId);

// Send USDC
const tx = await client.sendUSDC({
  fromWalletId: 'wallet-123',
  toAddress: '0x...',
  amount: '10.00',
  chain: 'MATIC-AMOY',
});

// Bridge via CCTP
const bridge = await client.bridgeUSDC({
  fromChain: 'ETH-SEPOLIA',
  toChain: 'MATIC-AMOY',
  amount: '25.00',
});
```

## Testnet Faucets

Get testnet USDC from Circle's Developer Console:
https://console.circle.com/faucets

Or use the CLI:
```bash
npx lobster-pay faucet --chain ETH-SEPOLIA --amount 100
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `INSUFFICIENT_BALANCE` | Not enough USDC | Top up via faucet |
| `INVALID_ADDRESS` | Bad destination | Verify address format |
| `RATE_LIMITED` | Too many requests | Wait and retry |
| `AUTH_FAILED` | Bad API key | Check credentials |

## Hackathon Submission

**Track:** Best OpenClaw Skill
**Prize:** $10,000 USDC

This skill demonstrates:
1. ✅ Novel OpenClaw skill for USDC interaction
2. ✅ Circle Programmable Wallets integration
3. ✅ Testnet-safe operation
4. ✅ Real utility for Clawdbot operators

## Resources

- [Circle Developer Docs](https://developers.circle.com)
- [Programmable Wallets API](https://developers.circle.com/wallets)
- [CCTP Documentation](https://developers.circle.com/stablecoins/cctp)
- [Clawdbot Skills Guide](https://docs.clawd.bot/skills)

## License

MIT — Built for the OpenClaw community 🦞
