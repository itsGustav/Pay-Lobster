"use strict";
/**
 * Universal Escrow Module (Escrow as a Service - EaaS)
 *
 * Smart contract-style escrow for multiple verticals:
 * - Real estate (earnest money, security deposits, closing)
 * - Freelance/Services (milestones, deliverables)
 * - Commerce (purchases, trades, swaps)
 * - P2P (OTC trades, loans)
 * - Digital (licenses, subscriptions, content)
 * - Custom (user-defined)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREMIUM_ESCROW_PRICING = exports.EscrowManager = void 0;
exports.generateX402EscrowUrls = generateX402EscrowUrls;
exports.enablePremiumFeatures = enablePremiumFeatures;
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const escrow_templates_1 = require("./escrow-templates");
const DATA_DIR = process.env.USDC_DATA_DIR || './data';
/**
 * Escrow Manager
 */
class EscrowManager {
    constructor(dataDir = DATA_DIR) {
        this.dataPath = path_1.default.join(dataDir, 'escrows.json');
    }
    async loadEscrows() {
        try {
            const data = await promises_1.default.readFile(this.dataPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    async saveEscrows(escrows) {
        await promises_1.default.mkdir(path_1.default.dirname(this.dataPath), { recursive: true });
        await promises_1.default.writeFile(this.dataPath, JSON.stringify(escrows, null, 2));
    }
    // ============ Escrow Creation ============
    /**
     * Create earnest money escrow
     */
    async createEarnestMoney(params) {
        const escrows = await this.loadEscrows();
        const parties = [
            { ...params.buyer, role: 'buyer' },
            { ...params.seller, role: 'seller' },
        ];
        if (params.agent) {
            parties.push({ ...params.agent, role: 'agent' });
        }
        // Default conditions for earnest money
        const defaultConditions = [
            {
                id: crypto_1.default.randomUUID(),
                description: 'Home inspection satisfactory',
                type: 'inspection',
                status: 'pending',
                deadline: this.addDays(new Date(), 10).toISOString(),
            },
            {
                id: crypto_1.default.randomUUID(),
                description: 'Financing approved',
                type: 'financing',
                status: 'pending',
                deadline: this.addDays(new Date(), 21).toISOString(),
            },
            {
                id: crypto_1.default.randomUUID(),
                description: 'Title clear',
                type: 'title',
                status: 'pending',
            },
        ];
        const customConditions = (params.conditions || []).map(c => ({
            ...c,
            id: crypto_1.default.randomUUID(),
            status: 'pending',
        }));
        const escrow = {
            id: `EM-${Date.now().toString(36).toUpperCase()}`,
            type: 'earnest_money',
            status: 'created',
            property: params.property,
            parties,
            amount: params.amount,
            chain: params.chain,
            escrowAddress: this.generateEscrowAddress(),
            conditions: [...defaultConditions, ...customConditions],
            releaseRequires: 'all_conditions',
            approvals: [],
            requiredApprovals: ['buyer', 'seller'],
            closingDate: params.closingDate,
            fundingDeadline: this.addDays(new Date(), 3).toISOString(),
            documents: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        escrows.push(escrow);
        await this.saveEscrows(escrows);
        return escrow;
    }
    /**
     * Create rental security deposit escrow
     */
    async createSecurityDeposit(params) {
        const escrows = await this.loadEscrows();
        const escrow = {
            id: `SD-${Date.now().toString(36).toUpperCase()}`,
            type: 'security_deposit',
            status: 'created',
            property: params.property,
            parties: [
                { ...params.landlord, role: 'landlord' },
                { ...params.tenant, role: 'tenant' },
            ],
            amount: params.amount,
            chain: params.chain,
            escrowAddress: this.generateEscrowAddress(),
            conditions: [
                {
                    id: crypto_1.default.randomUUID(),
                    description: 'Lease term completed',
                    type: 'move_out',
                    status: 'pending',
                    deadline: params.leaseEndDate,
                },
                {
                    id: crypto_1.default.randomUUID(),
                    description: 'Move-out inspection passed',
                    type: 'inspection',
                    status: 'pending',
                },
            ],
            releaseRequires: 'majority_approval',
            approvals: [],
            requiredApprovals: ['landlord'], // Landlord approval releases to tenant
            leaseEndDate: params.leaseEndDate,
            documents: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        escrows.push(escrow);
        await this.saveEscrows(escrows);
        return escrow;
    }
    /**
     * Create general escrow
     */
    async createGeneral(params) {
        const escrows = await this.loadEscrows();
        const escrow = {
            id: `GE-${Date.now().toString(36).toUpperCase()}`,
            type: 'general',
            status: 'created',
            parties: [
                { ...params.depositor, role: 'depositor' },
                { ...params.recipient, role: 'recipient' },
            ],
            amount: params.amount,
            chain: params.chain,
            escrowAddress: this.generateEscrowAddress(),
            conditions: (params.conditions || []).map(c => ({
                ...c,
                id: crypto_1.default.randomUUID(),
                status: 'pending',
            })),
            releaseRequires: 'all_conditions',
            approvals: [],
            requiredApprovals: ['depositor'],
            notes: params.description,
            documents: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        escrows.push(escrow);
        await this.saveEscrows(escrows);
        return escrow;
    }
    /**
     * Create milestone escrow for freelance/service work
     */
    async createMilestone(params) {
        const escrows = await this.loadEscrows();
        const totalAmount = parseFloat(params.amount);
        // Convert milestones to conditions with release amounts
        const conditions = params.milestones.map((m, i) => ({
            id: crypto_1.default.randomUUID(),
            description: m.description,
            type: 'milestone',
            status: 'pending',
            deadline: m.deadline,
            releaseAmount: m.amount,
            releasePercentage: m.percentage,
        }));
        // Validate amounts/percentages add up
        let totalAllocated = 0;
        for (const cond of conditions) {
            if (cond.releaseAmount) {
                totalAllocated += parseFloat(cond.releaseAmount);
            }
            else if (cond.releasePercentage) {
                totalAllocated += totalAmount * (parseFloat(cond.releasePercentage) / 100);
            }
        }
        if (Math.abs(totalAllocated - totalAmount) > 0.01) {
            throw new Error(`Milestone amounts ($${totalAllocated.toFixed(2)}) don't match total ($${params.amount})`);
        }
        const escrow = {
            id: `MS-${Date.now().toString(36).toUpperCase()}`,
            type: 'milestone',
            status: 'created',
            parties: [
                { ...params.client, role: 'depositor' },
                { ...params.freelancer, role: 'recipient' },
            ],
            amount: params.amount,
            chain: params.chain,
            escrowAddress: this.generateEscrowAddress(),
            conditions,
            releaseRequires: 'any_party', // Each milestone releases independently
            approvals: [],
            requiredApprovals: ['depositor'], // Client approves each milestone
            notes: `Project: ${params.projectName}`,
            documents: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        escrows.push(escrow);
        await this.saveEscrows(escrows);
        return escrow;
    }
    /**
     * Create purchase escrow (buyer/seller goods transaction)
     */
    async createPurchase(params) {
        const escrows = await this.loadEscrows();
        const conditions = [];
        if (params.requiresShipping) {
            conditions.push({
                id: crypto_1.default.randomUUID(),
                description: 'Item shipped by seller',
                type: 'shipping',
                status: 'pending',
            });
            conditions.push({
                id: crypto_1.default.randomUUID(),
                description: 'Item received by buyer',
                type: 'receipt',
                status: 'pending',
            });
        }
        if (params.inspectionPeriodDays) {
            conditions.push({
                id: crypto_1.default.randomUUID(),
                description: `Inspection period (${params.inspectionPeriodDays} days)`,
                type: 'inspection',
                status: 'pending',
                deadline: this.addDays(new Date(), params.inspectionPeriodDays).toISOString(),
            });
        }
        // Always require buyer approval
        conditions.push({
            id: crypto_1.default.randomUUID(),
            description: 'Buyer approves release',
            type: 'approval',
            status: 'pending',
        });
        const escrow = {
            id: `PU-${Date.now().toString(36).toUpperCase()}`,
            type: 'purchase',
            status: 'created',
            parties: [
                { ...params.buyer, role: 'buyer' },
                { ...params.seller, role: 'seller' },
            ],
            amount: params.amount,
            chain: params.chain,
            escrowAddress: this.generateEscrowAddress(),
            conditions,
            releaseRequires: 'all_conditions',
            approvals: [],
            requiredApprovals: ['buyer'],
            notes: params.itemDescription,
            documents: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        escrows.push(escrow);
        await this.saveEscrows(escrows);
        return escrow;
    }
    /**
     * Release partial amount (for milestone escrows)
     */
    async releasePartial(escrowId, conditionId, toAddress, txHash) {
        const escrows = await this.loadEscrows();
        const escrow = escrows.find(e => e.id === escrowId);
        if (!escrow)
            return null;
        const condition = escrow.conditions.find(c => c.id === conditionId);
        if (!condition || condition.status !== 'satisfied') {
            throw new Error('Condition must be satisfied before partial release');
        }
        // Calculate release amount
        let releaseAmount;
        if (condition.releaseAmount) {
            releaseAmount = condition.releaseAmount;
        }
        else if (condition.releasePercentage) {
            const total = parseFloat(escrow.amount);
            releaseAmount = (total * parseFloat(condition.releasePercentage) / 100).toFixed(2);
        }
        else {
            throw new Error('Condition has no release amount defined');
        }
        // Record the partial release
        if (!escrow.releaseTo) {
            escrow.releaseTo = toAddress;
            escrow.releaseTxHash = txHash;
        }
        // Check if all milestones released
        const allReleased = escrow.conditions
            .filter(c => c.type === 'milestone')
            .every(c => c.status === 'satisfied');
        if (allReleased) {
            escrow.status = 'released';
            escrow.releasedAt = new Date().toISOString();
        }
        escrow.updatedAt = new Date().toISOString();
        await this.saveEscrows(escrows);
        return escrow;
    }
    // ============ Escrow Operations ============
    /**
     * Get escrow by ID
     */
    async get(id) {
        const escrows = await this.loadEscrows();
        return escrows.find(e => e.id === id) || null;
    }
    /**
     * List escrows with filters
     */
    async list(filters) {
        let escrows = await this.loadEscrows();
        if (filters?.type) {
            escrows = escrows.filter(e => e.type === filters.type);
        }
        if (filters?.status) {
            escrows = escrows.filter(e => e.status === filters.status);
        }
        if (filters?.partyAddress) {
            escrows = escrows.filter(e => e.parties.some(p => p.walletAddress?.toLowerCase() === filters.partyAddress.toLowerCase()));
        }
        if (filters?.propertyAddress) {
            escrows = escrows.filter(e => e.property?.address.toLowerCase().includes(filters.propertyAddress.toLowerCase()));
        }
        return escrows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    /**
     * Mark escrow as funded
     */
    async markFunded(id, txHash) {
        const escrows = await this.loadEscrows();
        const escrow = escrows.find(e => e.id === id);
        if (escrow && escrow.status === 'created') {
            escrow.status = 'funded';
            escrow.fundingTxHash = txHash;
            escrow.fundedAt = new Date().toISOString();
            escrow.updatedAt = new Date().toISOString();
            await this.saveEscrows(escrows);
        }
        return escrow || null;
    }
    /**
     * Satisfy a condition
     */
    async satisfyCondition(escrowId, conditionId, satisfiedBy, evidence) {
        const escrows = await this.loadEscrows();
        const escrow = escrows.find(e => e.id === escrowId);
        if (!escrow)
            return null;
        const condition = escrow.conditions.find(c => c.id === conditionId);
        if (condition && condition.status === 'pending') {
            condition.status = 'satisfied';
            condition.satisfiedAt = new Date().toISOString();
            condition.satisfiedBy = satisfiedBy;
            condition.evidence = evidence;
            escrow.updatedAt = new Date().toISOString();
            // Check if all conditions satisfied
            const allSatisfied = escrow.conditions.every(c => c.status === 'satisfied' || c.status === 'waived');
            if (allSatisfied && escrow.status === 'funded') {
                escrow.status = 'pending_release';
            }
            await this.saveEscrows(escrows);
        }
        return escrow;
    }
    /**
     * Waive a condition
     */
    async waiveCondition(escrowId, conditionId, waivedBy) {
        const escrows = await this.loadEscrows();
        const escrow = escrows.find(e => e.id === escrowId);
        if (!escrow)
            return null;
        const condition = escrow.conditions.find(c => c.id === conditionId);
        if (condition && condition.status === 'pending') {
            condition.status = 'waived';
            condition.satisfiedAt = new Date().toISOString();
            condition.satisfiedBy = waivedBy;
            escrow.updatedAt = new Date().toISOString();
            await this.saveEscrows(escrows);
        }
        return escrow;
    }
    /**
     * Fail a condition (triggers refund flow)
     */
    async failCondition(escrowId, conditionId, reason) {
        const escrows = await this.loadEscrows();
        const escrow = escrows.find(e => e.id === escrowId);
        if (!escrow)
            return null;
        const condition = escrow.conditions.find(c => c.id === conditionId);
        if (condition && condition.status === 'pending') {
            condition.status = 'failed';
            condition.evidence = reason;
            escrow.updatedAt = new Date().toISOString();
            // Initiate refund process for earnest money
            if (escrow.type === 'earnest_money') {
                escrow.status = 'pending_release';
                escrow.releaseToRole = 'buyer'; // Failed conditions = refund to buyer
            }
            await this.saveEscrows(escrows);
        }
        return escrow;
    }
    /**
     * Submit approval for release
     */
    async approve(escrowId, partyRole, note) {
        const escrows = await this.loadEscrows();
        const escrow = escrows.find(e => e.id === escrowId);
        if (!escrow)
            return null;
        // Check if party is authorized
        if (!escrow.requiredApprovals.includes(partyRole)) {
            throw new Error(`Party role "${partyRole}" is not required for approval`);
        }
        // Check if already approved
        if (escrow.approvals.some(a => a.partyRole === partyRole)) {
            throw new Error('Already approved');
        }
        escrow.approvals.push({
            partyRole,
            approved: true,
            timestamp: new Date().toISOString(),
            note,
        });
        escrow.updatedAt = new Date().toISOString();
        // Check if all required approvals received
        const allApproved = escrow.requiredApprovals.every(role => escrow.approvals.some(a => a.partyRole === role && a.approved));
        if (allApproved && (escrow.status === 'funded' || escrow.status === 'pending_release')) {
            escrow.status = 'pending_release';
        }
        await this.saveEscrows(escrows);
        return escrow;
    }
    /**
     * Execute release
     */
    async release(escrowId, toAddress, txHash) {
        const escrows = await this.loadEscrows();
        const escrow = escrows.find(e => e.id === escrowId);
        if (escrow && escrow.status === 'pending_release') {
            escrow.status = 'released';
            escrow.releaseTo = toAddress;
            escrow.releaseTxHash = txHash;
            escrow.releasedAt = new Date().toISOString();
            escrow.updatedAt = new Date().toISOString();
            await this.saveEscrows(escrows);
        }
        return escrow || null;
    }
    /**
     * Execute refund
     */
    async refund(escrowId, txHash) {
        const escrows = await this.loadEscrows();
        const escrow = escrows.find(e => e.id === escrowId);
        if (escrow && (escrow.status === 'funded' || escrow.status === 'pending_release')) {
            // Find buyer/depositor address
            const refundParty = escrow.parties.find(p => p.role === 'buyer' || p.role === 'tenant' || p.role === 'depositor');
            escrow.status = 'refunded';
            escrow.releaseTo = refundParty?.walletAddress;
            escrow.releaseTxHash = txHash;
            escrow.releasedAt = new Date().toISOString();
            escrow.updatedAt = new Date().toISOString();
            await this.saveEscrows(escrows);
        }
        return escrow || null;
    }
    /**
     * Raise dispute
     */
    async raiseDispute(escrowId, raisedBy, reason) {
        const escrows = await this.loadEscrows();
        const escrow = escrows.find(e => e.id === escrowId);
        if (escrow && escrow.status === 'funded') {
            escrow.status = 'disputed';
            escrow.dispute = {
                raisedBy,
                reason,
                raisedAt: new Date().toISOString(),
            };
            escrow.updatedAt = new Date().toISOString();
            await this.saveEscrows(escrows);
        }
        return escrow || null;
    }
    /**
     * Cancel escrow (before funding)
     */
    async cancel(escrowId) {
        const escrows = await this.loadEscrows();
        const escrow = escrows.find(e => e.id === escrowId);
        if (escrow && escrow.status === 'created') {
            escrow.status = 'cancelled';
            escrow.updatedAt = new Date().toISOString();
            await this.saveEscrows(escrows);
        }
        return escrow || null;
    }
    /**
     * Add document to escrow
     */
    async addDocument(escrowId, name, url) {
        const escrows = await this.loadEscrows();
        const escrow = escrows.find(e => e.id === escrowId);
        if (escrow) {
            escrow.documents.push({
                name,
                url,
                uploadedAt: new Date().toISOString(),
            });
            escrow.updatedAt = new Date().toISOString();
            await this.saveEscrows(escrows);
        }
        return escrow || null;
    }
    // ============ UNIVERSAL ESCROW API (EaaS) ============
    /**
     * Create escrow from template
     *
     * @example
     * await escrowManager.create({
     *   template: 'project_milestone',
     *   amount: '1000',
     *   chain: 'polygon',
     *   parties: [
     *     { role: 'client', name: 'Alice' },
     *     { role: 'provider', name: 'Bob' }
     *   ]
     * })
     */
    async create(params) {
        const template = (0, escrow_templates_1.getTemplate)(params.template);
        if (!template) {
            throw new Error(`Template '${params.template}' not found`);
        }
        const escrows = await this.loadEscrows();
        // Convert template conditions to EscrowCondition format
        const conditions = template.conditions.map(c => ({
            id: crypto_1.default.randomUUID(),
            description: c.description,
            type: c.type,
            status: 'pending',
            ...(c.deadline && { deadline: c.deadline }),
            ...(c.releaseAmount && { releaseAmount: c.releaseAmount }),
            ...(c.releasePercentage && { releasePercentage: c.releasePercentage }),
            ...(c.metadata && { metadata: c.metadata }),
        }));
        // Add custom conditions if provided
        const customConditions = (params.customConditions || []).map(c => ({
            ...c,
            id: crypto_1.default.randomUUID(),
            status: 'pending',
        }));
        const escrow = {
            id: `${template.vertical.toUpperCase().slice(0, 2)}-${Date.now().toString(36).toUpperCase()}`,
            type: this.mapVerticalToType(template.vertical),
            status: 'created',
            parties: params.parties,
            amount: params.amount,
            chain: params.chain,
            escrowAddress: this.generateEscrowAddress(),
            conditions: [...conditions, ...customConditions],
            releaseRequires: template.releaseRequires,
            approvals: [],
            requiredApprovals: template.recommendedPartyRoles,
            documents: [],
            notes: `Created from template: ${template.name}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            fundingDeadline: this.addDays(new Date(), 3).toISOString(),
        };
        // Add auto-release if specified
        if (params.autoReleaseDays || template.autoReleaseDays) {
            const days = params.autoReleaseDays || template.autoReleaseDays;
            conditions.push({
                id: crypto_1.default.randomUUID(),
                description: `Auto-release after ${days} days if no disputes`,
                type: 'deadline',
                status: 'pending',
                deadline: this.addDays(new Date(), days).toISOString(),
            });
        }
        escrows.push(escrow);
        await this.saveEscrows(escrows);
        return escrow;
    }
    /**
     * Create custom escrow with builder conditions
     *
     * @example
     * import { ConditionBuilder } from './condition-builder';
     *
     * await escrowManager.createCustom({
     *   amount: '5000',
     *   chain: 'ethereum',
     *   parties: [
     *     { role: 'buyer', name: 'Alice' },
     *     { role: 'seller', name: 'Bob' }
     *   ],
     *   conditions: [
     *     ConditionBuilder.milestone('Phase 1', 30),
     *     ConditionBuilder.milestone('Phase 2', 70),
     *   ],
     *   releaseRequires: 'condition_based'
     * })
     */
    async createCustom(params) {
        const escrows = await this.loadEscrows();
        const conditions = params.conditions.map(c => ({
            ...c,
            status: 'pending',
        }));
        // Add auto-release if specified
        if (params.autoReleaseDays) {
            conditions.push({
                id: crypto_1.default.randomUUID(),
                description: `Auto-release after ${params.autoReleaseDays} days if no disputes`,
                type: 'deadline',
                status: 'pending',
                deadline: this.addDays(new Date(), params.autoReleaseDays).toISOString(),
            });
        }
        const escrow = {
            id: `CUSTOM-${Date.now().toString(36).toUpperCase()}`,
            type: 'general',
            status: 'created',
            parties: params.parties,
            amount: params.amount,
            chain: params.chain,
            escrowAddress: this.generateEscrowAddress(),
            conditions,
            releaseRequires: params.releaseRequires || 'all_conditions',
            approvals: [],
            requiredApprovals: params.requiredApprovals || params.parties.map(p => p.role),
            documents: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            fundingDeadline: this.addDays(new Date(), 3).toISOString(),
        };
        escrows.push(escrow);
        await this.saveEscrows(escrows);
        return escrow;
    }
    /**
     * Map vertical to legacy EscrowType
     */
    mapVerticalToType(vertical) {
        switch (vertical) {
            case 'real_estate': return 'earnest_money';
            case 'freelance': return 'milestone';
            case 'commerce': return 'purchase';
            case 'p2p': return 'trade';
            case 'digital': return 'purchase';
            case 'services': return 'freelance';
            default: return 'general';
        }
    }
    // ============ Formatting ============
    /**
     * Format escrow summary for display
     */
    formatEscrowSummary(escrow) {
        const statusEmoji = {
            created: '📝',
            funded: '💰',
            pending_release: '⏳',
            released: '✅',
            refunded: '↩️',
            disputed: '⚠️',
            cancelled: '❌',
        }[escrow.status];
        const typeLabel = {
            earnest_money: 'Earnest Money',
            security_deposit: 'Security Deposit',
            closing_funds: 'Closing Funds',
            general: 'Escrow',
        }[escrow.type];
        let summary = `${statusEmoji} **${typeLabel} ${escrow.id}**\n\n`;
        if (escrow.property) {
            summary += `📍 ${escrow.property.address}, ${escrow.property.city}, ${escrow.property.state}\n`;
        }
        summary += `💵 **$${escrow.amount} USDC** (${escrow.chain})\n`;
        summary += `Status: ${escrow.status.replace('_', ' ').toUpperCase()}\n\n`;
        // Parties
        summary += `**Parties:**\n`;
        for (const party of escrow.parties) {
            summary += `• ${party.role}: ${party.name}\n`;
        }
        summary += '\n';
        // Conditions
        if (escrow.conditions.length > 0) {
            summary += `**Conditions:**\n`;
            for (const cond of escrow.conditions) {
                const condEmoji = {
                    pending: '⏳',
                    satisfied: '✅',
                    waived: '⏭️',
                    failed: '❌',
                }[cond.status];
                summary += `${condEmoji} ${cond.description}\n`;
            }
            summary += '\n';
        }
        // Approvals
        if (escrow.requiredApprovals.length > 0) {
            summary += `**Approvals:** `;
            const approved = escrow.approvals.filter(a => a.approved).map(a => a.partyRole);
            summary += `${approved.length}/${escrow.requiredApprovals.length} `;
            summary += `(${escrow.requiredApprovals.map(r => approved.includes(r) ? '✓' : '○').join('')})\n`;
        }
        return summary;
    }
    // ============ Helpers ============
    generateEscrowAddress() {
        // In production, this would deploy/derive a smart contract address
        // For now, generate a deterministic address
        return '0x' + crypto_1.default.randomBytes(20).toString('hex');
    }
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
}
exports.EscrowManager = EscrowManager;
// Premium feature pricing (in USDC)
exports.PREMIUM_ESCROW_PRICING = {
    yieldOptimization: '0.25', // Enable yield-bearing escrow
    insurance: '0.50', // Add insurance coverage
    prioritySupport: '1.00', // Priority support package
    analytics: '0.10', // Advanced analytics
};
/**
 * Generate x402 premium feature URLs for escrow
 */
function generateX402EscrowUrls(escrowId, baseUrl) {
    const base = baseUrl || process.env.X402_BASE_URL || 'https://api.lobster-pay.com';
    return {
        optimize: `${base}/escrow/${escrowId}/optimize`,
        insure: `${base}/escrow/${escrowId}/insure`,
        analytics: `${base}/escrow/${escrowId}/analytics`,
        support: `${base}/escrow/${escrowId}/support`,
    };
}
/**
 * Example: Enable premium features on escrow
 */
async function enablePremiumFeatures(escrow, features, x402Fetch) {
    const urls = generateX402EscrowUrls(escrow.id);
    const enabled = [];
    const failed = [];
    if (features.yieldOptimization) {
        try {
            const response = await x402Fetch(urls.optimize);
            if (response.ok) {
                enabled.push('yieldOptimization');
            }
            else {
                failed.push('yieldOptimization');
            }
        }
        catch {
            failed.push('yieldOptimization');
        }
    }
    if (features.insurance) {
        try {
            const response = await x402Fetch(urls.insure);
            if (response.ok) {
                enabled.push('insurance');
            }
            else {
                failed.push('insurance');
            }
        }
        catch {
            failed.push('insurance');
        }
    }
    if (features.analytics) {
        try {
            const response = await x402Fetch(urls.analytics);
            if (response.ok) {
                enabled.push('analytics');
            }
            else {
                failed.push('analytics');
            }
        }
        catch {
            failed.push('analytics');
        }
    }
    if (features.prioritySupport) {
        try {
            const response = await x402Fetch(urls.support);
            if (response.ok) {
                enabled.push('prioritySupport');
            }
            else {
                failed.push('prioritySupport');
            }
        }
        catch {
            failed.push('prioritySupport');
        }
    }
    return { enabled, failed };
}
exports.default = EscrowManager;
//# sourceMappingURL=escrow.js.map