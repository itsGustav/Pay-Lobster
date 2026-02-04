/**
 * Escrow Templates
 * 
 * Pre-built escrow configurations for common use cases across multiple verticals.
 */

import { ConditionBuilder } from './condition-builder';
import type { EscrowCondition } from './escrow';

export type EscrowVertical = 
  | 'real_estate'   // Earnest money, security deposits, closing
  | 'freelance'     // Milestone-based payments, project delivery
  | 'commerce'      // Product purchases, trades, swaps
  | 'services'      // Service agreements, SLAs
  | 'p2p'           // Peer-to-peer trades, deals
  | 'digital'       // Digital goods, licenses, subscriptions
  | 'custom';       // User-defined

export interface EscrowTemplate {
  name: string;
  description: string;
  vertical: EscrowVertical;
  conditions: Omit<EscrowCondition, 'id' | 'status'>[];
  releaseRequires: 'all_conditions' | 'majority_approval' | 'condition_based' | 'any_party';
  recommendedPartyRoles: string[];
  autoReleaseDays?: number;
  metadata?: Record<string, any>;
}

/**
 * Pre-built escrow templates
 */
export const ESCROW_TEMPLATES: Record<string, EscrowTemplate> = {
  // ============ REAL ESTATE ============
  
  earnest_money: {
    name: 'Earnest Money Deposit',
    description: 'Traditional real estate earnest money escrow with standard contingencies',
    vertical: 'real_estate',
    conditions: [
      {
        description: 'Home inspection satisfactory',
        type: 'inspection',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        description: 'Financing approved',
        type: 'financing',
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        description: 'Title clear',
        type: 'title',
      },
      {
        description: 'Closing completed',
        type: 'closing',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['buyer', 'seller', 'agent', 'title_company'],
  },

  security_deposit: {
    name: 'Rental Security Deposit',
    description: 'Landlord-tenant security deposit with move-out conditions',
    vertical: 'real_estate',
    conditions: [
      {
        description: 'Lease term completed',
        type: 'move_out',
      },
      {
        description: 'Property inspection passed',
        type: 'inspection',
      },
      {
        description: 'No outstanding damages',
        type: 'verification',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['landlord', 'tenant'],
  },

  closing_funds: {
    name: 'Closing Funds Escrow',
    description: 'Full real estate transaction closing',
    vertical: 'real_estate',
    conditions: [
      {
        description: 'All contingencies satisfied',
        type: 'custom',
      },
      {
        description: 'Title transferred',
        type: 'title',
      },
      {
        description: 'Closing documents signed',
        type: 'closing',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['buyer', 'seller', 'title_company'],
  },

  // ============ FREELANCE ============

  project_milestone: {
    name: 'Milestone-Based Project',
    description: 'Freelance project with staged milestone payments',
    vertical: 'freelance',
    conditions: [
      {
        description: 'Design phase approved',
        type: 'milestone',
        releasePercentage: '25',
      },
      {
        description: 'Development complete',
        type: 'milestone',
        releasePercentage: '50',
      },
      {
        description: 'Final delivery and approval',
        type: 'delivery',
        releasePercentage: '25',
      },
    ],
    releaseRequires: 'condition_based',
    recommendedPartyRoles: ['client', 'provider'],
  },

  freelance_delivery: {
    name: 'Simple Freelance Delivery',
    description: 'Single delivery with client approval',
    vertical: 'freelance',
    conditions: [
      {
        description: 'Work delivered',
        type: 'delivery',
      },
      {
        description: 'Client approval',
        type: 'approval',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['client', 'provider'],
    autoReleaseDays: 7, // Auto-release if client doesn't respond
  },

  consulting_retainer: {
    name: 'Consulting Retainer',
    description: 'Monthly retainer with deliverable verification',
    vertical: 'freelance',
    conditions: [
      {
        description: 'Monthly report delivered',
        type: 'delivery',
      },
      {
        description: 'Deliverables meet agreement',
        type: 'verification',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['client', 'consultant'],
  },

  // ============ COMMERCE ============

  product_purchase: {
    name: 'Product Purchase',
    description: 'E-commerce purchase with shipping and receipt confirmation',
    vertical: 'commerce',
    conditions: [
      {
        description: 'Item shipped with tracking',
        type: 'shipping',
      },
      {
        description: 'Buyer confirms receipt',
        type: 'receipt',
      },
      {
        description: 'Item condition verified',
        type: 'verification',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['buyer', 'seller'],
    autoReleaseDays: 3, // Auto-release if buyer doesn't dispute
  },

  trade_swap: {
    name: 'Item Trade/Swap',
    description: 'Peer-to-peer item exchange',
    vertical: 'commerce',
    conditions: [
      {
        description: 'Both parties ship items',
        type: 'shipping',
      },
      {
        description: 'Both parties confirm receipt',
        type: 'receipt',
      },
      {
        description: 'Both parties approve condition',
        type: 'approval',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['party_a', 'party_b'],
  },

  marketplace_sale: {
    name: 'Marketplace Sale',
    description: 'Third-party marketplace transaction',
    vertical: 'commerce',
    conditions: [
      {
        description: 'Payment received',
        type: 'verification',
      },
      {
        description: 'Item delivered',
        type: 'delivery',
      },
      {
        description: 'No disputes filed',
        type: 'verification',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['buyer', 'seller', 'marketplace'],
    autoReleaseDays: 7,
  },

  // ============ P2P TRADING ============

  crypto_otc: {
    name: 'Crypto OTC Trade',
    description: 'Over-the-counter crypto/token swap',
    vertical: 'p2p',
    conditions: [
      {
        description: 'Both parties deposit funds',
        type: 'verification',
      },
      {
        description: 'Both parties approve swap',
        type: 'approval',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['party_a', 'party_b'],
  },

  nft_trade: {
    name: 'NFT Trade',
    description: 'NFT swap or sale with verification',
    vertical: 'p2p',
    conditions: [
      {
        description: 'NFT ownership verified',
        type: 'verification',
      },
      {
        description: 'Payment confirmed',
        type: 'verification',
      },
      {
        description: 'Both parties approve transfer',
        type: 'approval',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['buyer', 'seller'],
  },

  peer_loan: {
    name: 'Peer-to-Peer Loan',
    description: 'P2P lending with collateral',
    vertical: 'p2p',
    conditions: [
      {
        description: 'Collateral deposited',
        type: 'verification',
      },
      {
        description: 'Repayment deadline met',
        type: 'deadline',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['lender', 'borrower'],
  },

  // ============ DIGITAL GOODS ============

  digital_license: {
    name: 'Digital License Purchase',
    description: 'Software license or digital product sale',
    vertical: 'digital',
    conditions: [
      {
        description: 'License key delivered',
        type: 'delivery',
      },
      {
        description: 'License activated successfully',
        type: 'verification',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['buyer', 'vendor'],
    autoReleaseDays: 3,
  },

  saas_subscription: {
    name: 'SaaS Subscription Escrow',
    description: 'Recurring SaaS payment with service verification',
    vertical: 'digital',
    conditions: [
      {
        description: 'Service access granted',
        type: 'verification',
      },
      {
        description: 'Uptime SLA met',
        type: 'custom',
        metadata: { slaPercentage: 99.9 },
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['subscriber', 'provider'],
  },

  digital_content: {
    name: 'Digital Content Purchase',
    description: 'Ebook, course, template, or other digital content',
    vertical: 'digital',
    conditions: [
      {
        description: 'Content delivered',
        type: 'delivery',
      },
      {
        description: 'Download successful',
        type: 'verification',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['buyer', 'creator'],
    autoReleaseDays: 1,
  },

  // ============ SERVICES ============

  service_agreement: {
    name: 'Service Agreement',
    description: 'General service contract with completion verification',
    vertical: 'services',
    conditions: [
      {
        description: 'Service completed',
        type: 'approval',
      },
      {
        description: 'Quality requirements met',
        type: 'verification',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['client', 'provider'],
  },

  sla_based_service: {
    name: 'SLA-Based Service',
    description: 'Service with SLA requirements',
    vertical: 'services',
    conditions: [
      {
        description: 'SLA metrics met',
        type: 'custom',
      },
      {
        description: 'Service period complete',
        type: 'deadline',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        description: 'Client approval',
        type: 'approval',
      },
    ],
    releaseRequires: 'all_conditions',
    recommendedPartyRoles: ['client', 'provider'],
  },

  construction_contract: {
    name: 'Construction/Renovation Contract',
    description: 'Construction project with inspection milestones',
    vertical: 'services',
    conditions: [
      {
        description: 'Foundation complete',
        type: 'milestone',
        releasePercentage: '25',
      },
      {
        description: 'Framing and electrical',
        type: 'milestone',
        releasePercentage: '25',
      },
      {
        description: 'Finishing work',
        type: 'milestone',
        releasePercentage: '25',
      },
      {
        description: 'Final inspection passed',
        type: 'inspection',
        releasePercentage: '25',
      },
    ],
    releaseRequires: 'condition_based',
    recommendedPartyRoles: ['client', 'contractor', 'inspector'],
  },
};

/**
 * Get template by name
 */
export function getTemplate(name: string): EscrowTemplate | undefined {
  return ESCROW_TEMPLATES[name];
}

/**
 * List all templates
 */
export function listTemplates(): EscrowTemplate[] {
  return Object.values(ESCROW_TEMPLATES);
}

/**
 * List templates by vertical
 */
export function listTemplatesByVertical(vertical: EscrowVertical): EscrowTemplate[] {
  return Object.values(ESCROW_TEMPLATES).filter(t => t.vertical === vertical);
}

/**
 * Get all verticals
 */
export function getVerticals(): EscrowVertical[] {
  return ['real_estate', 'freelance', 'commerce', 'services', 'p2p', 'digital', 'custom'];
}
