"use strict";
/**
 * Agent Identity Utilities
 *
 * Constants and utilities for the Agent Identity application.
 * Core types are generated from protobuf - see the generated exports.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATTESTATION_DELTAS = exports.AGENT_TRANSITIONS = exports.DEFAULT_REPUTATION_CONFIG = void 0;
const agent_pb_js_1 = require("../../generated/ottochain/apps/identity/v1/agent_pb.js");
const attestation_pb_js_1 = require("../../generated/ottochain/apps/identity/v1/attestation_pb.js");
// ---------------------------------------------------------------------------
// Configuration Defaults
// ---------------------------------------------------------------------------
/**
 * Default reputation configuration for agent identity
 */
exports.DEFAULT_REPUTATION_CONFIG = {
    baseReputation: 10,
    completionDelta: 5,
    vouchDelta: 2,
    violationDelta: -10,
    behavioralDelta: 3,
    minReputation: 0,
    challengeThreshold: 5,
};
// ---------------------------------------------------------------------------
// State Machine Transitions
// ---------------------------------------------------------------------------
/**
 * Valid transitions for each agent state
 */
exports.AGENT_TRANSITIONS = {
    [agent_pb_js_1.AgentState.UNSPECIFIED]: [],
    [agent_pb_js_1.AgentState.REGISTERED]: ['activate', 'withdraw'],
    [agent_pb_js_1.AgentState.ACTIVE]: ['challenge', 'withdraw'],
    [agent_pb_js_1.AgentState.CHALLENGED]: ['uphold_challenge', 'dismiss_challenge'],
    [agent_pb_js_1.AgentState.SUSPENDED]: ['begin_probation'],
    [agent_pb_js_1.AgentState.PROBATION]: ['complete_probation'],
    [agent_pb_js_1.AgentState.WITHDRAWN]: [], // Terminal state
};
/**
 * Reputation delta by attestation type
 */
exports.ATTESTATION_DELTAS = {
    [attestation_pb_js_1.AttestationType.UNSPECIFIED]: 0,
    [attestation_pb_js_1.AttestationType.COMPLETION]: 5,
    [attestation_pb_js_1.AttestationType.VOUCH]: 2,
    [attestation_pb_js_1.AttestationType.VIOLATION]: -10,
    [attestation_pb_js_1.AttestationType.BEHAVIORAL]: 3,
};
