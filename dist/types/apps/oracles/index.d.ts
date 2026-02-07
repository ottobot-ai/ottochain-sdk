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
export * from './types.js';
