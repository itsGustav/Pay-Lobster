import { initAdmin } from './firebase';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  walletAddress?: string;
  agentId?: number;
  tier: 'free' | 'pro';
  createdAt: Date;
  lastLogin: Date;
}

/**
 * Link a wallet address to a user account
 */
export async function linkWalletToUser(userId: string, walletAddress: string) {
  const db = initAdmin();
  
  // Check if wallet is already linked to another user
  const existingUser = await db
    .collection('users')
    .where('walletAddress', '==', walletAddress)
    .limit(1)
    .get();

  if (!existingUser.empty && existingUser.docs[0].id !== userId) {
    throw new Error('Wallet is already linked to another account');
  }

  // Link wallet to user
  await db.collection('users').doc(userId).update({
    walletAddress,
    updatedAt: new Date(),
  });

  return true;
}

/**
 * Get user by wallet address
 */
export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  const db = initAdmin();
  
  const snapshot = await db
    .collection('users')
    .where('walletAddress', '==', walletAddress)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as User;
}

/**
 * Update user's agent ID (from ERC-8004 NFT)
 */
export async function updateUserAgentId(userId: string, agentId: number) {
  const db = initAdmin();
  
  await db.collection('users').doc(userId).update({
    agentId,
    updatedAt: new Date(),
  });

  return true;
}

/**
 * Upgrade user to pro tier
 */
export async function upgradeUserToPro(userId: string) {
  const db = initAdmin();
  
  await db.collection('users').doc(userId).update({
    tier: 'pro',
    updatedAt: new Date(),
  });

  return true;
}
