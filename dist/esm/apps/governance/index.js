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
// =============================================================================
// State Factories
// =============================================================================
/**
 * Create initial state for a SingleOwnerDAO
 */
export function createSingleOwnerState(params) {
    return {
        schema: 'SingleOwnerDAO',
        name: params.name,
        owner: params.owner,
        pendingOwner: null,
        transferInitiatedAt: null,
        actions: [],
        ownershipHistory: [],
        metadata: params.metadata ?? {},
        status: 'ACTIVE',
    };
}
/**
 * Create initial state for a MultisigDAO
 */
export function createMultisigState(params) {
    if (params.threshold < 1) {
        throw new Error('Threshold must be at least 1');
    }
    if (params.threshold > params.signers.length) {
        throw new Error('Threshold cannot exceed number of signers');
    }
    if (new Set(params.signers).size !== params.signers.length) {
        throw new Error('Duplicate signers not allowed');
    }
    return {
        schema: 'MultisigDAO',
        name: params.name,
        signers: params.signers,
        threshold: params.threshold,
        proposalTTLMs: params.proposalTTLMs ?? 7 * 24 * 60 * 60 * 1000, // 7 days
        proposal: null,
        signatures: {},
        actions: [],
        cancelledProposals: [],
        metadata: params.metadata ?? {},
        status: 'ACTIVE',
    };
}
/**
 * Create initial state for a TokenDAO
 */
export function createTokenState(params) {
    return {
        schema: 'TokenDAO',
        name: params.name,
        tokenId: params.tokenId,
        balances: params.initialBalances ?? {},
        delegations: {},
        proposalThreshold: params.proposalThreshold ?? 1000,
        votingPeriodMs: params.votingPeriodMs ?? 3 * 24 * 60 * 60 * 1000, // 3 days
        timelockMs: params.timelockMs ?? 24 * 60 * 60 * 1000, // 1 day
        quorum: params.quorum ?? 10000,
        proposal: null,
        votes: null,
        executedProposals: [],
        rejectedProposals: [],
        cancelledProposals: [],
        metadata: params.metadata ?? {},
        status: 'ACTIVE',
    };
}
/**
 * Create initial state for a ThresholdDAO
 */
export function createThresholdState(params) {
    return {
        schema: 'ThresholdDAO',
        name: params.name,
        members: [],
        memberJoinedAt: {},
        memberThreshold: params.memberThreshold ?? 20,
        voteThreshold: params.voteThreshold ?? 30,
        proposeThreshold: params.proposeThreshold ?? 50,
        quorum: params.quorum ?? 3,
        votingPeriodMs: params.votingPeriodMs ?? 7 * 24 * 60 * 60 * 1000, // 7 days
        proposal: null,
        votes: null,
        history: [],
        metadata: params.metadata ?? {},
        status: 'ACTIVE',
    };
}
// =============================================================================
// Multisig Helpers
// =============================================================================
/**
 * Check if multisig has enough signatures to execute
 */
export function isThresholdMet(state) {
    return Object.keys(state.signatures).length >= state.threshold;
}
/**
 * Get remaining signatures needed
 */
export function signaturesNeeded(state) {
    return Math.max(0, state.threshold - Object.keys(state.signatures).length);
}
/**
 * Check if agent is a signer
 */
export function isSigner(state, agent) {
    return state.signers.includes(agent);
}
/**
 * Check if agent has signed current proposal
 */
export function hasSigned(state, agent) {
    return agent in state.signatures;
}
// =============================================================================
// Token DAO Helpers
// =============================================================================
/**
 * Get effective voting power (includes delegation)
 */
export function getVotingPower(state, agent) {
    let power = state.balances[agent] ?? 0;
    // Add delegated power
    for (const [delegator, delegatee] of Object.entries(state.delegations)) {
        if (delegatee === agent) {
            power += state.balances[delegator] ?? 0;
        }
    }
    return power;
}
/**
 * Check if proposal has quorum
 */
export function hasQuorum(state) {
    if (!state.votes)
        return false;
    const totalVoted = state.votes.for + state.votes.against + state.votes.abstain;
    return totalVoted >= state.quorum;
}
/**
 * Check if proposal is passing
 */
export function isPassing(state) {
    if (!state.votes)
        return false;
    return state.votes.for > state.votes.against && hasQuorum(state);
}
/**
 * Check if agent can propose
 */
export function canPropose(state, agent) {
    return (state.balances[agent] ?? 0) >= state.proposalThreshold;
}
// =============================================================================
// Threshold DAO Helpers
// =============================================================================
/**
 * Check if agent meets threshold for action
 */
export function meetsThreshold(state, reputation, action) {
    switch (action) {
        case 'member':
            return reputation >= state.memberThreshold;
        case 'vote':
            return reputation >= state.voteThreshold;
        case 'propose':
            return reputation >= state.proposeThreshold;
    }
}
/**
 * Check if agent is a member
 */
export function isMember(state, agent) {
    return state.members.includes(agent);
}
/**
 * Check if threshold proposal has quorum
 */
export function thresholdHasQuorum(state) {
    if (!state.votes)
        return false;
    const totalVoted = state.votes.for.length + state.votes.against.length;
    return totalVoted >= state.quorum;
}
