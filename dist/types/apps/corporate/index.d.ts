/**
 * Corporate Governance Application
 *
 * State machines and types for corporate entity management including
 * board governance, shareholder meetings, securities, and compliance.
 *
 * @example
 * ```typescript
 * import { getCorporateDefinition } from '@ottochain/sdk/apps/corporate';
 *
 * // Get state machine definition for corporate entity
 * const entityDef = getCorporateDefinition('Entity');
 * const boardDef = getCorporateDefinition('Board');
 * ```
 *
 * @packageDocumentation
 */
export * from './types.js';
/**
 * Corporate state machine types.
 */
export type CorporateType = 'Entity' | 'Board' | 'Shareholders' | 'Officers' | 'Securities' | 'Compliance' | 'Bylaws' | 'Committee' | 'Proxy' | 'Resolution';
/**
 * Corporate state machine definitions mapped by type.
 */
export declare const CORPORATE_DEFINITIONS: Record<CorporateType, unknown>;
/**
 * Get the state machine definition for a corporate governance type.
 *
 * @param type - Corporate type (Entity, Board, Shareholders, etc.)
 * @returns The state machine definition JSON
 */
export declare function getCorporateDefinition(type: CorporateType): unknown;
