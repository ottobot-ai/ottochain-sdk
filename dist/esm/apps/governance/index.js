/**
 * Governance & DAO Application
 *
 * Types and utilities for DAO governance on OttoChain.
 *
 * @example
 * ```typescript
 * import {
 *   DAOType,
 *   DAOStatus,
 *   MultisigDAO,
 *   getDAODefinition
 * } from '@ottochain/sdk/apps/governance';
 *
 * const multisigDef = getDAODefinition('Multisig');
 * ```
 *
 * @packageDocumentation
 */
// Re-export generated protobuf types (source of truth)
export { DAOType, DAOStatus, ProposalStatus, VoteChoice, DAOMetadata, Proposal, Vote, VoteTally, SingleOwnerDAO, SingleOwnerAction, OwnershipTransfer, MultisigDAO, MultisigAction, TokenDAO, TokenProposalResult, ThresholdDAO, ThresholdVotes, ThresholdHistoryEntry, CreateDAORequest, ProposeRequest, VoteRequest, ExecuteRequest, dAOTypeFromJSON, dAOTypeToJSON, dAOStatusFromJSON, dAOStatusToJSON, proposalStatusFromJSON, proposalStatusToJSON, voteChoiceFromJSON, voteChoiceToJSON, } from '../../generated/ottochain/apps/governance/v1/governance.js';
// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------
import daoMultisigDef from './state-machines/dao-multisig.json';
import daoSingleDef from './state-machines/dao-single.json';
import daoThresholdDef from './state-machines/dao-threshold.json';
import daoTokenDef from './state-machines/dao-token.json';
import govLegislatureDef from './state-machines/governance-legislature.json';
import govExecutiveDef from './state-machines/governance-executive.json';
import govJudiciaryDef from './state-machines/governance-judiciary.json';
import govConstitutionDef from './state-machines/governance-constitution.json';
import govSimpleDef from './state-machines/governance-simple.json';
export const DAO_DEFINITIONS = {
    Single: daoSingleDef,
    Multisig: daoMultisigDef,
    Threshold: daoThresholdDef,
    Token: daoTokenDef,
};
export const GOVERNANCE_DEFINITIONS = {
    Legislature: govLegislatureDef,
    Executive: govExecutiveDef,
    Judiciary: govJudiciaryDef,
    Constitution: govConstitutionDef,
    Simple: govSimpleDef,
};
/**
 * Get the state machine definition for a DAO type.
 */
export function getDAODefinition(daoType) {
    const def = DAO_DEFINITIONS[daoType];
    if (!def) {
        throw new Error(`Unknown DAO type: ${daoType}`);
    }
    return def;
}
/**
 * Get the state machine definition for a governance type.
 */
export function getGovernanceDefinition(governanceType) {
    const def = GOVERNANCE_DEFINITIONS[governanceType];
    if (!def) {
        throw new Error(`Unknown governance type: ${governanceType}`);
    }
    return def;
}
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
    const totalVoted = state.votes.votesFor + state.votes.votesAgainst + state.votes.votesAbstain;
    return totalVoted >= state.quorum;
}
/**
 * Check if proposal is passing
 */
export function isPassing(state) {
    if (!state.votes)
        return false;
    return state.votes.votesFor > state.votes.votesAgainst && hasQuorum(state);
}
/**
 * Check if agent can propose
 */
export function canPropose(state, agent) {
    return (state.balances[agent] ?? 0) >= state.proposalThreshold;
}
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
    const totalVoted = state.votes.votesFor.length + state.votes.votesAgainst.length;
    return totalVoted >= state.quorum;
}
