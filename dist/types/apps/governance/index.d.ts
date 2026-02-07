/**
 * Governance & DAO Module
 *
 * Types and utilities for DAO governance state machines.
 *
 * @example
 * ```typescript
 * import { governance } from '@ottochain/sdk/apps';
 *
 * // Create initial state for a 2-of-3 multisig
 * const state = governance.createMultisigState({
 *   name: 'Team Treasury',
 *   signers: ['DAG...', 'DAG...', 'DAG...'],
 *   threshold: 2
 * });
 *
 * // Check if threshold met
 * if (governance.isThresholdMet(state)) {
 *   console.log('Ready to execute!');
 * }
 * ```
 *
 * @packageDocumentation
 */
export * from './types.js';
import type { SingleOwnerDAOState, MultisigDAOState, TokenDAOState, ThresholdDAOState, DAOMetadata } from './types.js';
/**
 * Create initial state for a SingleOwnerDAO
 */
export declare function createSingleOwnerState(params: {
    name: string;
    owner: string;
    metadata?: DAOMetadata;
}): SingleOwnerDAOState;
/**
 * Create initial state for a MultisigDAO
 */
export declare function createMultisigState(params: {
    name: string;
    signers: string[];
    threshold: number;
    proposalTTLMs?: number;
    metadata?: DAOMetadata;
}): MultisigDAOState;
/**
 * Create initial state for a TokenDAO
 */
export declare function createTokenState(params: {
    name: string;
    tokenId: string;
    initialBalances?: Record<string, number>;
    proposalThreshold?: number;
    votingPeriodMs?: number;
    timelockMs?: number;
    quorum?: number;
    metadata?: DAOMetadata;
}): TokenDAOState;
/**
 * Create initial state for a ThresholdDAO
 */
export declare function createThresholdState(params: {
    name: string;
    memberThreshold?: number;
    voteThreshold?: number;
    proposeThreshold?: number;
    quorum?: number;
    votingPeriodMs?: number;
    metadata?: DAOMetadata;
}): ThresholdDAOState;
/**
 * Check if multisig has enough signatures to execute
 */
export declare function isThresholdMet(state: MultisigDAOState): boolean;
/**
 * Get remaining signatures needed
 */
export declare function signaturesNeeded(state: MultisigDAOState): number;
/**
 * Check if agent is a signer
 */
export declare function isSigner(state: MultisigDAOState, agent: string): boolean;
/**
 * Check if agent has signed current proposal
 */
export declare function hasSigned(state: MultisigDAOState, agent: string): boolean;
/**
 * Get effective voting power (includes delegation)
 */
export declare function getVotingPower(state: TokenDAOState, agent: string): number;
/**
 * Check if proposal has quorum
 */
export declare function hasQuorum(state: TokenDAOState): boolean;
/**
 * Check if proposal is passing
 */
export declare function isPassing(state: TokenDAOState): boolean;
/**
 * Check if agent can propose
 */
export declare function canPropose(state: TokenDAOState, agent: string): boolean;
/**
 * Check if agent meets threshold for action
 */
export declare function meetsThreshold(state: ThresholdDAOState, reputation: number, action: 'member' | 'vote' | 'propose'): boolean;
/**
 * Check if agent is a member
 */
export declare function isMember(state: ThresholdDAOState, agent: string): boolean;
/**
 * Check if threshold proposal has quorum
 */
export declare function thresholdHasQuorum(state: ThresholdDAOState): boolean;
