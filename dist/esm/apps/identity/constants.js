/**
 * Identity Constants
 *
 * State machine transitions and configuration constants for agent identity.
 *
 * @packageDocumentation
 */
import { AgentState } from '../../generated/ottochain/apps/identity/v1/agent.js';
import { AttestationType } from '../../generated/ottochain/apps/identity/v1/attestation.js';
// ---------------------------------------------------------------------------
// State Machine Transitions
// ---------------------------------------------------------------------------
/**
 * Valid transitions for each agent state.
 * Maps current state to allowed event names.
 */
export const AGENT_TRANSITIONS = {
    [AgentState.AGENT_STATE_UNSPECIFIED]: [],
    [AgentState.AGENT_STATE_REGISTERED]: ['activate', 'withdraw'],
    [AgentState.AGENT_STATE_ACTIVE]: ['challenge', 'withdraw'],
    [AgentState.AGENT_STATE_CHALLENGED]: ['uphold_challenge', 'dismiss_challenge'],
    [AgentState.AGENT_STATE_SUSPENDED]: ['begin_probation'],
    [AgentState.AGENT_STATE_PROBATION]: ['complete_probation'],
    [AgentState.AGENT_STATE_WITHDRAWN]: [], // Terminal state
    [AgentState.UNRECOGNIZED]: [],
};
// ---------------------------------------------------------------------------
// Reputation Configuration
// ---------------------------------------------------------------------------
/**
 * Reputation delta by attestation type.
 * These values match the metagraph state machine defaults.
 */
export const ATTESTATION_DELTAS = {
    [AttestationType.ATTESTATION_TYPE_UNSPECIFIED]: 0,
    [AttestationType.ATTESTATION_TYPE_COMPLETION]: 5,
    [AttestationType.ATTESTATION_TYPE_VOUCH]: 2,
    [AttestationType.ATTESTATION_TYPE_VIOLATION]: -10,
    [AttestationType.ATTESTATION_TYPE_BEHAVIORAL]: 3,
    [AttestationType.UNRECOGNIZED]: 0,
};
/**
 * Check if a transition is valid for the given state.
 */
export function canTransition(state, event) {
    return AGENT_TRANSITIONS[state]?.includes(event) ?? false;
}
/**
 * Get reputation delta for an attestation type.
 */
export function getReputationDelta(type) {
    return ATTESTATION_DELTAS[type] ?? 0;
}
