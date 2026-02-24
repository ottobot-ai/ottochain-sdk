/**
 * Identity Constants
 *
 * State machine transitions and configuration constants for agent identity.
 *
 * @packageDocumentation
 */
import { AgentState } from '../../generated/ottochain/apps/identity/v1/agent.js';
import { AttestationType } from '../../generated/ottochain/apps/identity/v1/attestation.js';
/**
 * Valid transitions for each agent state.
 * Maps current state to allowed event names.
 */
export declare const AGENT_TRANSITIONS: Record<AgentState, readonly string[]>;
/**
 * Reputation delta by attestation type.
 * These values match the metagraph state machine defaults.
 */
export declare const ATTESTATION_DELTAS: Record<AttestationType, number>;
/**
 * Check if a transition is valid for the given state.
 */
export declare function canTransition(state: AgentState, event: string): boolean;
/**
 * Get reputation delta for an attestation type.
 */
export declare function getReputationDelta(type: AttestationType): number;
