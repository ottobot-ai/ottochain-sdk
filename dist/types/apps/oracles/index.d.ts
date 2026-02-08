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
export * from '../../generated/ottochain/apps/oracles/v1/oracle_pb.js';
export * from './types.js';
/**
 * Oracle definition type.
 */
export type OracleDefinitionType = 'Oracle';
/**
 * Oracle state machine definitions mapped by type.
 */
export declare const ORACLE_DEFINITIONS: Record<OracleDefinitionType, unknown>;
/**
 * Get the oracle state machine definition.
 *
 * @param type - Definition type (default: 'Oracle')
 * @returns The state machine definition JSON
 */
export declare function getOracleDefinition(type?: OracleDefinitionType): unknown;
