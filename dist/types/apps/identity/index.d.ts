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
 * Default reputation configuration for agent identity
 */
export declare const DEFAULT_REPUTATION_CONFIG: {
    readonly baseReputation: 10;
    readonly completionDelta: 5;
    readonly vouchDelta: 2;
    readonly violationDelta: -10;
    readonly behavioralDelta: 3;
    readonly minReputation: 0;
    readonly challengeThreshold: 5;
};
/**
 * Get the agent identity state machine definition.
 *
 * @returns The state machine definition JSON for AgentIdentity
 */
export declare function getIdentityDefinition(): unknown;
