/**
 * Agent Identity Utilities
 *
 * Constants and utilities for the Agent Identity application.
 * Core types are generated from protobuf - see the generated exports.
 *
 * @packageDocumentation
 */
import { AgentState } from '../../generated/ottochain/apps/identity/v1/agent_pb.js';
import { AttestationType } from '../../generated/ottochain/apps/identity/v1/attestation_pb.js';
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
// State Machine Transitions
// ---------------------------------------------------------------------------
/**
 * Valid transitions for each agent state
 */
export const AGENT_TRANSITIONS = {
    [AgentState.UNSPECIFIED]: [],
    [AgentState.REGISTERED]: ['activate', 'withdraw'],
    [AgentState.ACTIVE]: ['challenge', 'withdraw'],
    [AgentState.CHALLENGED]: ['uphold_challenge', 'dismiss_challenge'],
    [AgentState.SUSPENDED]: ['begin_probation'],
    [AgentState.PROBATION]: ['complete_probation'],
    [AgentState.WITHDRAWN]: [], // Terminal state
};
/**
 * Reputation delta by attestation type
 */
export const ATTESTATION_DELTAS = {
    [AttestationType.UNSPECIFIED]: 0,
    [AttestationType.COMPLETION]: 5,
    [AttestationType.VOUCH]: 2,
    [AttestationType.VIOLATION]: -10,
    [AttestationType.BEHAVIORAL]: 3,
};
