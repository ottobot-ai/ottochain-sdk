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

// Re-export generated protobuf types (source of truth)
export {
  OracleState,
  OracleReputation,
  SlashingEvent,
  Oracle,
  RegisterOracleRequest,
  ActivateOracleRequest,
  AddStakeRequest,
  WithdrawStakeRequest,
  SlashOracleRequest,
  WithdrawOracleRequest,
  OracleDefinition,
  oracleStateFromJSON,
  oracleStateToJSON,
} from '../../generated/ottochain/apps/oracles/v1/oracle.js';

// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------

import oracleDef from './state-machines/oracle.json';

export type OracleDefinitionType = 'Oracle';

export const ORACLE_DEFINITIONS: Record<OracleDefinitionType, unknown> = {
  Oracle: oracleDef,
};

/**
 * Get the oracle state machine definition.
 */
export function getOracleDefinition(type: OracleDefinitionType = 'Oracle'): unknown {
  return ORACLE_DEFINITIONS[type];
}

/**
 * Default oracle configuration.
 */
export const DEFAULT_ORACLE_CONFIG = {
  minStake: 100,
  baseReputation: 10,
  reputationDecay: 0.95,
};
