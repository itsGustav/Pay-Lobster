/**
 * Invoice & Payment Request System
 *
 * Generate, track, and manage USDC invoices and payment requests.
 */
export interface Invoice {
    id: string;
    number: string;
    status: 'draft' | 'sent' | 'viewed' | 'paid' | 'cancelled' | 'overdue';
    from: {
        name: string;
        email?: string;
        walletAddress: string;
    };
    to: {
        name: string;
        email?: string;
        walletAddress?: string;
    };
    items: InvoiceItem[];
    subtotal: string;
    tax?: string;
    taxRate?: number;
    total: string;
    currency: 'USDC';
    paymentChain: string;
    paymentAddress: string;
    paymentLink?: string;
    x402PaymentUrl?: string;
    txHash?: string;
    paidAt?: string;
    paidAmount?: string;
    memo?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    sentAt?: string;
    viewedAt?: string;
}
export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
}
export interface PaymentRequest {
    id: string;
    type: 'one-time' | 'recurring';
    amount: string;
    description: string;
    fromName: string;
    toAddress: string;
    chain: string;
    status: 'pending' | 'paid' | 'cancelled' | 'expired';
    expiresAt?: string;
    paymentLink: string;
    createdAt: string;
    paidAt?: string;
    txHash?: string;
}
export interface RecurringPayment {
    id: string;
    name: string;
    amount: string;
    toAddress: string;
    toName: string;
    chain: string;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
    nextPaymentDate: string;
    startDate: string;
    endDate?: string;
    status: 'active' | 'paused' | 'cancelled' | 'completed';
    walletId: string;
    payments: {
        date: string;
        txHash: string;
        amount: string;
    }[];
    createdAt: string;
}
/**
 * Invoice Manager
 */
export declare class InvoiceManager {
    private dataPath;
    constructor(dataDir?: string);
    private loadInvoices;
    private saveInvoices;
    /**
     * Create a new invoice
     */
    create(params: {
        from: Invoice['from'];
        to: Invoice['to'];
        items: {
            description: string;
            quantity: number;
            unitPrice: string;
        }[];
        taxRate?: number;
        memo?: string;
        dueDate?: string;
        chain?: string;
    }): Promise<Invoice>;
    /**
     * Get invoice by ID or number
     */
    get(idOrNumber: string): Promise<Invoice | null>;
    /**
     * List invoices with optional filters
     */
    list(filters?: {
        status?: Invoice['status'];
        toName?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<Invoice[]>;
    /**
     * Mark invoice as sent
     */
    markSent(id: string): Promise<Invoice | null>;
    /**
     * Mark invoice as paid
     */
    markPaid(id: string, txHash: string, amount?: string): Promise<Invoice | null>;
    /**
     * Cancel invoice
     */
    cancel(id: string): Promise<Invoice | null>;
    /**
     * Generate payment link for invoice
     */
    private generatePaymentLink;
    /**
     * Generate x402-enabled payment URL for invoice
     * Returns a URL that triggers 402 Payment Required
     */
    private generateX402PaymentUrl;
    /**
     * Add x402 payment method to invoice
     * Creates a payment-gated endpoint for this invoice
     */
    enableX402Payment(invoiceId: string, options?: {
        baseUrl?: string;
        expiryHours?: number;
    }): Promise<string>;
    /**
     * Format invoice as text for messaging
     */
    formatInvoiceText(invoice: Invoice): string;
    /**
     * Check for overdue invoices
     */
    checkOverdue(): Promise<Invoice[]>;
}
/**
 * Recurring Payment Manager
 */
export declare class RecurringPaymentManager {
    private dataPath;
    constructor(dataDir?: string);
    private loadPayments;
    private savePayments;
    /**
     * Schedule a recurring payment
     */
    schedule(params: {
        name: string;
        amount: string;
        toAddress: string;
        toName: string;
        chain: string;
        frequency: RecurringPayment['frequency'];
        startDate?: string;
        endDate?: string;
        walletId: string;
    }): Promise<RecurringPayment>;
    /**
     * Get all due payments
     */
    getDuePayments(): Promise<RecurringPayment[]>;
    /**
     * Record a payment execution
     */
    recordExecution(id: string, txHash: string): Promise<RecurringPayment | null>;
    /**
     * Pause recurring payment
     */
    pause(id: string): Promise<RecurringPayment | null>;
    /**
     * Resume recurring payment
     */
    resume(id: string): Promise<RecurringPayment | null>;
    /**
     * Cancel recurring payment
     */
    cancel(id: string): Promise<RecurringPayment | null>;
    /**
     * List all recurring payments
     */
    list(status?: RecurringPayment['status']): Promise<RecurringPayment[]>;
    /**
     * Calculate next payment date based on frequency
     */
    private calculateNextDate;
}
declare const _default: {
    InvoiceManager: typeof InvoiceManager;
    RecurringPaymentManager: typeof RecurringPaymentManager;
};
export default _default;
//# sourceMappingURL=invoices.d.ts.map