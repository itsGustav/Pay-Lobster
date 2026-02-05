/**
 * Contact & Address Book Management
 *
 * Secure storage for payment contacts with labels, validation, and search.
 */
export interface Contact {
    id: string;
    name: string;
    alias?: string;
    email?: string;
    phone?: string;
    addresses: {
        chain: string;
        address: string;
        label?: string;
        verified: boolean;
        addedAt: string;
    }[];
    defaultChain?: string;
    defaultAddress?: string;
    tags: string[];
    totalSent: string;
    totalReceived: string;
    lastTransactionAt?: string;
    transactionCount: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
/**
 * Contact Manager
 */
export declare class ContactManager {
    private dataPath;
    constructor(dataDir?: string);
    private loadContacts;
    private saveContacts;
    /**
     * Add a new contact
     */
    add(params: {
        name: string;
        alias?: string;
        email?: string;
        phone?: string;
        addresses?: {
            chain: string;
            address: string;
            label?: string;
        }[];
        tags?: string[];
        notes?: string;
    }): Promise<Contact>;
    /**
     * Find contact by name, alias, or address
     */
    find(query: string): Promise<Contact | null>;
    /**
     * Resolve a recipient (name, alias, or address) to an address
     */
    resolveRecipient(recipient: string, chain?: string): Promise<{
        contact?: Contact;
        address: string;
        chain: string;
    } | null>;
    /**
     * Search contacts
     */
    search(query: string): Promise<Contact[]>;
    /**
     * List all contacts
     */
    list(options?: {
        tag?: string;
        sortBy?: 'name' | 'recent' | 'frequent';
    }): Promise<Contact[]>;
    /**
     * Find contact by address
     */
    findByAddress(address: string): Promise<Contact | null>;
    /**
     * Update contact
     */
    update(id: string, updates: Partial<Omit<Contact, 'id' | 'createdAt'>>): Promise<Contact | null>;
    /**
     * Add address to contact
     */
    addAddress(contactId: string, address: {
        chain: string;
        address: string;
        label?: string;
    }): Promise<Contact | null>;
    /**
     * Remove address from contact
     */
    removeAddress(contactId: string, chain: string): Promise<Contact | null>;
    /**
     * Set default address for contact
     */
    setDefault(contactId: string, chain: string): Promise<Contact | null>;
    /**
     * Add tags to contact
     */
    addTags(contactId: string, tags: string[]): Promise<Contact | null>;
    /**
     * Record a transaction with contact
     */
    recordTransaction(address: string, type: 'sent' | 'received', amount: string): Promise<void>;
    /**
     * Delete contact
     */
    delete(id: string): Promise<boolean>;
    /**
     * Export contacts to CSV
     */
    exportCSV(): Promise<string>;
    /**
     * Import contacts from CSV
     */
    importCSV(csvContent: string): Promise<{
        imported: number;
        skipped: number;
    }>;
    /**
     * Validate Ethereum address
     */
    private isValidAddress;
}
/**
 * x402 Premium Contact Features
 *
 * Premium verification and risk assessment services
 */
export interface PremiumContactFeatures {
    onChainVerification?: boolean;
    riskAssessment?: boolean;
    fraudDetection?: boolean;
    transactionHistory?: boolean;
}
export interface ContactVerificationResult {
    contact: Contact;
    onChainVerified: boolean;
    riskScore?: {
        score: number;
        level: 'low' | 'medium' | 'high' | 'critical';
        factors: string[];
    };
    fraudFlags?: string[];
    transactionSummary?: {
        totalVolume: string;
        transactionCount: number;
        firstSeen: string;
        lastSeen: string;
        interactedWith: number;
    };
    verified: boolean;
    verifiedAt: string;
}
export declare const PREMIUM_CONTACT_PRICING: {
    basicVerification: string;
    fullVerification: string;
    fraudCheck: string;
    fullReport: string;
};
/**
 * Generate x402 verification URL for contact
 */
export declare function generateX402VerificationUrl(contactId: string, verificationType?: 'basic' | 'full' | 'fraud' | 'report', baseUrl?: string): string;
/**
 * Verify contact with premium features via x402
 */
export declare function verifyContactPremium(contact: Contact, features: PremiumContactFeatures, x402Fetch: (url: string) => Promise<Response>): Promise<ContactVerificationResult>;
/**
 * Mock verification for testing
 * Simulates what a real x402-protected endpoint would return
 */
export declare function mockContactVerification(contact: Contact): ContactVerificationResult;
export default ContactManager;
//# sourceMappingURL=contacts.d.ts.map