/**
 * Oracles Application
 *
 * Types and utilities for oracles on OttoChain.
 *
 * @example
 * ```typescript
 * import {
 *   OracleState,
 *   Oracle,
 *   getOracleDefinition,
 *   DEFAULT_ORACLE_CONFIG
 * } from '@ottochain/sdk/apps/oracles';
 *
 * const oracleDef = getOracleDefinition();
 * ```
 *
 * @packageDocumentation
 */
export { OracleState, OracleReputation, SlashingEvent, Oracle, RegisterOracleRequest, ActivateOracleRequest, AddStakeRequest, WithdrawStakeRequest, SlashOracleRequest, WithdrawOracleRequest, OracleDefinition, oracleStateFromJSON, oracleStateToJSON, } from '../../generated/ottochain/apps/oracles/v1/oracle.js';
export type OracleDefinitionType = 'Oracle';
export declare const ORACLE_DEFINITIONS: Record<OracleDefinitionType, unknown>;
/**
 * Get the oracle state machine definition.
 */
export declare function getOracleDefinition(type?: OracleDefinitionType): unknown;
/**
 * Default oracle configuration.
 */
export declare const DEFAULT_ORACLE_CONFIG: {
    minStake: number;
    baseReputation: number;
    reputationDecay: number;
};
