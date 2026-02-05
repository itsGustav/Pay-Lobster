/**
 * Condition Builder
 * 
 * Fluent API for building custom escrow release conditions.
 */

import crypto from 'crypto';

export type ConditionType = 
  // Real Estate
  | 'inspection' | 'financing' | 'appraisal' | 'title' | 'closing' | 'move_out'
  // Freelance/Milestones
  | 'milestone' | 'delivery' | 'approval' | 'revision'
  // Commerce
  | 'shipping' | 'receipt' | 'verification'
  // Document/Time-based
  | 'document' | 'deadline'
  // Custom
  | 'custom';

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
export class ConditionBuilder {
  /**
   * Create a milestone condition (with optional partial release)
   * 
   * @example
   * ConditionBuilder.milestone('Design approved', 25)
   * // Releases 25% when satisfied
   */
  static milestone(description: string, releasePercent?: number): BuiltCondition {
    return {
      id: crypto.randomUUID(),
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
  static approval(fromRole: string, description?: string): BuiltCondition {
    return {
      id: crypto.randomUUID(),
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
  static deadline(date: Date, description?: string): BuiltCondition {
    return {
      id: crypto.randomUUID(),
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
  static document(requiredDoc: string, description?: string): BuiltCondition {
    return {
      id: crypto.randomUUID(),
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
  static delivery(description: string, releasePercent?: number): BuiltCondition {
    return {
      id: crypto.randomUUID(),
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
  static shipping(description: string): BuiltCondition {
    return {
      id: crypto.randomUUID(),
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
  static receipt(description: string): BuiltCondition {
    return {
      id: crypto.randomUUID(),
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
  static verification(description: string): BuiltCondition {
    return {
      id: crypto.randomUUID(),
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
  static custom(description: string, metadata?: Record<string, any>): BuiltCondition {
    return {
      id: crypto.randomUUID(),
      description,
      type: 'custom',
      status: 'pending',
      metadata,
    };
  }

  /**
   * Create a real estate inspection condition
   */
  static inspection(description: string, deadlineDays?: number): BuiltCondition {
    const deadline = deadlineDays 
      ? new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    return {
      id: crypto.randomUUID(),
      description,
      type: 'inspection',
      status: 'pending',
      ...(deadline && { deadline }),
    };
  }

  /**
   * Create a financing condition
   */
  static financing(description: string, deadlineDays?: number): BuiltCondition {
    const deadline = deadlineDays 
      ? new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    return {
      id: crypto.randomUUID(),
      description,
      type: 'financing',
      status: 'pending',
      ...(deadline && { deadline }),
    };
  }

  /**
   * Create a title condition
   */
  static title(description: string): BuiltCondition {
    return {
      id: crypto.randomUUID(),
      description,
      type: 'title',
      status: 'pending',
    };
  }
}
