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
export { AgentState, Platform, PlatformLink, AgentIdentity, AgentIdentityDefinition, agentStateFromJSON, agentStateToJSON, platformFromJSON, platformToJSON, } from '../../generated/ottochain/apps/identity/v1/agent.js';
export { AttestationType, ReputationDelta, Attestation, VouchRequest, ChallengeRequest, ReputationConfig, attestationTypeFromJSON, attestationTypeToJSON, } from '../../generated/ottochain/apps/identity/v1/attestation.js';
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
};
// ---------------------------------------------------------------------------
// State Machine JSON Definition
// ---------------------------------------------------------------------------
import agentIdentityDef from './state-machines/agent-identity.json';
/**
 * Get the agent identity state machine definition.
 *
 * @returns The state machine definition JSON for AgentIdentity
 */
export function getIdentityDefinition() {
    return agentIdentityDef;
}
