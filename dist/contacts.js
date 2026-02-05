"use strict";
/**
 * Contact & Address Book Management
 *
 * Secure storage for payment contacts with labels, validation, and search.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREMIUM_CONTACT_PRICING = exports.ContactManager = void 0;
exports.generateX402VerificationUrl = generateX402VerificationUrl;
exports.verifyContactPremium = verifyContactPremium;
exports.mockContactVerification = mockContactVerification;
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = process.env.USDC_DATA_DIR || './data';
/**
 * Contact Manager
 */
class ContactManager {
    constructor(dataDir = DATA_DIR) {
        this.dataPath = path_1.default.join(dataDir, 'contacts.json');
    }
    async loadContacts() {
        try {
            const data = await promises_1.default.readFile(this.dataPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    async saveContacts(contacts) {
        await promises_1.default.mkdir(path_1.default.dirname(this.dataPath), { recursive: true });
        await promises_1.default.writeFile(this.dataPath, JSON.stringify(contacts, null, 2));
    }
    /**
     * Add a new contact
     */
    async add(params) {
        const contacts = await this.loadContacts();
        // Check for duplicate alias
        if (params.alias) {
            const existing = contacts.find(c => c.alias?.toLowerCase() === params.alias.toLowerCase());
            if (existing) {
                throw new Error(`Alias "${params.alias}" already exists`);
            }
        }
        const contact = {
            id: crypto_1.default.randomUUID(),
            name: params.name,
            alias: params.alias,
            email: params.email,
            phone: params.phone,
            addresses: (params.addresses || []).map(addr => ({
                ...addr,
                verified: this.isValidAddress(addr.address),
                addedAt: new Date().toISOString(),
            })),
            tags: params.tags || [],
            totalSent: '0',
            totalReceived: '0',
            transactionCount: 0,
            notes: params.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        // Set default address if provided
        if (contact.addresses.length > 0) {
            contact.defaultChain = contact.addresses[0].chain;
            contact.defaultAddress = contact.addresses[0].address;
        }
        contacts.push(contact);
        await this.saveContacts(contacts);
        return contact;
    }
    /**
     * Find contact by name, alias, or address
     */
    async find(query) {
        const contacts = await this.loadContacts();
        const lowerQuery = query.toLowerCase();
        return contacts.find(c => c.name.toLowerCase() === lowerQuery ||
            c.alias?.toLowerCase() === lowerQuery ||
            c.addresses.some(a => a.address.toLowerCase() === lowerQuery)) || null;
    }
    /**
     * Resolve a recipient (name, alias, or address) to an address
     */
    async resolveRecipient(recipient, chain) {
        // If it's already a valid address, return it
        if (this.isValidAddress(recipient)) {
            const contact = await this.findByAddress(recipient);
            return {
                contact: contact || undefined,
                address: recipient,
                chain: chain || 'ETH-SEPOLIA',
            };
        }
        // Look up contact
        const contact = await this.find(recipient);
        if (!contact) {
            return null;
        }
        // Find address for requested chain or default
        const targetChain = chain || contact.defaultChain || 'ETH-SEPOLIA';
        const addr = contact.addresses.find(a => a.chain === targetChain) ||
            contact.addresses[0];
        if (!addr) {
            return null;
        }
        return {
            contact,
            address: addr.address,
            chain: addr.chain,
        };
    }
    /**
     * Search contacts
     */
    async search(query) {
        const contacts = await this.loadContacts();
        const lowerQuery = query.toLowerCase();
        return contacts.filter(c => c.name.toLowerCase().includes(lowerQuery) ||
            c.alias?.toLowerCase().includes(lowerQuery) ||
            c.email?.toLowerCase().includes(lowerQuery) ||
            c.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
            c.notes?.toLowerCase().includes(lowerQuery));
    }
    /**
     * List all contacts
     */
    async list(options) {
        let contacts = await this.loadContacts();
        if (options?.tag) {
            contacts = contacts.filter(c => c.tags.some(t => t.toLowerCase() === options.tag.toLowerCase()));
        }
        switch (options?.sortBy) {
            case 'recent':
                contacts.sort((a, b) => {
                    const dateA = a.lastTransactionAt || a.createdAt;
                    const dateB = b.lastTransactionAt || b.createdAt;
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                });
                break;
            case 'frequent':
                contacts.sort((a, b) => b.transactionCount - a.transactionCount);
                break;
            case 'name':
            default:
                contacts.sort((a, b) => a.name.localeCompare(b.name));
        }
        return contacts;
    }
    /**
     * Find contact by address
     */
    async findByAddress(address) {
        const contacts = await this.loadContacts();
        return contacts.find(c => c.addresses.some(a => a.address.toLowerCase() === address.toLowerCase())) || null;
    }
    /**
     * Update contact
     */
    async update(id, updates) {
        const contacts = await this.loadContacts();
        const contact = contacts.find(c => c.id === id);
        if (contact) {
            Object.assign(contact, updates, { updatedAt: new Date().toISOString() });
            await this.saveContacts(contacts);
        }
        return contact || null;
    }
    /**
     * Add address to contact
     */
    async addAddress(contactId, address) {
        const contacts = await this.loadContacts();
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
            // Check if address already exists
            if (contact.addresses.some(a => a.chain === address.chain &&
                a.address.toLowerCase() === address.address.toLowerCase())) {
                throw new Error('Address already exists for this chain');
            }
            contact.addresses.push({
                ...address,
                verified: this.isValidAddress(address.address),
                addedAt: new Date().toISOString(),
            });
            contact.updatedAt = new Date().toISOString();
            await this.saveContacts(contacts);
        }
        return contact || null;
    }
    /**
     * Remove address from contact
     */
    async removeAddress(contactId, chain) {
        const contacts = await this.loadContacts();
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
            contact.addresses = contact.addresses.filter(a => a.chain !== chain);
            contact.updatedAt = new Date().toISOString();
            // Update default if removed
            if (contact.defaultChain === chain && contact.addresses.length > 0) {
                contact.defaultChain = contact.addresses[0].chain;
                contact.defaultAddress = contact.addresses[0].address;
            }
            await this.saveContacts(contacts);
        }
        return contact || null;
    }
    /**
     * Set default address for contact
     */
    async setDefault(contactId, chain) {
        const contacts = await this.loadContacts();
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
            const addr = contact.addresses.find(a => a.chain === chain);
            if (addr) {
                contact.defaultChain = addr.chain;
                contact.defaultAddress = addr.address;
                contact.updatedAt = new Date().toISOString();
                await this.saveContacts(contacts);
            }
        }
        return contact || null;
    }
    /**
     * Add tags to contact
     */
    async addTags(contactId, tags) {
        const contacts = await this.loadContacts();
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
            const newTags = tags.filter(t => !contact.tags.includes(t));
            contact.tags.push(...newTags);
            contact.updatedAt = new Date().toISOString();
            await this.saveContacts(contacts);
        }
        return contact || null;
    }
    /**
     * Record a transaction with contact
     */
    async recordTransaction(address, type, amount) {
        const contacts = await this.loadContacts();
        const contact = contacts.find(c => c.addresses.some(a => a.address.toLowerCase() === address.toLowerCase()));
        if (contact) {
            const amountNum = parseFloat(amount);
            if (type === 'sent') {
                contact.totalSent = (parseFloat(contact.totalSent) + amountNum).toString();
            }
            else {
                contact.totalReceived = (parseFloat(contact.totalReceived) + amountNum).toString();
            }
            contact.transactionCount++;
            contact.lastTransactionAt = new Date().toISOString();
            contact.updatedAt = new Date().toISOString();
            await this.saveContacts(contacts);
        }
    }
    /**
     * Delete contact
     */
    async delete(id) {
        const contacts = await this.loadContacts();
        const index = contacts.findIndex(c => c.id === id);
        if (index >= 0) {
            contacts.splice(index, 1);
            await this.saveContacts(contacts);
            return true;
        }
        return false;
    }
    /**
     * Export contacts to CSV
     */
    async exportCSV() {
        const contacts = await this.loadContacts();
        const header = 'Name,Alias,Email,Chain,Address,Tags,Total Sent,Total Received\n';
        const rows = contacts.flatMap(c => c.addresses.map(a => `"${c.name}","${c.alias || ''}","${c.email || ''}","${a.chain}","${a.address}","${c.tags.join(';')}","${c.totalSent}","${c.totalReceived}"`));
        return header + rows.join('\n');
    }
    /**
     * Import contacts from CSV
     */
    async importCSV(csvContent) {
        const lines = csvContent.split('\n').slice(1); // Skip header
        let imported = 0;
        let skipped = 0;
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                // Simple CSV parsing (doesn't handle all edge cases)
                const parts = line.match(/(?:"[^"]*"|[^,])+/g) || [];
                const [name, alias, email, chain, address, tags] = parts.map(p => p.replace(/^"|"$/g, ''));
                if (!name || !address) {
                    skipped++;
                    continue;
                }
                // Check if contact exists
                let contact = await this.find(name);
                if (contact) {
                    // Add address to existing contact
                    await this.addAddress(contact.id, { chain: chain || 'ETH-SEPOLIA', address });
                }
                else {
                    // Create new contact
                    await this.add({
                        name,
                        alias: alias || undefined,
                        email: email || undefined,
                        addresses: [{ chain: chain || 'ETH-SEPOLIA', address }],
                        tags: tags ? tags.split(';') : [],
                    });
                }
                imported++;
            }
            catch (err) {
                skipped++;
            }
        }
        return { imported, skipped };
    }
    /**
     * Validate Ethereum address
     */
    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
}
exports.ContactManager = ContactManager;
// Premium verification pricing (in USDC)
exports.PREMIUM_CONTACT_PRICING = {
    basicVerification: '0.05', // Basic on-chain verification
    fullVerification: '0.10', // Full verification + risk score
    fraudCheck: '0.15', // Fraud detection analysis
    fullReport: '0.25', // Complete verification report
};
/**
 * Generate x402 verification URL for contact
 */
function generateX402VerificationUrl(contactId, verificationType = 'basic', baseUrl) {
    const base = baseUrl || process.env.X402_BASE_URL || 'https://api.lobster-pay.com';
    return `${base}/contacts/${contactId}/verify/${verificationType}`;
}
/**
 * Verify contact with premium features via x402
 */
async function verifyContactPremium(contact, features, x402Fetch) {
    const result = {
        contact,
        onChainVerified: false,
        verified: false,
        verifiedAt: new Date().toISOString(),
    };
    try {
        // Determine verification type based on features
        let verificationType = 'basic';
        if (features.fraudDetection) {
            verificationType = 'fraud';
        }
        else if (features.onChainVerification && features.riskAssessment && features.transactionHistory) {
            verificationType = 'report';
        }
        else if (features.riskAssessment) {
            verificationType = 'full';
        }
        // Call x402-protected verification endpoint
        const url = generateX402VerificationUrl(contact.id, verificationType);
        const response = await x402Fetch(url);
        if (!response.ok) {
            throw new Error(`Verification failed: ${response.statusText}`);
        }
        const data = await response.json();
        // Parse verification results
        result.onChainVerified = data.onChainVerified || false;
        result.riskScore = data.riskScore;
        result.fraudFlags = data.fraudFlags;
        result.transactionSummary = data.transactionSummary;
        result.verified = true;
    }
    catch (error) {
        console.error('Contact verification error:', error);
        result.verified = false;
    }
    return result;
}
/**
 * Mock verification for testing
 * Simulates what a real x402-protected endpoint would return
 */
function mockContactVerification(contact) {
    // Generate mock on-chain data
    const addressCount = contact.addresses.length;
    const hasMultipleChains = addressCount > 1;
    // Calculate mock risk score
    let riskScore = 20; // Base low risk
    if (addressCount === 0)
        riskScore += 40; // No addresses = higher risk
    if (!contact.email && !contact.phone)
        riskScore += 20; // No contact info
    if (contact.transactionCount === 0)
        riskScore += 30; // No transaction history
    riskScore = Math.min(100, riskScore);
    const riskLevel = riskScore < 25 ? 'low' :
        riskScore < 50 ? 'medium' :
            riskScore < 75 ? 'high' : 'critical';
    const factors = [];
    if (addressCount === 0)
        factors.push('No wallet addresses on file');
    if (contact.transactionCount === 0)
        factors.push('No transaction history');
    if (!contact.email && !contact.phone)
        factors.push('No contact information');
    if (hasMultipleChains)
        factors.push('Active on multiple chains (positive)');
    return {
        contact,
        onChainVerified: addressCount > 0,
        riskScore: {
            score: riskScore,
            level: riskLevel,
            factors,
        },
        fraudFlags: riskScore > 70 ? ['High risk score', 'Limited verification data'] : [],
        transactionSummary: {
            totalVolume: contact.totalSent || '0',
            transactionCount: contact.transactionCount,
            firstSeen: contact.createdAt,
            lastSeen: contact.lastTransactionAt || contact.createdAt,
            interactedWith: Math.floor(Math.random() * 50) + 5,
        },
        verified: true,
        verifiedAt: new Date().toISOString(),
    };
}
exports.default = ContactManager;
//# sourceMappingURL=contacts.js.map