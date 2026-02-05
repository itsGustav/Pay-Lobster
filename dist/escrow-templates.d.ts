/**
 * Escrow Templates
 *
 * Pre-built escrow configurations for common use cases across multiple verticals.
 */
import type { EscrowCondition } from './escrow';
export type EscrowVertical = 'real_estate' | 'freelance' | 'commerce' | 'services' | 'p2p' | 'digital' | 'custom';
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
export declare const ESCROW_TEMPLATES: Record<string, EscrowTemplate>;
/**
 * Get template by name
 */
export declare function getTemplate(name: string): EscrowTemplate | undefined;
/**
 * List all templates
 */
export declare function listTemplates(): EscrowTemplate[];
/**
 * List templates by vertical
 */
export declare function listTemplatesByVertical(vertical: EscrowVertical): EscrowTemplate[];
/**
 * Get all verticals
 */
export declare function getVerticals(): EscrowVertical[];
//# sourceMappingURL=escrow-templates.d.ts.map