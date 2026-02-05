"use strict";
/**
 * Invoice & Payment Request System
 *
 * Generate, track, and manage USDC invoices and payment requests.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringPaymentManager = exports.InvoiceManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = process.env.USDC_DATA_DIR || './data';
/**
 * Invoice Manager
 */
class InvoiceManager {
    constructor(dataDir = DATA_DIR) {
        this.dataPath = path_1.default.join(dataDir, 'invoices.json');
    }
    async loadInvoices() {
        try {
            const data = await promises_1.default.readFile(this.dataPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    async saveInvoices(invoices) {
        await promises_1.default.mkdir(path_1.default.dirname(this.dataPath), { recursive: true });
        await promises_1.default.writeFile(this.dataPath, JSON.stringify(invoices, null, 2));
    }
    /**
     * Create a new invoice
     */
    async create(params) {
        const invoices = await this.loadInvoices();
        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
        const items = params.items.map(item => ({
            ...item,
            total: (item.quantity * parseFloat(item.unitPrice)).toFixed(2),
        }));
        const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total), 0);
        const tax = params.taxRate ? subtotal * (params.taxRate / 100) : 0;
        const total = subtotal + tax;
        const invoice = {
            id: crypto_1.default.randomUUID(),
            number: invoiceNumber,
            status: 'draft',
            from: params.from,
            to: params.to,
            items,
            subtotal: subtotal.toFixed(2),
            tax: tax > 0 ? tax.toFixed(2) : undefined,
            taxRate: params.taxRate,
            total: total.toFixed(2),
            currency: 'USDC',
            paymentChain: params.chain || 'ETH-SEPOLIA',
            paymentAddress: params.from.walletAddress,
            memo: params.memo,
            dueDate: params.dueDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        // Generate payment link
        invoice.paymentLink = this.generatePaymentLink(invoice);
        // Generate x402 payment URL
        invoice.x402PaymentUrl = this.generateX402PaymentUrl(invoice);
        invoices.push(invoice);
        await this.saveInvoices(invoices);
        return invoice;
    }
    /**
     * Get invoice by ID or number
     */
    async get(idOrNumber) {
        const invoices = await this.loadInvoices();
        return invoices.find(inv => inv.id === idOrNumber || inv.number === idOrNumber) || null;
    }
    /**
     * List invoices with optional filters
     */
    async list(filters) {
        let invoices = await this.loadInvoices();
        if (filters?.status) {
            invoices = invoices.filter(inv => inv.status === filters.status);
        }
        if (filters?.toName) {
            invoices = invoices.filter(inv => inv.to.name.toLowerCase().includes(filters.toName.toLowerCase()));
        }
        if (filters?.fromDate) {
            invoices = invoices.filter(inv => inv.createdAt >= filters.fromDate);
        }
        if (filters?.toDate) {
            invoices = invoices.filter(inv => inv.createdAt <= filters.toDate);
        }
        return invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    /**
     * Mark invoice as sent
     */
    async markSent(id) {
        const invoices = await this.loadInvoices();
        const invoice = invoices.find(inv => inv.id === id);
        if (invoice) {
            invoice.status = 'sent';
            invoice.sentAt = new Date().toISOString();
            invoice.updatedAt = new Date().toISOString();
            await this.saveInvoices(invoices);
        }
        return invoice || null;
    }
    /**
     * Mark invoice as paid
     */
    async markPaid(id, txHash, amount) {
        const invoices = await this.loadInvoices();
        const invoice = invoices.find(inv => inv.id === id);
        if (invoice) {
            invoice.status = 'paid';
            invoice.txHash = txHash;
            invoice.paidAt = new Date().toISOString();
            invoice.paidAmount = amount || invoice.total;
            invoice.updatedAt = new Date().toISOString();
            await this.saveInvoices(invoices);
        }
        return invoice || null;
    }
    /**
     * Cancel invoice
     */
    async cancel(id) {
        const invoices = await this.loadInvoices();
        const invoice = invoices.find(inv => inv.id === id);
        if (invoice && invoice.status !== 'paid') {
            invoice.status = 'cancelled';
            invoice.updatedAt = new Date().toISOString();
            await this.saveInvoices(invoices);
        }
        return invoice || null;
    }
    /**
     * Generate payment link for invoice
     */
    generatePaymentLink(invoice) {
        // EIP-681 style payment request (simplified)
        const params = new URLSearchParams({
            to: invoice.paymentAddress,
            value: invoice.total,
            chain: invoice.paymentChain,
            ref: invoice.number,
        });
        return `usdc://pay?${params.toString()}`;
    }
    /**
     * Generate x402-enabled payment URL for invoice
     * Returns a URL that triggers 402 Payment Required
     */
    generateX402PaymentUrl(invoice) {
        // This would point to your x402-enabled invoice payment endpoint
        const baseUrl = process.env.X402_BASE_URL || 'https://api.lobster-pay.com';
        return `${baseUrl}/invoices/${invoice.id}/pay`;
    }
    /**
     * Add x402 payment method to invoice
     * Creates a payment-gated endpoint for this invoice
     */
    async enableX402Payment(invoiceId, options) {
        const invoice = await this.get(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        const baseUrl = options?.baseUrl || process.env.X402_BASE_URL || 'https://api.lobster-pay.com';
        const x402Url = `${baseUrl}/invoices/${invoice.id}/pay`;
        invoice.x402PaymentUrl = x402Url;
        invoice.updatedAt = new Date().toISOString();
        const invoices = await this.loadInvoices();
        const index = invoices.findIndex(inv => inv.id === invoiceId);
        if (index !== -1) {
            invoices[index] = invoice;
            await this.saveInvoices(invoices);
        }
        return x402Url;
    }
    /**
     * Format invoice as text for messaging
     */
    formatInvoiceText(invoice) {
        let text = `📄 **Invoice ${invoice.number}**\n\n`;
        text += `To: ${invoice.to.name}\n`;
        text += `Status: ${invoice.status.toUpperCase()}\n\n`;
        text += `**Items:**\n`;
        for (const item of invoice.items) {
            text += `• ${item.description} (x${item.quantity}) — $${item.total}\n`;
        }
        text += `\nSubtotal: $${invoice.subtotal} USDC\n`;
        if (invoice.tax) {
            text += `Tax (${invoice.taxRate}%): $${invoice.tax} USDC\n`;
        }
        text += `**Total: $${invoice.total} USDC**\n\n`;
        if (invoice.dueDate) {
            text += `Due: ${new Date(invoice.dueDate).toLocaleDateString()}\n`;
        }
        text += `\nPay to: \`${invoice.paymentAddress}\`\n`;
        text += `Chain: ${invoice.paymentChain}\n`;
        if (invoice.memo) {
            text += `\nMemo: ${invoice.memo}\n`;
        }
        return text;
    }
    /**
     * Check for overdue invoices
     */
    async checkOverdue() {
        const invoices = await this.loadInvoices();
        const now = new Date();
        const overdue = [];
        for (const invoice of invoices) {
            if (invoice.status === 'sent' &&
                invoice.dueDate &&
                new Date(invoice.dueDate) < now) {
                invoice.status = 'overdue';
                invoice.updatedAt = now.toISOString();
                overdue.push(invoice);
            }
        }
        if (overdue.length > 0) {
            await this.saveInvoices(invoices);
        }
        return overdue;
    }
}
exports.InvoiceManager = InvoiceManager;
/**
 * Recurring Payment Manager
 */
class RecurringPaymentManager {
    constructor(dataDir = DATA_DIR) {
        this.dataPath = path_1.default.join(dataDir, 'recurring.json');
    }
    async loadPayments() {
        try {
            const data = await promises_1.default.readFile(this.dataPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    async savePayments(payments) {
        await promises_1.default.mkdir(path_1.default.dirname(this.dataPath), { recursive: true });
        await promises_1.default.writeFile(this.dataPath, JSON.stringify(payments, null, 2));
    }
    /**
     * Schedule a recurring payment
     */
    async schedule(params) {
        const payments = await this.loadPayments();
        const startDate = params.startDate || new Date().toISOString().split('T')[0];
        const nextPaymentDate = this.calculateNextDate(startDate, params.frequency);
        const payment = {
            id: crypto_1.default.randomUUID(),
            name: params.name,
            amount: params.amount,
            toAddress: params.toAddress,
            toName: params.toName,
            chain: params.chain,
            frequency: params.frequency,
            startDate,
            endDate: params.endDate,
            nextPaymentDate,
            status: 'active',
            walletId: params.walletId,
            payments: [],
            createdAt: new Date().toISOString(),
        };
        payments.push(payment);
        await this.savePayments(payments);
        return payment;
    }
    /**
     * Get all due payments
     */
    async getDuePayments() {
        const payments = await this.loadPayments();
        const today = new Date().toISOString().split('T')[0];
        return payments.filter(p => p.status === 'active' &&
            p.nextPaymentDate <= today &&
            (!p.endDate || p.endDate >= today));
    }
    /**
     * Record a payment execution
     */
    async recordExecution(id, txHash) {
        const payments = await this.loadPayments();
        const payment = payments.find(p => p.id === id);
        if (payment) {
            payment.payments.push({
                date: new Date().toISOString(),
                txHash,
                amount: payment.amount,
            });
            // Calculate next payment date
            payment.nextPaymentDate = this.calculateNextDate(payment.nextPaymentDate, payment.frequency);
            // Check if completed
            if (payment.endDate && payment.nextPaymentDate > payment.endDate) {
                payment.status = 'completed';
            }
            await this.savePayments(payments);
        }
        return payment || null;
    }
    /**
     * Pause recurring payment
     */
    async pause(id) {
        const payments = await this.loadPayments();
        const payment = payments.find(p => p.id === id);
        if (payment && payment.status === 'active') {
            payment.status = 'paused';
            await this.savePayments(payments);
        }
        return payment || null;
    }
    /**
     * Resume recurring payment
     */
    async resume(id) {
        const payments = await this.loadPayments();
        const payment = payments.find(p => p.id === id);
        if (payment && payment.status === 'paused') {
            payment.status = 'active';
            // Recalculate next payment from today
            payment.nextPaymentDate = this.calculateNextDate(new Date().toISOString().split('T')[0], payment.frequency);
            await this.savePayments(payments);
        }
        return payment || null;
    }
    /**
     * Cancel recurring payment
     */
    async cancel(id) {
        const payments = await this.loadPayments();
        const payment = payments.find(p => p.id === id);
        if (payment) {
            payment.status = 'cancelled';
            await this.savePayments(payments);
        }
        return payment || null;
    }
    /**
     * List all recurring payments
     */
    async list(status) {
        const payments = await this.loadPayments();
        return status
            ? payments.filter(p => p.status === status)
            : payments;
    }
    /**
     * Calculate next payment date based on frequency
     */
    calculateNextDate(fromDate, frequency) {
        const date = new Date(fromDate);
        switch (frequency) {
            case 'daily':
                date.setDate(date.getDate() + 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'biweekly':
                date.setDate(date.getDate() + 14);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'quarterly':
                date.setMonth(date.getMonth() + 3);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
        }
        return date.toISOString().split('T')[0];
    }
}
exports.RecurringPaymentManager = RecurringPaymentManager;
exports.default = { InvoiceManager, RecurringPaymentManager };
//# sourceMappingURL=invoices.js.map