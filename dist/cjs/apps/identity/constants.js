"use strict";
/**
 * Identity Constants
 *
 * State machine transitions and configuration constants for agent identity.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReputationDelta = exports.canTransition = exports.ATTESTATION_DELTAS = exports.AGENT_TRANSITIONS = void 0;
const agent_js_1 = require("../../generated/ottochain/apps/identity/v1/agent.js");
const attestation_js_1 = require("../../generated/ottochain/apps/identity/v1/attestation.js");
// ---------------------------------------------------------------------------
// State Machine Transitions
// ---------------------------------------------------------------------------
/**
 * Valid transitions for each agent state.
 * Maps current state to allowed event names.
 */
exports.AGENT_TRANSITIONS = {
    [agent_js_1.AgentState.AGENT_STATE_UNSPECIFIED]: [],
    [agent_js_1.AgentState.AGENT_STATE_REGISTERED]: ['activate', 'withdraw'],
    [agent_js_1.AgentState.AGENT_STATE_ACTIVE]: ['challenge', 'withdraw'],
    [agent_js_1.AgentState.AGENT_STATE_CHALLENGED]: ['uphold_challenge', 'dismiss_challenge'],
    [agent_js_1.AgentState.AGENT_STATE_SUSPENDED]: ['begin_probation'],
    [agent_js_1.AgentState.AGENT_STATE_PROBATION]: ['complete_probation'],
    [agent_js_1.AgentState.AGENT_STATE_WITHDRAWN]: [], // Terminal state
    [agent_js_1.AgentState.UNRECOGNIZED]: [],
};
// ---------------------------------------------------------------------------
// Reputation Configuration
// ---------------------------------------------------------------------------
/**
 * Reputation delta by attestation type.
 * These values match the metagraph state machine defaults.
 */
exports.ATTESTATION_DELTAS = {
    [attestation_js_1.AttestationType.ATTESTATION_TYPE_UNSPECIFIED]: 0,
    [attestation_js_1.AttestationType.ATTESTATION_TYPE_COMPLETION]: 5,
    [attestation_js_1.AttestationType.ATTESTATION_TYPE_VOUCH]: 2,
    [attestation_js_1.AttestationType.ATTESTATION_TYPE_VIOLATION]: -10,
    [attestation_js_1.AttestationType.ATTESTATION_TYPE_BEHAVIORAL]: 3,
    [attestation_js_1.AttestationType.UNRECOGNIZED]: 0,
};
/**
 * Check if a transition is valid for the given state.
 */
function canTransition(state, event) {
    return exports.AGENT_TRANSITIONS[state]?.includes(event) ?? false;
}
exports.canTransition = canTransition;
/**
 * Get reputation delta for an attestation type.
 */
function getReputationDelta(type) {
    return exports.ATTESTATION_DELTAS[type] ?? 0;
}
exports.getReputationDelta = getReputationDelta;
