"use strict";
/**
 * Condition Builder
 *
 * Fluent API for building custom escrow release conditions.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionBuilder = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Fluent builder for escrow conditions
 */
class ConditionBuilder {
    /**
     * Create a milestone condition (with optional partial release)
     *
     * @example
     * ConditionBuilder.milestone('Design approved', 25)
     * // Releases 25% when satisfied
     */
    static milestone(description, releasePercent) {
        return {
            id: crypto_1.default.randomUUID(),
            description,
            type: 'milestone',
            status: 'pending',
            ...(releasePercent !== undefined && { releasePercentage: releasePercent.toString() }),
        };
    }
    /**
     * Create an approval condition (requires specific party approval)
     *
     * @example
     * ConditionBuilder.approval('client')
     */
    static approval(fromRole, description) {
        return {
            id: crypto_1.default.randomUUID(),
            description: description || `Approval required from ${fromRole}`,
            type: 'approval',
            status: 'pending',
            metadata: { requiredRole: fromRole },
        };
    }
    /**
     * Create a deadline condition
     *
     * @example
     * ConditionBuilder.deadline(new Date('2026-03-01'), 'Project completion deadline')
     */
    static deadline(date, description) {
        return {
            id: crypto_1.default.randomUUID(),
            description: description || `Deadline: ${date.toLocaleDateString()}`,
            type: 'deadline',
            status: 'pending',
            deadline: date.toISOString(),
        };
    }
    /**
     * Create a document requirement condition
     *
     * @example
     * ConditionBuilder.document('Signed contract', 'Contract must be signed and uploaded')
     */
    static document(requiredDoc, description) {
        return {
            id: crypto_1.default.randomUUID(),
            description: description || `Document required: ${requiredDoc}`,
            type: 'document',
            status: 'pending',
            metadata: { requiredDocument: requiredDoc },
        };
    }
    /**
     * Create a delivery condition
     *
     * @example
     * ConditionBuilder.delivery('Final deliverables submitted')
     */
    static delivery(description, releasePercent) {
        return {
            id: crypto_1.default.randomUUID(),
            description,
            type: 'delivery',
            status: 'pending',
            ...(releasePercent !== undefined && { releasePercentage: releasePercent.toString() }),
        };
    }
    /**
     * Create a shipping condition
     *
     * @example
     * ConditionBuilder.shipping('Item shipped with tracking')
     */
    static shipping(description) {
        return {
            id: crypto_1.default.randomUUID(),
            description,
            type: 'shipping',
            status: 'pending',
        };
    }
    /**
     * Create a receipt/confirmation condition
     *
     * @example
     * ConditionBuilder.receipt('Buyer confirms receipt of goods')
     */
    static receipt(description) {
        return {
            id: crypto_1.default.randomUUID(),
            description,
            type: 'receipt',
            status: 'pending',
        };
    }
    /**
     * Create a verification condition
     *
     * @example
     * ConditionBuilder.verification('Both parties confirm deposit')
     */
    static verification(description) {
        return {
            id: crypto_1.default.randomUUID(),
            description,
            type: 'verification',
            status: 'pending',
        };
    }
    /**
     * Create a custom condition
     *
     * @example
     * ConditionBuilder.custom('SLA requirements met', { slaLevel: 'premium' })
     */
    static custom(description, metadata) {
        return {
            id: crypto_1.default.randomUUID(),
            description,
            type: 'custom',
            status: 'pending',
            metadata,
        };
    }
    /**
     * Create a real estate inspection condition
     */
    static inspection(description, deadlineDays) {
        const deadline = deadlineDays
            ? new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined;
        return {
            id: crypto_1.default.randomUUID(),
            description,
            type: 'inspection',
            status: 'pending',
            ...(deadline && { deadline }),
        };
    }
    /**
     * Create a financing condition
     */
    static financing(description, deadlineDays) {
        const deadline = deadlineDays
            ? new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined;
        return {
            id: crypto_1.default.randomUUID(),
            description,
            type: 'financing',
            status: 'pending',
            ...(deadline && { deadline }),
        };
    }
    /**
     * Create a title condition
     */
    static title(description) {
        return {
            id: crypto_1.default.randomUUID(),
            description,
            type: 'title',
            status: 'pending',
        };
    }
}
exports.ConditionBuilder = ConditionBuilder;
//# sourceMappingURL=condition-builder.js.map