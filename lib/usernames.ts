/**
 * Pay Lobster Username Resolution
 * Resolves @usernames and .base.eth names to addresses
 */

import { ethers } from 'ethers';

// Base Mainnet ENS Registry (for Basenames)
const BASE_ENS_REGISTRY = '0x4ccb0BB02FCABA27e82a56646E81d8c5bC4119a5';
const BASE_PUBLIC_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD';

// Pay Lobster Username Registry (deployed contract)
const PAYLOBSTER_USERNAME_REGISTRY = '0x0000000000000000000000000000000000000000'; // TODO: Deploy

// In-memory cache for usernames (fallback until contract deployed)
const usernameCache: Map<string, string> = new Map([
  ['paylobster', '0xf775f0224A680E2915a066e53A389d0335318b7B'],
  ['gustav', '0xf775f0224A680E2915a066e53A389d0335318b7B'],
]);

export interface ResolvedAddress {
  address: string;
  source: 'basename' | 'registry' | 'cache' | 'direct';
  name: string;
}

/**
 * Resolve a username or ENS name to an address
 * Supports:
 * - @username (Pay Lobster registry)
 * - name.base.eth (Basenames)
 * - Raw addresses (0x...)
 */
export async function resolveUsername(
  input: string,
  provider?: ethers.JsonRpcProvider
): Promise<ResolvedAddress | null> {
  const trimmed: string = input.trim();
  
  // Already a valid address
  if (ethers.isAddress(trimmed)) {
    return {
      address: trimmed as string,
      source: 'direct',
      name: trimmed as string,
    };
  }
  
  // Handle @username format
  if ((trimmed as string).startsWith('@')) {
    const username = (trimmed as string).slice(1).toLowerCase();
    return resolveFromRegistry(username, provider);
  }
  
  // Handle .base.eth or .eth format (Basenames)
  if ((trimmed as string).endsWith('.base.eth') || (trimmed as string).endsWith('.eth')) {
    return resolveBasename(trimmed as string, provider);
  }
  
  // Try as plain username (no @)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed as string)) {
    return resolveFromRegistry((trimmed as string).toLowerCase(), provider);
  }
  
  return null;
}

/**
 * Resolve from Pay Lobster username registry
 */
async function resolveFromRegistry(
  username: string,
  provider?: ethers.JsonRpcProvider
): Promise<ResolvedAddress | null> {
  // Check local cache first
  const cached = usernameCache.get(username);
  if (cached) {
    return {
      address: cached,
      source: 'cache',
      name: `@${username}`,
    };
  }
  
  // TODO: Check on-chain registry when deployed
  // const registry = new ethers.Contract(PAYLOBSTER_USERNAME_REGISTRY, REGISTRY_ABI, provider);
  // const address = await registry.getAddress(username);
  
  // Also try as basename (username.base.eth)
  const basenameResult = await resolveBasename(`${username}.base.eth`, provider);
  if (basenameResult) {
    return {
      ...basenameResult,
      name: `@${username}`,
    };
  }
  
  return null;
}

/**
 * Resolve Basename (.base.eth) via ENS
 */
async function resolveBasename(
  name: string,
  provider?: ethers.JsonRpcProvider
): Promise<ResolvedAddress | null> {
  if (!provider) {
    provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  }
  
  try {
    // Use ethers built-in ENS resolution
    const address = await provider.resolveName(name);
    
    if (address) {
      return {
        address,
        source: 'basename',
        name,
      };
    }
  } catch (e) {
    // Name not found or resolution failed
    console.debug(`Basename resolution failed for ${name}:`, e);
  }
  
  return null;
}

/**
 * Register a username (local cache for now)
 * TODO: Deploy contract and register on-chain
 */
export function registerUsername(username: string, address: string): boolean {
  const normalized = username.toLowerCase().replace(/^@/, '');
  
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(normalized)) {
    throw new Error('Username must be 3-20 characters, alphanumeric with _ or -');
  }
  
  if (!ethers.isAddress(address)) {
    throw new Error('Invalid address');
  }
  
  if (usernameCache.has(normalized)) {
    throw new Error('Username already taken');
  }
  
  usernameCache.set(normalized, address);
  return true;
}

/**
 * Get username for an address (reverse lookup)
 */
export function getUsername(address: string): string | null {
  for (const [username, addr] of usernameCache.entries()) {
    if (addr.toLowerCase() === address.toLowerCase()) {
      return `@${username}`;
    }
  }
  return null;
}

/**
 * List all registered usernames
 */
export function listUsernames(): Array<{ username: string; address: string }> {
  return Array.from(usernameCache.entries()).map(([username, address]) => ({
    username: `@${username}`,
    address,
  }));
}
