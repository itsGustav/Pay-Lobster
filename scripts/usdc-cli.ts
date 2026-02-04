#!/usr/bin/env npx ts-node
/**
 * USDC Agent CLI
 * 
 * Command-line interface for USDC operations via Circle Programmable Wallets.
 * 
 * Usage:
 *   npx ts-node usdc-cli.ts balance
 *   npx ts-node usdc-cli.ts send 10 to 0x1234...
 *   npx ts-node usdc-cli.ts receive
 *   npx ts-node usdc-cli.ts bridge 25 from ETH to MATIC
 */

import { CircleClient, CHAIN_NAMES, USDC_TOKENS } from '../lib/circle-client';

// Load config from environment or Clawdbot config
function loadConfig(): { apiKey: string; entitySecret: string } {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey || !entitySecret) {
    console.error('❌ Missing Circle credentials.');
    console.error('Set CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET environment variables.');
    console.error('Get credentials at: https://console.circle.com');
    process.exit(1);
  }

  return { apiKey, entitySecret };
}

// Initialize client
function getClient(): CircleClient {
  const config = loadConfig();
  return new CircleClient(config);
}

// Commands
async function balance() {
  console.log('💰 Checking USDC balances...\n');
  
  const client = getClient();
  const balances = await client.getAllUSDCBalances();

  if (balances.length === 0) {
    console.log('No wallets found. Create one first with: usdc-cli setup');
    return;
  }

  let total = 0;
  for (const { wallet, balance, chain } of balances) {
    const amt = parseFloat(balance);
    total += amt;
    console.log(`  ${CHAIN_NAMES[chain] || chain}: ${CircleClient.formatUSDC(balance)}`);
    console.log(`    Address: ${wallet.address}`);
  }

  console.log(`\n📊 Total: ${CircleClient.formatUSDC(total.toString())}`);
}

async function send(args: string[]) {
  // Parse: send <amount> to <address> [on <chain>]
  const amountIdx = args.indexOf('send') + 1;
  const toIdx = args.indexOf('to');
  const onIdx = args.indexOf('on');

  if (toIdx === -1 || amountIdx >= args.length) {
    console.error('Usage: usdc-cli send <amount> to <address> [on <chain>]');
    process.exit(1);
  }

  const amount = args[amountIdx];
  const toAddress = args[toIdx + 1];
  const chain = onIdx !== -1 ? args[onIdx + 1]?.toUpperCase() : undefined;

  if (!CircleClient.isValidAddress(toAddress)) {
    console.error('❌ Invalid address format');
    process.exit(1);
  }

  console.log(`📤 Sending ${amount} USDC to ${toAddress}...`);

  const client = getClient();
  
  // Get first wallet (or filter by chain)
  const wallets = await client.listWallets();
  const wallet = chain 
    ? wallets.find(w => w.blockchain.includes(chain))
    : wallets[0];

  if (!wallet) {
    console.error('❌ No wallet found for the specified chain');
    process.exit(1);
  }

  const tx = await client.sendUSDC({
    fromWalletId: wallet.id,
    toAddress,
    amount,
  });

  console.log('\n✅ Transaction submitted!');
  console.log(`  Amount: ${CircleClient.formatUSDC(amount)}`);
  console.log(`  To: ${toAddress}`);
  console.log(`  Network: ${CHAIN_NAMES[wallet.blockchain] || wallet.blockchain}`);
  console.log(`  TX ID: ${tx.id}`);
  console.log(`  Status: ${tx.state}`);
  
  if (tx.txHash) {
    console.log(`  TX Hash: ${tx.txHash}`);
  }
}

async function receive() {
  console.log('📥 Your USDC receiving addresses:\n');

  const client = getClient();
  const wallets = await client.listWallets();

  if (wallets.length === 0) {
    console.log('No wallets found. Create one first with: usdc-cli setup');
    return;
  }

  for (const wallet of wallets) {
    const chainName = CHAIN_NAMES[wallet.blockchain] || wallet.blockchain;
    console.log(`  ${chainName}:`);
    console.log(`    ${wallet.address}`);
  }

  console.log('\n💡 Send USDC on any supported network to receive funds.');
}

async function bridge(args: string[]) {
  // Parse: bridge <amount> from <chain> to <chain>
  const amountIdx = args.indexOf('bridge') + 1;
  const fromIdx = args.indexOf('from');
  const toIdx = args.indexOf('to');

  if (fromIdx === -1 || toIdx === -1 || amountIdx >= args.length) {
    console.error('Usage: usdc-cli bridge <amount> from <chain> to <chain>');
    console.error('Example: usdc-cli bridge 25 from ETH to MATIC');
    process.exit(1);
  }

  const amount = args[amountIdx];
  const fromChain = normalizeChain(args[fromIdx + 1]);
  const toChain = normalizeChain(args[toIdx + 1]);

  console.log(`🌉 Bridging ${amount} USDC from ${CHAIN_NAMES[fromChain]} to ${CHAIN_NAMES[toChain]}...`);

  const client = getClient();
  const wallets = await client.listWallets();
  
  const sourceWallet = wallets.find(w => w.blockchain === fromChain);
  const destWallet = wallets.find(w => w.blockchain === toChain);

  if (!sourceWallet) {
    console.error(`❌ No wallet found for ${fromChain}`);
    process.exit(1);
  }

  const destAddress = destWallet?.address || sourceWallet.address;

  const tx = await client.bridgeUSDC({
    fromWalletId: sourceWallet.id,
    toAddress: destAddress,
    fromChain,
    toChain,
    amount,
  });

  console.log('\n✅ Bridge transfer initiated!');
  console.log(`  Amount: ${CircleClient.formatUSDC(amount)}`);
  console.log(`  From: ${CHAIN_NAMES[fromChain]}`);
  console.log(`  To: ${CHAIN_NAMES[toChain]}`);
  console.log(`  TX ID: ${tx.id}`);
  console.log(`  Est. time: ~15-20 minutes`);
}

async function history() {
  console.log('📜 Recent transactions:\n');

  const client = getClient();
  const transactions = await client.listTransactions();

  if (transactions.length === 0) {
    console.log('No transactions found.');
    return;
  }

  for (const tx of transactions.slice(0, 10)) {
    const direction = tx.amounts[0]?.startsWith('-') ? '📤' : '📥';
    console.log(`${direction} ${tx.amounts.join(', ')} USDC`);
    console.log(`   ${tx.sourceAddress} → ${tx.destinationAddress}`);
    console.log(`   Status: ${tx.state} | ${tx.createDate}`);
    if (tx.txHash) console.log(`   Hash: ${tx.txHash}`);
    console.log();
  }
}

async function setup() {
  console.log('🔧 Setting up USDC wallets...\n');

  const client = getClient();

  // Create wallet set
  console.log('Creating wallet set...');
  const walletSet = await client.createWalletSet('Clawdbot USDC Wallets');
  console.log(`  ✓ Wallet Set ID: ${walletSet.id}`);

  // Create wallets on multiple chains
  const chains = ['ETH-SEPOLIA', 'MATIC-AMOY', 'AVAX-FUJI'];
  console.log('\nCreating wallets...');
  
  const wallets = await client.createWallets(walletSet.id, chains, 1);
  
  for (const wallet of wallets) {
    console.log(`  ✓ ${CHAIN_NAMES[wallet.blockchain]}: ${wallet.address}`);
  }

  console.log('\n✅ Setup complete!');
  console.log('\n💡 Get testnet USDC from: https://console.circle.com/faucets');
}

async function wallets() {
  console.log('👛 Managed wallets:\n');

  const client = getClient();
  const walletList = await client.listWallets();

  if (walletList.length === 0) {
    console.log('No wallets found. Run: usdc-cli setup');
    return;
  }

  for (const wallet of walletList) {
    console.log(`  ${CHAIN_NAMES[wallet.blockchain] || wallet.blockchain}`);
    console.log(`    ID: ${wallet.id}`);
    console.log(`    Address: ${wallet.address}`);
    console.log(`    State: ${wallet.state}`);
    console.log();
  }
}

function normalizeChain(input: string): string {
  const map: Record<string, string> = {
    'eth': 'ETH-SEPOLIA',
    'ethereum': 'ETH-SEPOLIA',
    'matic': 'MATIC-AMOY',
    'polygon': 'MATIC-AMOY',
    'avax': 'AVAX-FUJI',
    'avalanche': 'AVAX-FUJI',
    'arb': 'ARB-SEPOLIA',
    'arbitrum': 'ARB-SEPOLIA',
  };
  return map[input.toLowerCase()] || input.toUpperCase();
}

async function x402Pay(args: string[]) {
  // x402 pay <url>
  const urlIdx = args.indexOf('pay') + 1;
  if (urlIdx >= args.length) {
    console.error('Usage: usdc-cli x402 pay <url>');
    process.exit(1);
  }

  const url = args[urlIdx];

  console.log(`💳 Fetching payment challenge from ${url}...`);

  try {
    // First request - get 402 challenge
    const response = await fetch(url);

    if (response.status !== 402) {
      console.log(`✅ No payment required (status: ${response.status})`);
      const data = await response.text();
      console.log(data);
      return;
    }

    const challenge = await response.json();
    const paymentInfo = challenge['x-payment-required'];

    if (!paymentInfo) {
      console.error('❌ Invalid 402 response: missing x-payment-required');
      process.exit(1);
    }

    console.log(`\n💳 Payment Required`);
    console.log(`   Amount: ${paymentInfo.amount} USDC`);
    console.log(`   Description: ${paymentInfo.description}`);
    console.log(`   Receiver: ${paymentInfo.receiver}`);
    console.log(`   Network: ${paymentInfo.network}`);

    console.log(`\nSending payment...`);

    const client = getClient();
    const wallets = await client.listWallets();
    const wallet = wallets.find(w => w.blockchain === paymentInfo.network);

    if (!wallet) {
      console.error(`❌ No wallet found for network ${paymentInfo.network}`);
      process.exit(1);
    }

    const tx = await client.sendUSDC({
      fromWalletId: wallet.id,
      toAddress: paymentInfo.receiver,
      amount: paymentInfo.amount,
    });

    console.log(`✅ Payment sent! TX: ${tx.txHash || tx.id}`);

    // Generate signature (simplified - production would use facilitator)
    const signature = `sig_${tx.txHash || tx.id}_${Date.now()}`;

    console.log(`\nRetrying request with payment signature...`);

    const retryResponse = await fetch(url, {
      headers: {
        'x-payment-signature': signature,
      },
    });

    if (retryResponse.ok) {
      console.log(`✅ Success! Response received.\n`);
      const data = await retryResponse.text();
      console.log(data);
    } else {
      console.error(`❌ Request failed: ${retryResponse.status} ${retryResponse.statusText}`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function x402Auto(args: string[]) {
  // x402 auto <url-pattern>
  const urlIdx = args.indexOf('auto') + 1;
  if (urlIdx >= args.length) {
    console.error('Usage: usdc-cli x402 auto <url-pattern>');
    process.exit(1);
  }

  const urlPattern = args[urlIdx];

  console.log(`🤖 Auto-pay mode enabled for: ${urlPattern}`);
  console.log(`   Max amount: 1.00 USDC per request`);
  console.log(`   All future requests to this pattern will auto-pay.`);
  console.log(`\n   (This is a demo - auto-pay config would be persisted)`);
}

async function x402Receipts() {
  console.log('📄 Recent 402 Payments:\n');
  console.log('─'.repeat(60));

  // Load receipts from x402-client cache
  const { X402Client } = await import('../lib/x402-client');
  const client = new X402Client({
    wallet: getClient(),
  });

  const receipts = await client.getReceiptHistory();

  if (receipts.length === 0) {
    console.log('No payment receipts found.');
    return;
  }

  let totalAmount = 0;
  for (const receipt of receipts.slice(0, 10)) {
    const amount = parseFloat(receipt.challenge.amount);
    totalAmount += amount;

    console.log(`📄 ${receipt.challenge.amount} USDC → ${receipt.url}`);
    console.log(`   ${receipt.challenge.description}`);
    console.log(`   Paid: ${new Date(receipt.paidAt).toLocaleString()}`);
    console.log(`   TX: ${receipt.txHash}`);
    console.log();
  }

  console.log('─'.repeat(60));
  console.log(`Total: ${totalAmount.toFixed(2)} USDC in ${receipts.length} payments`);
}

async function x402Command(args: string[]) {
  const subcommand = args[1]?.toLowerCase();

  switch (subcommand) {
    case 'pay':
      await x402Pay(args);
      break;
    case 'auto':
      await x402Auto(args);
      break;
    case 'receipts':
      await x402Receipts();
      break;
    default:
      console.log(`
x402 Payment Commands:

  usdc-cli x402 pay <url>        Pay for a 402-protected resource
  usdc-cli x402 auto <pattern>   Enable auto-pay for URL pattern
  usdc-cli x402 receipts         Show payment history

Examples:
  usdc-cli x402 pay https://api.example.com/premium
  usdc-cli x402 auto https://api.example.com/*
  usdc-cli x402 receipts
      `);
  }
}

function showHelp() {
  console.log(`
USDC Agent CLI - Manage USDC via Circle Programmable Wallets

Commands:
  balance              Check USDC balance across all wallets
  send <amt> to <addr> Send USDC to an address
  receive              Show your receiving addresses
  bridge <amt> from <chain> to <chain>
                       Cross-chain transfer via CCTP
  history              Recent transactions
  wallets              List managed wallets
  setup                Create initial wallet set

x402 Payment Commands:
  x402 pay <url>       Pay for a 402-protected resource
  x402 auto <pattern>  Enable auto-pay for URL pattern
  x402 receipts        Show payment history

Environment:
  CIRCLE_API_KEY       Your Circle API key
  CIRCLE_ENTITY_SECRET Your entity secret

Examples:
  usdc-cli balance
  usdc-cli send 10 to 0x1234...abcd
  usdc-cli bridge 25 from eth to matic
  usdc-cli receive
  usdc-cli x402 pay https://api.example.com/premium

Get credentials: https://console.circle.com
  `);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  try {
    switch (command) {
      case 'balance':
        await balance();
        break;
      case 'send':
        await send(args);
        break;
      case 'receive':
        await receive();
        break;
      case 'bridge':
        await bridge(args);
        break;
      case 'history':
        await history();
        break;
      case 'wallets':
        await wallets();
        break;
      case 'setup':
        await setup();
        break;
      case 'x402':
        await x402Command(args);
        break;
      case 'help':
      case '--help':
      case '-h':
      default:
        showHelp();
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
