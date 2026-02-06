import type { Address } from 'viem';

export interface Badge {
  icon: string;
  name: string;
  description?: string;
}

export interface TrustVector {
  delivery: number;
  payment: number;
  communication: number;
  history: number;
}

export function getTier(score: number): string {
  if (score >= 750) return 'ELITE';
  if (score >= 650) return 'EXCELLENT';
  if (score >= 550) return 'GOOD';
  if (score >= 450) return 'FAIR';
  return 'POOR';
}

export function parseTrustVector(trustVectorValue: bigint): TrustVector {
  // Trust vector is packed as 4 bytes (each 0-100)
  // Format: [delivery][payment][communication][history]
  const hex = trustVectorValue.toString(16).padStart(8, '0');
  
  return {
    delivery: parseInt(hex.slice(0, 2), 16),
    payment: parseInt(hex.slice(2, 4), 16),
    communication: parseInt(hex.slice(4, 6), 16),
    history: parseInt(hex.slice(6, 8), 16),
  };
}

export function calculateBadges(
  score: number,
  successfulTxns: number,
  lifetimeVolume: number,
  trustVector: TrustVector
): Badge[] {
  const badges: Badge[] = [];

  // Score-based badges
  if (score >= 750) {
    badges.push({ 
      icon: '🏆', 
      name: 'Elite Agent',
      description: 'LOBSTER Score above 750'
    });
  }

  if (score >= 800) {
    badges.push({ 
      icon: '🌟', 
      name: 'Top 10%',
      description: 'Among the highest rated agents'
    });
  }

  // Transaction-based badges
  if (successfulTxns >= 10) {
    badges.push({ 
      icon: '🔥', 
      name: '10-Streak',
      description: '10+ successful transactions'
    });
  }

  if (successfulTxns >= 50) {
    badges.push({ 
      icon: '💯', 
      name: 'Century Club',
      description: '50+ successful transactions'
    });
  }

  // Volume-based badges
  if (lifetimeVolume >= 10000) {
    badges.push({ 
      icon: '💎', 
      name: 'High Volume',
      description: '$10,000+ in transactions'
    });
  }

  if (lifetimeVolume >= 100000) {
    badges.push({ 
      icon: '👑', 
      name: 'Whale',
      description: '$100,000+ in transactions'
    });
  }

  // Trust-based badges
  if (trustVector.payment >= 95) {
    badges.push({ 
      icon: '⚡', 
      name: 'Fast Payer',
      description: 'Consistently pays on time'
    });
  }

  if (trustVector.delivery >= 95) {
    badges.push({ 
      icon: '✓', 
      name: 'Verified',
      description: 'Proven track record of delivery'
    });
  }

  if (Object.values(trustVector).every(v => v >= 90)) {
    badges.push({ 
      icon: '🎯', 
      name: 'Perfect Balance',
      description: 'All trust metrics above 90%'
    });
  }

  return badges;
}

export function isValidAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w`;
  return `${Math.floor(seconds / 2592000)}mo`;
}
