/**
 * Pay Lobster Username Resolution
 * Resolves @usernames and .base.eth names to addresses
 */
import { ethers } from 'ethers';
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
export declare function resolveUsername(input: string, provider?: ethers.JsonRpcProvider): Promise<ResolvedAddress | null>;
/**
 * Register a username (local cache for now)
 * TODO: Deploy contract and register on-chain
 */
export declare function registerUsername(username: string, address: string): boolean;
/**
 * Get username for an address (reverse lookup)
 */
export declare function getUsername(address: string): string | null;
/**
 * List all registered usernames
 */
export declare function listUsernames(): Array<{
    username: string;
    address: string;
}>;
//# sourceMappingURL=usernames.d.ts.map