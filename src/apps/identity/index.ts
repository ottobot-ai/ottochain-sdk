/**
 * Agent Identity Application
 * 
 * Types and utilities for the Agent Identity system on OttoChain.
 * 
 * @example
 * ```typescript
 * import { 
 *   AgentState, 
 *   AttestationType, 
 *   AgentIdentitySchema,
 *   getIdentityDefinition 
 * } from '@ottochain/sdk/apps/identity';
 * import { create } from '@bufbuild/protobuf';
 * 
 * // Get the agent identity state machine definition
 * const identityDef = getIdentityDefinition();
 * 
 * const agent = create(AgentIdentitySchema, {
 *   publicKey: '...',
 *   reputation: 10,
 *   state: AgentState.REGISTERED,
 * });
 * ```
 * 
 * @packageDocumentation
 */

// Re-export generated protobuf types
export * from '../../generated/ottochain/apps/identity/v1/agent_pb.js';
export * from '../../generated/ottochain/apps/identity/v1/attestation_pb.js';

// Re-export convenience types and constants
export * from './types.js';

// ---------------------------------------------------------------------------
// State Machine JSON Definition
// ---------------------------------------------------------------------------

import agentIdentityDef from './state-machines/agent-identity.json';

/**
 * Get the agent identity state machine definition.
 * 
 * @returns The state machine definition JSON for AgentIdentity
 */
export function getIdentityDefinition(): unknown {
  return agentIdentityDef;
}
