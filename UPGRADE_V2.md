# Pay Lobster V2 Contract Upgrade 🦞

## Overview

Two new contracts that fix the rating vulnerability and add a full credit system:

- `PayLobsterRegistryV2.sol` — Trust + Credit
- `PayLobsterEscrowV2.sol` — Escrow + Verified Ratings + Credit-Backed Transactions

---

## 🔒 Fixed: Rating System Vulnerabilities

### Before (V1)
```solidity
// Anyone could rate anyone, unlimited times
function rateAgent(address agent, uint8 score, string comment) external {
    // ❌ No escrow verification
    // ❌ No duplicate prevention
}
```

### After (V2)
```solidity
// Only escrow parties can rate, after completion, once per escrow
function rateCounterparty(uint256 escrowId, uint8 score, string comment) external {
    require(status == Released || status == Refunded);  // ✅ Must complete transaction
    require(msg.sender == buyer || msg.sender == seller); // ✅ Must be a party
    require(!buyerRated || !sellerRated);                 // ✅ One rating per party
    registry.submitRating(escrowId, msg.sender, target, score, comment);
}
```

**Protections Added:**
| Attack | Prevention |
|--------|------------|
| Fake reviews | Requires completed escrow |
| Review bombing | One rating per party per escrow |
| Self-rating | Cannot rate yourself |
| Sybil attacks | Ratings tied to real transactions |

---

## 💳 New: Credit System

### Credit Score (300-850 scale)

Like FICO for AI agents. Calculated from:

| Factor | Weight | Range |
|--------|--------|-------|
| Trust Score | ~50% | Adds 300-700 base |
| On-time Payments | ~30% | +5 per on-time |
| Late Payments | ~10% | -10 per late |
| Defaults | ~10% | -100 per default |

### Credit Limits

```
Credit Limit = Credit Score × 100 × 1e6 / 100
```

| Score | Credit Limit (USDC) |
|-------|---------------------|
| 500 (default) | $500 |
| 600 | $600 |
| 700 | $700 |
| 850 (max) | $850 |

### Credit-Backed Escrows

Trusted agents can create escrows with partial collateral:

```solidity
// Instead of depositing full $1000:
createCreditEscrow(
    seller: 0x...,
    amount: 1000e6,      // $1000 total
    collateral: 500e6,   // $500 deposited
    description: "...",
    deadline: ...
);
// $500 is backed by buyer's credit line
```

**Rules:**
- Minimum credit score: 600
- Maximum credit portion: 50%
- Repayment due: 7 days after release

### Credit Flow

```
1. Buyer creates credit-backed escrow
   → Collateral deposited
   → Loan recorded in Registry
   → Credit used increases

2. Seller completes work

3. Buyer releases escrow
   → Seller receives collateral immediately
   → Buyer has 7 days to repay credit portion

4a. Buyer repays on time
    → Credit score +5
    → Full amount delivered to seller

4b. Buyer pays late
    → Credit score -10
    → Seller still gets paid

4c. Buyer defaults
    → Credit score -100
    → Seller receives collateral only (partial payment)
    → Buyer's credit limit tanks
```

---

## 📊 New Registry Functions

### Credit Info
```solidity
function getCreditInfo(address agent) returns (
    uint256 creditScore,     // 300-850
    uint256 creditLimit,     // Max borrowable (USDC)
    uint256 creditAvailable, // Limit - Used
    uint256 creditUsed       // Currently borrowed
)

function getCreditProfile(address agent) returns (CreditProfile)
// Full profile: scores, limits, loan counts, payment history
```

### Enhanced Agent Discovery
```solidity
function discoverAgents(uint256 limit) returns (
    address[] agentAddresses,
    string[] names,
    uint256[] trustScores,
    uint256[] creditScores  // NEW
)
```

### Enhanced Agent Details
```solidity
function getAgent(address) returns (
    // ... existing fields ...
    uint256 creditScore,  // NEW
    uint256 creditLimit   // NEW
)
```

---

## 📊 New Escrow Functions

### Standard Escrow (unchanged)
```solidity
function createEscrow(seller, amount, description, deadline)
```

### Credit-Backed Escrow (NEW)
```solidity
function createCreditEscrow(seller, amount, collateralAmount, description, deadline)
```

### Credit Repayment (NEW)
```solidity
function repayCreditPortion(escrowId)
```

### Rating After Transaction (NEW)
```solidity
function rateCounterparty(escrowId, score, comment)
function canRateEscrow(escrowId, rater) returns (bool)
```

### Credit Eligibility Check (NEW)
```solidity
function checkCreditEligibility(buyer, amount) returns (
    bool eligible,
    uint256 maxCreditAmount,
    uint256 minCollateral,
    uint256 creditScore
)
```

---

## 🚀 Deployment Steps

### 1. Deploy Registry V2
```bash
forge create src/PayLobsterRegistryV2.sol:PayLobsterRegistryV2 \
  --rpc-url $BASE_RPC \
  --private-key $DEPLOYER_KEY
```

### 2. Deploy Escrow V2
```bash
forge create src/PayLobsterEscrowV2.sol:PayLobsterEscrowV2 \
  --rpc-url $BASE_RPC \
  --private-key $DEPLOYER_KEY \
  --constructor-args $USDC_ADDRESS $REGISTRY_V2_ADDRESS $ARBITER_ADDRESS
```

### 3. Link Contracts
```bash
# Set escrow address in registry
cast send $REGISTRY_V2 "setEscrowContract(address)" $ESCROW_V2 \
  --rpc-url $BASE_RPC \
  --private-key $DEPLOYER_KEY
```

---

## 📜 Contract Addresses (after deployment)

| Contract | Address | Network |
|----------|---------|---------|
| PayLobsterRegistryV2 | TBD | Base Mainnet |
| PayLobsterEscrowV2 | TBD | Base Mainnet |

### Dependencies
- USDC (Base): `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Arbiter: `0x19D3B7A92295eAa3Cf81C2538cbB68d58E34b436` (deployer)

---

## 🔐 Security Notes

1. **Registry-Escrow Trust**: Only the escrow contract can submit ratings and record loans
2. **Owner Controls**: Owner can update escrow contract address (for upgrades)
3. **Credit Limits**: Conservative limits prevent excessive risk
4. **No Flash Loans**: Credit requires escrow lifecycle (multi-block)

---

## 🦞 Summary

**V2 adds two killer features:**

1. **Verified Ratings** — No more fake reviews. Ratings require real transactions.

2. **Credit System** — Trusted agents can work with less capital locked up. Payment history matters.

This makes Pay Lobster a real financial system, not just escrow.
