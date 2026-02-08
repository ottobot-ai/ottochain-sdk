/**
 * Oracles Application
 * 
 * Types and utilities for the Oracle system on OttoChain.
 * Oracles provide truth resolution for markets, disputes, and attestations.
 * 
 * @example
 * ```typescript
 * import { 
 *   OracleState, 
 *   SlashingReason,
 *   calculateReputation,
 *   calculateSlashAmount,
 *   DEFAULT_ORACLE_CONFIG,
 *   getOracleDefinition
 * } from '@ottochain/sdk/apps/oracles';
 * 
 * // Get the oracle state machine definition
 * const oracleDef = getOracleDefinition();
 * 
 * // Calculate new reputation after successful resolution
 * const newRep = calculateReputation(50, REPUTATION_DELTAS.successfulResolution);
 * 
 * // Calculate slash for timeout
 * const slashAmount = calculateSlashAmount(10000n, SlashingReason.TIMEOUT);
 * ```
 * 
 * @packageDocumentation
 */

// Re-export generated protobuf types
export * from '../../generated/ottochain/apps/oracles/v1/oracle_pb.js';

// Export convenience types, constants, and helpers
export * from './types.js';

// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------

import oracleDef from './state-machines/oracle.json';

/**
 * Oracle definition type.
 */
export type OracleDefinitionType = 'Oracle';

/**
 * Oracle state machine definitions mapped by type.
 */
export const ORACLE_DEFINITIONS: Record<OracleDefinitionType, unknown> = {
  Oracle: oracleDef,
};

/**
 * Get the oracle state machine definition.
 * 
 * @param type - Definition type (default: 'Oracle')
 * @returns The state machine definition JSON
 */
export function getOracleDefinition(type: OracleDefinitionType = 'Oracle'): unknown {
  const def = ORACLE_DEFINITIONS[type];
  if (!def) {
    throw new Error(`Unknown oracle definition type: ${type}`);
  }
  return def;
}
