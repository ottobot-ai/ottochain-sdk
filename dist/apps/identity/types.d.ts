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
 * Valid transitions for each agent state
 */
export declare const AGENT_TRANSITIONS: Record<AgentState, readonly string[]>;
/**
 * Reputation delta by attestation type
 */
export declare const ATTESTATION_DELTAS: Record<AttestationType, number>;
