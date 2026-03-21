/**
 * Identity Application
 *
 * Types and utilities for the Identity system on OttoChain.
 * Includes agents, oracles, and services.
 *
 * @example
 * ```typescript
 * import {
 *   IdentityState,
 *   IdentityType,
 *   getIdentityDefinition
 * } from '@ottochain/sdk/apps/identity';
 *
 * const oracleDef = getIdentityDefinition('oracle');
 * ```
 *
 * @packageDocumentation
 */

// Re-export generated protobuf types (source of truth)
export {
  IdentityType,
  IdentityState,
  Platform,
  PlatformLink,
  Reputation,
  PenaltyEvent,
  Identity,
  RegisterIdentityRequest,
  ActivateIdentityRequest,
  UpdateStakeRequest,
  ChallengeIdentityRequest,
  PenalizeIdentityRequest,
  WithdrawIdentityRequest,
  IdentityDefinition,
  identityTypeFromJSON,
  identityTypeToJSON,
  identityStateFromJSON,
  identityStateToJSON,
  platformFromJSON,
  platformToJSON,
} from '../../generated/ottochain/apps/identity/v1/identity.js';

export {
  AttestationType,
  ReputationDelta,
  Attestation,
  VouchRequest,
  ChallengeRequest,
  ReputationConfig,
  attestationTypeFromJSON,
  attestationTypeToJSON,
} from '../../generated/ottochain/apps/identity/v1/attestation.js';

// Re-export constants and utilities
export {
  IDENTITY_TRANSITIONS,
  AGENT_TRANSITIONS, // Legacy alias
  ATTESTATION_DELTAS,
  IDENTITY_TYPE_NAMES,
  canTransition,
  getReputationDelta,
} from './constants.js';

// ---------------------------------------------------------------------------
// Configuration Defaults
// ---------------------------------------------------------------------------

/**
 * Default reputation configuration for identities
 */
export const DEFAULT_REPUTATION_CONFIG = {
  baseReputation: 10,
  completionDelta: 5,
  vouchDelta: 2,
  violationDelta: -10,
  behavioralDelta: 3,
  minReputation: 0,
  challengeThreshold: 5,
} as const;

/**
 * Default oracle configuration
 */
export const DEFAULT_ORACLE_CONFIG = {
  minStake: 100,
  slashCooldownEpochs: 7,
  accuracyThreshold: 70,
  maxDisputeRate: 30,
} as const;

// ---------------------------------------------------------------------------
// State Machine Definitions (generated from JSON at build time)
// ---------------------------------------------------------------------------

import {
  identityUniversalDef,
  identityAgentDef,
  identityOracleDef,
} from './state-machines/index.js';

export { identityUniversalDef, identityAgentDef, identityOracleDef };

/** All identity state machine definitions */
export const IDENTITY_DEFINITIONS = {
  universal: identityUniversalDef,
  agent: identityAgentDef,
  oracle: identityOracleDef,
} as const;

export type IdentityDefType = keyof typeof IDENTITY_DEFINITIONS;

/**
 * Get an identity state machine definition by type.
 * @param type - 'universal' | 'agent' | 'oracle' (default: 'agent')
 */
export function getIdentityDefinition(type: IdentityDefType = 'agent'): unknown {
  return IDENTITY_DEFINITIONS[type];
}
