/**
 * Condition Builder
 *
 * Fluent API for building custom escrow release conditions.
 */
export type ConditionType = 'inspection' | 'financing' | 'appraisal' | 'title' | 'closing' | 'move_out' | 'milestone' | 'delivery' | 'approval' | 'revision' | 'shipping' | 'receipt' | 'verification' | 'document' | 'deadline' | 'custom';
export interface BuiltCondition {
    id: string;
    description: string;
    type: ConditionType;
    status: 'pending' | 'satisfied' | 'waived' | 'failed';
    deadline?: string;
    releaseAmount?: string;
    releasePercentage?: string;
    metadata?: Record<string, any>;
}
/**
 * Fluent builder for escrow conditions
 */
export declare class ConditionBuilder {
    /**
     * Create a milestone condition (with optional partial release)
     *
     * @example
     * ConditionBuilder.milestone('Design approved', 25)
     * // Releases 25% when satisfied
     */
    static milestone(description: string, releasePercent?: number): BuiltCondition;
    /**
     * Create an approval condition (requires specific party approval)
     *
     * @example
     * ConditionBuilder.approval('client')
     */
    static approval(fromRole: string, description?: string): BuiltCondition;
    /**
     * Create a deadline condition
     *
     * @example
     * ConditionBuilder.deadline(new Date('2026-03-01'), 'Project completion deadline')
     */
    static deadline(date: Date, description?: string): BuiltCondition;
    /**
     * Create a document requirement condition
     *
     * @example
     * ConditionBuilder.document('Signed contract', 'Contract must be signed and uploaded')
     */
    static document(requiredDoc: string, description?: string): BuiltCondition;
    /**
     * Create a delivery condition
     *
     * @example
     * ConditionBuilder.delivery('Final deliverables submitted')
     */
    static delivery(description: string, releasePercent?: number): BuiltCondition;
    /**
     * Create a shipping condition
     *
     * @example
     * ConditionBuilder.shipping('Item shipped with tracking')
     */
    static shipping(description: string): BuiltCondition;
    /**
     * Create a receipt/confirmation condition
     *
     * @example
     * ConditionBuilder.receipt('Buyer confirms receipt of goods')
     */
    static receipt(description: string): BuiltCondition;
    /**
     * Create a verification condition
     *
     * @example
     * ConditionBuilder.verification('Both parties confirm deposit')
     */
    static verification(description: string): BuiltCondition;
    /**
     * Create a custom condition
     *
     * @example
     * ConditionBuilder.custom('SLA requirements met', { slaLevel: 'premium' })
     */
    static custom(description: string, metadata?: Record<string, any>): BuiltCondition;
    /**
     * Create a real estate inspection condition
     */
    static inspection(description: string, deadlineDays?: number): BuiltCondition;
    /**
     * Create a financing condition
     */
    static financing(description: string, deadlineDays?: number): BuiltCondition;
    /**
     * Create a title condition
     */
    static title(description: string): BuiltCondition;
}
//# sourceMappingURL=condition-builder.d.ts.map