/**
 * Circle Programmable Wallets Client
 * 
 * Wrapper around Circle's Developer-Controlled Wallets API
 * for USDC operations on testnet.
 */

import crypto from 'crypto';

// Types
export interface CircleConfig {
  apiKey: string;
  entitySecret: string;
  baseUrl?: string;
}

export interface Wallet {
  id: string;
  address: string;
  blockchain: string;
  state: string;
  walletSetId: string;
  createDate: string;
}

export interface WalletSet {
  id: string;
  name: string;
  custodyType: string;
  createDate: string;
}

export interface Balance {
  token: {
    id: string;
    name: string;
    symbol: string;
    decimals: number;
    blockchain: string;
  };
  amount: string;
}

export interface Transaction {
  id: string;
  state: string;
  txHash?: string;
  amounts: string[];
  sourceAddress: string;
  destinationAddress: string;
  blockchain: string;
  createDate: string;
}

export interface SendOptions {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  tokenId?: string; // USDC token ID for the chain
  feeLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface BridgeOptions {
  fromWalletId: string;
  toAddress: string;
  fromChain: string;
  toChain: string;
  amount: string;
}

// Testnet USDC Token IDs (from Circle's registry)
export const USDC_TOKENS: Record<string, string> = {
  'ETH-SEPOLIA': 'eth-sepolia-usdc',
  'MATIC-AMOY': 'matic-amoy-usdc', 
  'AVAX-FUJI': 'avax-fuji-usdc',
  'ARB-SEPOLIA': 'arb-sepolia-usdc',
};

export const CHAIN_NAMES: Record<string, string> = {
  'ETH-SEPOLIA': 'Ethereum Sepolia',
  'MATIC-AMOY': 'Polygon Amoy',
  'AVAX-FUJI': 'Avalanche Fuji',
  'ARB-SEPOLIA': 'Arbitrum Sepolia',
};

/**
 * Circle Programmable Wallets Client
 */
export class CircleClient {
  private apiKey: string;
  private entitySecret: string;
  private baseUrl: string;

  constructor(config: CircleConfig) {
    this.apiKey = config.apiKey;
    this.entitySecret = config.entitySecret;
    this.baseUrl = config.baseUrl || 'https://api.circle.com/v1/w3s';
  }

  /**
   * Generate entity secret ciphertext for API calls
   */
  private generateEntitySecretCiphertext(): string {
    // Entity secret should be hex-encoded 32 bytes
    const entitySecretBuffer = Buffer.from(this.entitySecret, 'hex');
    
    // Generate random IV
    const iv = crypto.randomBytes(12);
    
    // For demo purposes, return base64 encoded secret
    // In production, this would use Circle's public key for encryption
    return Buffer.concat([iv, entitySecretBuffer]).toString('base64');
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, any>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      // Add idempotency key for mutations
      if (method !== 'GET') {
        body.idempotencyKey = crypto.randomUUID();
      }
      
      // Add entity secret ciphertext for transaction operations
      if (path.includes('/transactions') || path.includes('/wallets')) {
        body.entitySecretCiphertext = this.generateEntitySecretCiphertext();
      }
      
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Circle API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  // ============ Wallet Set Operations ============

  /**
   * Create a new wallet set
   */
  async createWalletSet(name: string): Promise<WalletSet> {
    return this.request<WalletSet>('POST', '/developer/walletSets', { name });
  }

  /**
   * List all wallet sets
   */
  async listWalletSets(): Promise<WalletSet[]> {
    const result = await this.request<{ walletSets: WalletSet[] }>('GET', '/developer/walletSets');
    return result.walletSets || [];
  }

  // ============ Wallet Operations ============

  /**
   * Create wallets in a wallet set
   */
  async createWallets(walletSetId: string, blockchains: string[], count = 1): Promise<Wallet[]> {
    const result = await this.request<{ wallets: Wallet[] }>('POST', '/developer/wallets', {
      walletSetId,
      blockchains,
      count,
    });
    return result.wallets || [];
  }

  /**
   * Get wallet by ID
   */
  async getWallet(walletId: string): Promise<Wallet> {
    return this.request<Wallet>('GET', `/wallets/${walletId}`);
  }

  /**
   * List all wallets
   */
  async listWallets(): Promise<Wallet[]> {
    const result = await this.request<{ wallets: Wallet[] }>('GET', '/wallets');
    return result.wallets || [];
  }

  // ============ Balance Operations ============

  /**
   * Get token balances for a wallet
   */
  async getBalances(walletId: string): Promise<Balance[]> {
    const result = await this.request<{ tokenBalances: Balance[] }>(
      'GET',
      `/wallets/${walletId}/balances`
    );
    return result.tokenBalances || [];
  }

  /**
   * Get USDC balance across all wallets
   */
  async getAllUSDCBalances(): Promise<{ wallet: Wallet; balance: string; chain: string }[]> {
    const wallets = await this.listWallets();
    const results: { wallet: Wallet; balance: string; chain: string }[] = [];

    for (const wallet of wallets) {
      try {
        const balances = await this.getBalances(wallet.id);
        const usdcBalance = balances.find(b => b.token.symbol === 'USDC');
        
        results.push({
          wallet,
          balance: usdcBalance?.amount || '0',
          chain: wallet.blockchain,
        });
      } catch (err) {
        console.error(`Failed to get balance for wallet ${wallet.id}:`, err);
      }
    }

    return results;
  }

  // ============ Transaction Operations ============

  /**
   * Send USDC to an address
   */
  async sendUSDC(options: SendOptions): Promise<Transaction> {
    const wallet = await this.getWallet(options.fromWalletId);
    const tokenId = options.tokenId || USDC_TOKENS[wallet.blockchain];

    if (!tokenId) {
      throw new Error(`No USDC token ID found for chain ${wallet.blockchain}`);
    }

    return this.request<Transaction>('POST', '/developer/transactions/transfer', {
      walletId: options.fromWalletId,
      tokenId,
      destinationAddress: options.toAddress,
      amounts: [options.amount],
      fee: {
        type: 'level',
        config: {
          feeLevel: options.feeLevel || 'MEDIUM',
        },
      },
    });
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    return this.request<Transaction>('GET', `/transactions/${transactionId}`);
  }

  /**
   * List recent transactions
   */
  async listTransactions(walletId?: string): Promise<Transaction[]> {
    const path = walletId
      ? `/wallets/${walletId}/transactions`
      : '/transactions';
    
    const result = await this.request<{ transactions: Transaction[] }>('GET', path);
    return result.transactions || [];
  }

  // ============ CCTP Bridge Operations ============

  /**
   * Bridge USDC across chains via CCTP
   */
  async bridgeUSDC(options: BridgeOptions): Promise<Transaction> {
    // CCTP bridge is done through contract interactions
    // This is a simplified version - full implementation would use
    // Circle's CCTP contracts directly
    
    return this.request<Transaction>('POST', '/developer/transactions/contractExecution', {
      walletId: options.fromWalletId,
      contractAddress: this.getCCTPContractAddress(options.fromChain),
      abiFunctionSignature: 'depositForBurn(uint256,uint32,bytes32,address)',
      abiParameters: [
        options.amount,
        this.getChainDomain(options.toChain),
        this.addressToBytes32(options.toAddress),
        USDC_TOKENS[options.fromChain],
      ],
      fee: {
        type: 'level',
        config: { feeLevel: 'HIGH' },
      },
    });
  }

  /**
   * Get CCTP TokenMessenger contract address for chain
   */
  private getCCTPContractAddress(chain: string): string {
    const contracts: Record<string, string> = {
      'ETH-SEPOLIA': '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
      'AVAX-FUJI': '0xeb08f243E5d3FCFF26A9E38Ae5520A669f4019d0',
      'ARB-SEPOLIA': '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    };
    return contracts[chain] || '';
  }

  /**
   * Get CCTP domain ID for chain
   */
  private getChainDomain(chain: string): number {
    const domains: Record<string, number> = {
      'ETH-SEPOLIA': 0,
      'AVAX-FUJI': 1,
      'ARB-SEPOLIA': 3,
      'MATIC-AMOY': 7,
    };
    return domains[chain] || 0;
  }

  /**
   * Convert address to bytes32 format
   */
  private addressToBytes32(address: string): string {
    return '0x' + address.slice(2).padStart(64, '0');
  }

  // ============ Utility Methods ============

  /**
   * Format USDC amount for display
   */
  static formatUSDC(amount: string): string {
    const num = parseFloat(amount);
    return `${num.toFixed(2)} USDC`;
  }

  /**
   * Parse human-readable amount to wei
   */
  static parseAmount(amount: string): string {
    // USDC has 6 decimals
    const num = parseFloat(amount);
    return (num * 1_000_000).toString();
  }

  /**
   * Validate Ethereum address
   */
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

export default CircleClient;
