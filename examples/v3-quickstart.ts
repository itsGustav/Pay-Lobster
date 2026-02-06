/**
 * Pay Lobster SDK V3 Quick Start Example
 * Shows how to use the new V3 contract wrappers
 */

import { ethers } from 'ethers';
import {
  PayLobsterIdentity,
  PayLobsterReputation,
  PayLobsterCredit,
  PayLobsterEscrow,
  createV3Contracts,
  V3_ADDRESSES,
  type AgentMetadata,
} from '../lib/contracts-v3';

async function main() {
  // Connect to Base mainnet
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);

  console.log('🦞 Pay Lobster SDK V3');
  console.log('=====================\n');

  // Option 1: Create all contracts at once
  const { identity, reputation, credit, escrow } = createV3Contracts(wallet);

  // Option 2: Create individual contracts
  // const identity = new PayLobsterIdentity(wallet);
  // const reputation = new PayLobsterReputation(wallet);
  // const credit = new PayLobsterCredit(wallet);
  // const escrow = new PayLobsterEscrow(wallet);

  console.log('📍 Contract Addresses:');
  console.log(`   Identity:   ${V3_ADDRESSES.Identity}`);
  console.log(`   Reputation: ${V3_ADDRESSES.Reputation}`);
  console.log(`   Credit:     ${V3_ADDRESSES.Credit}`);
  console.log(`   Escrow:     ${V3_ADDRESSES.Escrow}`);
  console.log(`   USDC:       ${V3_ADDRESSES.USDC}\n`);

  // ============================================
  // 1. Identity - Register an Agent
  // ============================================
  console.log('🆔 Identity System');
  console.log('------------------');

  const agentAddress = wallet.address;
  const isRegistered = await identity.isRegistered(agentAddress);
  console.log(`   Registered: ${isRegistered}`);

  if (!isRegistered) {
    console.log('   Registering agent...');
    const metadata: AgentMetadata = {
      name: 'My AI Agent',
      description: 'An autonomous payment agent',
      category: 'payment-processor',
      capabilities: ['escrow', 'recurring-payments', 'invoicing'],
      contact: 'agent@example.com',
    };
    
    try {
      const tx = await identity.register(metadata);
      await tx.wait();
      console.log('   ✅ Agent registered!');
    } catch (error) {
      console.log('   ⚠️  Registration failed:', (error as Error).message);
    }
  } else {
    const agent = await identity.getAgent(agentAddress);
    if (agent) {
      console.log(`   Agent ID: ${agent.id}`);
      console.log(`   Name: ${agent.metadata.name}`);
      console.log(`   Active: ${agent.active}`);
    }
  }

  const totalAgents = await identity.getTotalAgents();
  console.log(`   Total Agents: ${totalAgents}\n`);

  // ============================================
  // 2. Reputation - Check Trust Score
  // ============================================
  console.log('⭐ Reputation System');
  console.log('--------------------');

  const trustScore = await reputation.getTrustScore(agentAddress);
  console.log(`   Trust Score: ${trustScore}/1000`);

  const trustVector = await reputation.getTrustVector(agentAddress);
  console.log('   Trust Vector:');
  console.log(`     Payment:  ${trustVector.payment}/1000`);
  console.log(`     Delivery: ${trustVector.delivery}/1000`);
  console.log(`     Quality:  ${trustVector.quality}/1000`);
  console.log(`     Response: ${trustVector.response}/1000`);
  console.log(`     Security: ${trustVector.security}/1000`);

  const feedbackCount = await reputation.getFeedbackCount(agentAddress);
  console.log(`   Total Feedback: ${feedbackCount}\n`);

  // ============================================
  // 3. Credit - Check Credit Score & Limit
  // ============================================
  console.log('💳 Credit System');
  console.log('----------------');

  const creditScore = await credit.getScore(agentAddress);
  console.log(`   Credit Score: ${creditScore}/1000`);

  const creditLimit = await credit.getCreditLimit(agentAddress);
  console.log(`   Credit Limit: ${ethers.formatUnits(creditLimit, 6)} USDC`);

  const availableCredit = await credit.getAvailableCredit(agentAddress);
  console.log(`   Available: ${ethers.formatUnits(availableCredit, 6)} USDC`);

  const hasDebt = await credit.hasActiveDebt(agentAddress);
  console.log(`   Active Debt: ${hasDebt ? 'Yes' : 'No'}`);

  if (hasDebt) {
    const activeLoans = await credit.getActiveLoans(agentAddress);
    console.log(`   Active Loans: ${activeLoans.length}`);
    activeLoans.forEach((loan, i) => {
      console.log(`     Loan ${i + 1}: ${ethers.formatUnits(loan.amount, 6)} USDC`);
    });
  }

  const profile = await credit.getProfile(agentAddress);
  console.log('   Profile:');
  console.log(`     Total Borrowed: ${ethers.formatUnits(profile.totalBorrowed, 6)} USDC`);
  console.log(`     Total Repaid:   ${ethers.formatUnits(profile.totalRepaid, 6)} USDC`);
  console.log(`     Defaults:       ${profile.defaultCount}\n`);

  // ============================================
  // 4. Escrow - Create Payment
  // ============================================
  console.log('🔒 Escrow System');
  console.log('----------------');

  // Example: Create escrow (read-only for demo)
  const payeeAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'; // Example payee
  const amount = ethers.parseUnits('10', 6); // 10 USDC

  console.log('   Example Escrow Creation:');
  console.log(`     Payee:  ${payeeAddress}`);
  console.log(`     Amount: ${ethers.formatUnits(amount, 6)} USDC`);
  console.log(`     Status: Ready to create\n`);

  // Uncomment to actually create an escrow:
  // const tx = await escrow.createAndFund(
  //   payeeAddress,
  //   amount,
  //   'Payment for services',
  //   false, // useCredit
  //   JSON.stringify({ invoiceId: '123' })
  // );
  // const receipt = await tx.wait();
  // console.log('   ✅ Escrow created!');

  console.log('🎉 V3 SDK Demo Complete!\n');
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main };
