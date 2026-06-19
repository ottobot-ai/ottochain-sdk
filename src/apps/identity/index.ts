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

// Re-export generated protobuf types (source of truth).
// The nested lifecycle/kind enums dropped their app prefix in the proto; under
// this app-scoped entrypoint they are unambiguously Type / State.
export {
  Type,
  State,
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
  typeFromJSON,
  typeToJSON,
  stateFromJSON,
  stateToJSON,
  platformFromJSON,
  platformToJSON,
} from "../../generated/ottochain/apps/identity/v1/identity.js";

// Legacy aliases for backward compatibility
export { State as AgentState } from "../../generated/ottochain/apps/identity/v1/identity.js";
// Deprecated app-prefixed aliases (renamed to Type / State); kept for compat.
export {
  Type as IdentityType,
  State as IdentityState,
  typeFromJSON as identityTypeFromJSON,
  typeToJSON as identityTypeToJSON,
  stateFromJSON as identityStateFromJSON,
  stateToJSON as identityStateToJSON,
} from "../../generated/ottochain/apps/identity/v1/identity.js";

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
  REGISTRY_ROLES,
  REGISTRY_ROLE_MAP,
  registryRolePath,
  registryReputationPath,
  canTransition,
  getReputationDelta,
} from "./constants.js";
export type { RegistryRole } from "./constants.js";

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
  identityRegistryDef,
} from "./state-machines/index.js";
import type { FiberAppDefinition } from "../../schema/fiber-app.js";

export {
  identityUniversalDef,
  identityAgentDef,
  identityOracleDef,
  identityRegistryDef,
};

/** All identity state machine definitions */
export const IDENTITY_DEFINITIONS = {
  universal: identityUniversalDef,
  agent: identityAgentDef,
  oracle: identityOracleDef,
  registry: identityRegistryDef,
} as const;

export type IdentityDefType = keyof typeof IDENTITY_DEFINITIONS;

/**
 * Get an identity state machine definition by type.
 * @param type - 'universal' | 'agent' | 'oracle' | 'registry' (default: 'agent')
 */
export function getIdentityDefinition(
  type: IdentityDefType = "agent",
): FiberAppDefinition {
  return IDENTITY_DEFINITIONS[type];
}
