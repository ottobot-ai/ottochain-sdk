"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.thresholdHasQuorum = exports.isMember = exports.meetsThreshold = exports.canPropose = exports.isPassing = exports.hasQuorum = exports.getVotingPower = exports.hasSigned = exports.isSigner = exports.signaturesNeeded = exports.isThresholdMet = exports.createThresholdState = exports.createTokenState = exports.createMultisigState = exports.createSingleOwnerState = exports.getGovernanceDefinition = exports.getDAODefinition = exports.GOVERNANCE_DEFINITIONS = exports.DAO_DEFINITIONS = void 0;
__exportStar(require("./types.js"), exports);
// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------
const dao_multisig_json_1 = __importDefault(require("./state-machines/dao-multisig.json"));
const dao_single_json_1 = __importDefault(require("./state-machines/dao-single.json"));
const dao_threshold_json_1 = __importDefault(require("./state-machines/dao-threshold.json"));
const dao_token_json_1 = __importDefault(require("./state-machines/dao-token.json"));
const governance_constitution_json_1 = __importDefault(require("./state-machines/governance-constitution.json"));
const governance_executive_json_1 = __importDefault(require("./state-machines/governance-executive.json"));
const governance_judiciary_json_1 = __importDefault(require("./state-machines/governance-judiciary.json"));
const governance_legislature_json_1 = __importDefault(require("./state-machines/governance-legislature.json"));
const governance_simple_json_1 = __importDefault(require("./state-machines/governance-simple.json"));
/**
 * DAO state machine definitions mapped by type.
 */
exports.DAO_DEFINITIONS = {
    Single: dao_single_json_1.default,
    Multisig: dao_multisig_json_1.default,
    Threshold: dao_threshold_json_1.default,
    Token: dao_token_json_1.default,
};
/**
 * Governance state machine definitions mapped by type.
 */
exports.GOVERNANCE_DEFINITIONS = {
    Legislature: governance_legislature_json_1.default,
    Executive: governance_executive_json_1.default,
    Judiciary: governance_judiciary_json_1.default,
    Constitution: governance_constitution_json_1.default,
    Simple: governance_simple_json_1.default,
};
/**
 * Get the state machine definition for a DAO type.
 */
function getDAODefinition(daoType) {
    const def = exports.DAO_DEFINITIONS[daoType];
    if (!def) {
        throw new Error(`Unknown DAO type: ${daoType}`);
    }
    return def;
}
exports.getDAODefinition = getDAODefinition;
/**
 * Get the state machine definition for a governance type.
 */
function getGovernanceDefinition(governanceType) {
    const def = exports.GOVERNANCE_DEFINITIONS[governanceType];
    if (!def) {
        throw new Error(`Unknown governance type: ${governanceType}`);
    }
    return def;
}
exports.getGovernanceDefinition = getGovernanceDefinition;
// =============================================================================
// State Factories
// =============================================================================
/**
 * Create initial state for a SingleOwnerDAO
 */
function createSingleOwnerState(params) {
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
exports.createSingleOwnerState = createSingleOwnerState;
/**
 * Create initial state for a MultisigDAO
 */
function createMultisigState(params) {
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
exports.createMultisigState = createMultisigState;
/**
 * Create initial state for a TokenDAO
 */
function createTokenState(params) {
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
exports.createTokenState = createTokenState;
/**
 * Create initial state for a ThresholdDAO
 */
function createThresholdState(params) {
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
exports.createThresholdState = createThresholdState;
// =============================================================================
// Multisig Helpers
// =============================================================================
/**
 * Check if multisig has enough signatures to execute
 */
function isThresholdMet(state) {
    return Object.keys(state.signatures).length >= state.threshold;
}
exports.isThresholdMet = isThresholdMet;
/**
 * Get remaining signatures needed
 */
function signaturesNeeded(state) {
    return Math.max(0, state.threshold - Object.keys(state.signatures).length);
}
exports.signaturesNeeded = signaturesNeeded;
/**
 * Check if agent is a signer
 */
function isSigner(state, agent) {
    return state.signers.includes(agent);
}
exports.isSigner = isSigner;
/**
 * Check if agent has signed current proposal
 */
function hasSigned(state, agent) {
    return agent in state.signatures;
}
exports.hasSigned = hasSigned;
// =============================================================================
// Token DAO Helpers
// =============================================================================
/**
 * Get effective voting power (includes delegation)
 */
function getVotingPower(state, agent) {
    let power = state.balances[agent] ?? 0;
    // Add delegated power
    for (const [delegator, delegatee] of Object.entries(state.delegations)) {
        if (delegatee === agent) {
            power += state.balances[delegator] ?? 0;
        }
    }
    return power;
}
exports.getVotingPower = getVotingPower;
/**
 * Check if proposal has quorum
 */
function hasQuorum(state) {
    if (!state.votes)
        return false;
    const totalVoted = state.votes.for + state.votes.against + state.votes.abstain;
    return totalVoted >= state.quorum;
}
exports.hasQuorum = hasQuorum;
/**
 * Check if proposal is passing
 */
function isPassing(state) {
    if (!state.votes)
        return false;
    return state.votes.for > state.votes.against && hasQuorum(state);
}
exports.isPassing = isPassing;
/**
 * Check if agent can propose
 */
function canPropose(state, agent) {
    return (state.balances[agent] ?? 0) >= state.proposalThreshold;
}
exports.canPropose = canPropose;
// =============================================================================
// Threshold DAO Helpers
// =============================================================================
/**
 * Check if agent meets threshold for action
 */
function meetsThreshold(state, reputation, action) {
    switch (action) {
        case 'member':
            return reputation >= state.memberThreshold;
        case 'vote':
            return reputation >= state.voteThreshold;
        case 'propose':
            return reputation >= state.proposeThreshold;
    }
}
exports.meetsThreshold = meetsThreshold;
/**
 * Check if agent is a member
 */
function isMember(state, agent) {
    return state.members.includes(agent);
}
exports.isMember = isMember;
/**
 * Check if threshold proposal has quorum
 */
function thresholdHasQuorum(state) {
    if (!state.votes)
        return false;
    const totalVoted = state.votes.for.length + state.votes.against.length;
    return totalVoted >= state.quorum;
}
exports.thresholdHasQuorum = thresholdHasQuorum;
