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
export { AgentState, Platform, PlatformLink, AgentIdentity, AgentIdentityDefinition, agentStateFromJSON, agentStateToJSON, platformFromJSON, platformToJSON, } from '../../generated/ottochain/apps/identity/v1/agent.js';
export { AttestationType, ReputationDelta, Attestation, VouchRequest, ChallengeRequest, ReputationConfig, attestationTypeFromJSON, attestationTypeToJSON, } from '../../generated/ottochain/apps/identity/v1/attestation.js';
/**
 * Get the agent identity state machine definition.
 *
 * @returns The state machine definition JSON for AgentIdentity
 */
export declare function getIdentityDefinition(): unknown;
