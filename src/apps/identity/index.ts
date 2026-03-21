/**
 * Agent Identity Application
 *
 * Types and utilities for the Agent Identity system on OttoChain.
 *
 * @example
 * ```typescript
 * import {
 *   AgentState,
 *   AgentIdentity,
 *   getIdentityDefinition
 * } from '@ottochain/sdk/apps/identity';
 *
 * const identityDef = getIdentityDefinition();
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
  LinkPlatformRequest,
  ChallengeIdentityRequest,
  AddStakeRequest,
  WithdrawIdentityRequest,
  IdentityDefinition,
  identityTypeFromJSON,
  identityTypeToJSON,
  identityStateFromJSON,
  identityStateToJSON,
  platformFromJSON,
  platformToJSON,
} from "../../generated/ottochain/apps/identity/v1/identity.js";

// Legacy aliases for backward compatibility
export { IdentityState as AgentState } from "../../generated/ottochain/apps/identity/v1/identity.js";

export {
  AttestationType,
  ReputationDelta,
  Attestation,
  VouchRequest,
  ChallengeRequest,
  ReputationConfig,
  attestationTypeFromJSON,
  attestationTypeToJSON,
} from "../../generated/ottochain/apps/identity/v1/attestation.js";

// Re-export constants and utilities
export {
  IDENTITY_TRANSITIONS,
  AGENT_TRANSITIONS,
  ATTESTATION_DELTAS,
  canTransition,
  getReputationDelta,
} from "./constants.js";

// ---------------------------------------------------------------------------
// Configuration Defaults
// ---------------------------------------------------------------------------

/**
 * Default reputation configuration for agent identity
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

// ---------------------------------------------------------------------------
// State Machine Definitions (generated from JSON at build time)
// ---------------------------------------------------------------------------

import {
  identityUniversalDef,
  identityAgentDef,
  identityOracleDef,
} from "./state-machines/index.js";
import type { FiberAppDefinition } from "../../schema/fiber-app.js";

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
export function getIdentityDefinition(
  type: IdentityDefType = "agent",
): FiberAppDefinition {
  return IDENTITY_DEFINITIONS[type];
}
