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
 *   DEFAULT_ORACLE_CONFIG 
 * } from '@ottochain/sdk/apps/oracles';
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

// Note: Once proto files are generated, uncomment these exports:
// export * from '../../generated/ottochain/apps/oracles/v1/oracle_pb.js';
// export * from '../../generated/ottochain/apps/oracles/v1/resolution_pb.js';

// Export convenience types, constants, and helpers
export * from './types.js';
