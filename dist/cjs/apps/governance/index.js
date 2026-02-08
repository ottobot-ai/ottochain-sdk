"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.thresholdHasQuorum = exports.isMember = exports.meetsThreshold = exports.canPropose = exports.isPassing = exports.hasQuorum = exports.getVotingPower = exports.hasSigned = exports.isSigner = exports.signaturesNeeded = exports.isThresholdMet = exports.getGovernanceDefinition = exports.getDAODefinition = exports.GOVERNANCE_DEFINITIONS = exports.DAO_DEFINITIONS = exports.voteChoiceToJSON = exports.voteChoiceFromJSON = exports.proposalStatusToJSON = exports.proposalStatusFromJSON = exports.dAOStatusToJSON = exports.dAOStatusFromJSON = exports.dAOTypeToJSON = exports.dAOTypeFromJSON = exports.ExecuteRequest = exports.VoteRequest = exports.ProposeRequest = exports.CreateDAORequest = exports.ThresholdHistoryEntry = exports.ThresholdVotes = exports.ThresholdDAO = exports.TokenProposalResult = exports.TokenDAO = exports.MultisigAction = exports.MultisigDAO = exports.OwnershipTransfer = exports.SingleOwnerAction = exports.SingleOwnerDAO = exports.VoteTally = exports.Vote = exports.Proposal = exports.DAOMetadata = exports.VoteChoice = exports.ProposalStatus = exports.DAOStatus = exports.DAOType = void 0;
// Re-export generated protobuf types (source of truth)
var governance_js_1 = require("../../generated/ottochain/apps/governance/v1/governance.js");
Object.defineProperty(exports, "DAOType", { enumerable: true, get: function () { return governance_js_1.DAOType; } });
Object.defineProperty(exports, "DAOStatus", { enumerable: true, get: function () { return governance_js_1.DAOStatus; } });
Object.defineProperty(exports, "ProposalStatus", { enumerable: true, get: function () { return governance_js_1.ProposalStatus; } });
Object.defineProperty(exports, "VoteChoice", { enumerable: true, get: function () { return governance_js_1.VoteChoice; } });
Object.defineProperty(exports, "DAOMetadata", { enumerable: true, get: function () { return governance_js_1.DAOMetadata; } });
Object.defineProperty(exports, "Proposal", { enumerable: true, get: function () { return governance_js_1.Proposal; } });
Object.defineProperty(exports, "Vote", { enumerable: true, get: function () { return governance_js_1.Vote; } });
Object.defineProperty(exports, "VoteTally", { enumerable: true, get: function () { return governance_js_1.VoteTally; } });
Object.defineProperty(exports, "SingleOwnerDAO", { enumerable: true, get: function () { return governance_js_1.SingleOwnerDAO; } });
Object.defineProperty(exports, "SingleOwnerAction", { enumerable: true, get: function () { return governance_js_1.SingleOwnerAction; } });
Object.defineProperty(exports, "OwnershipTransfer", { enumerable: true, get: function () { return governance_js_1.OwnershipTransfer; } });
Object.defineProperty(exports, "MultisigDAO", { enumerable: true, get: function () { return governance_js_1.MultisigDAO; } });
Object.defineProperty(exports, "MultisigAction", { enumerable: true, get: function () { return governance_js_1.MultisigAction; } });
Object.defineProperty(exports, "TokenDAO", { enumerable: true, get: function () { return governance_js_1.TokenDAO; } });
Object.defineProperty(exports, "TokenProposalResult", { enumerable: true, get: function () { return governance_js_1.TokenProposalResult; } });
Object.defineProperty(exports, "ThresholdDAO", { enumerable: true, get: function () { return governance_js_1.ThresholdDAO; } });
Object.defineProperty(exports, "ThresholdVotes", { enumerable: true, get: function () { return governance_js_1.ThresholdVotes; } });
Object.defineProperty(exports, "ThresholdHistoryEntry", { enumerable: true, get: function () { return governance_js_1.ThresholdHistoryEntry; } });
Object.defineProperty(exports, "CreateDAORequest", { enumerable: true, get: function () { return governance_js_1.CreateDAORequest; } });
Object.defineProperty(exports, "ProposeRequest", { enumerable: true, get: function () { return governance_js_1.ProposeRequest; } });
Object.defineProperty(exports, "VoteRequest", { enumerable: true, get: function () { return governance_js_1.VoteRequest; } });
Object.defineProperty(exports, "ExecuteRequest", { enumerable: true, get: function () { return governance_js_1.ExecuteRequest; } });
Object.defineProperty(exports, "dAOTypeFromJSON", { enumerable: true, get: function () { return governance_js_1.dAOTypeFromJSON; } });
Object.defineProperty(exports, "dAOTypeToJSON", { enumerable: true, get: function () { return governance_js_1.dAOTypeToJSON; } });
Object.defineProperty(exports, "dAOStatusFromJSON", { enumerable: true, get: function () { return governance_js_1.dAOStatusFromJSON; } });
Object.defineProperty(exports, "dAOStatusToJSON", { enumerable: true, get: function () { return governance_js_1.dAOStatusToJSON; } });
Object.defineProperty(exports, "proposalStatusFromJSON", { enumerable: true, get: function () { return governance_js_1.proposalStatusFromJSON; } });
Object.defineProperty(exports, "proposalStatusToJSON", { enumerable: true, get: function () { return governance_js_1.proposalStatusToJSON; } });
Object.defineProperty(exports, "voteChoiceFromJSON", { enumerable: true, get: function () { return governance_js_1.voteChoiceFromJSON; } });
Object.defineProperty(exports, "voteChoiceToJSON", { enumerable: true, get: function () { return governance_js_1.voteChoiceToJSON; } });
// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------
const dao_multisig_json_1 = __importDefault(require("./state-machines/dao-multisig.json"));
const dao_single_json_1 = __importDefault(require("./state-machines/dao-single.json"));
const dao_threshold_json_1 = __importDefault(require("./state-machines/dao-threshold.json"));
const dao_token_json_1 = __importDefault(require("./state-machines/dao-token.json"));
const governance_legislature_json_1 = __importDefault(require("./state-machines/governance-legislature.json"));
const governance_executive_json_1 = __importDefault(require("./state-machines/governance-executive.json"));
const governance_judiciary_json_1 = __importDefault(require("./state-machines/governance-judiciary.json"));
const governance_constitution_json_1 = __importDefault(require("./state-machines/governance-constitution.json"));
const governance_simple_json_1 = __importDefault(require("./state-machines/governance-simple.json"));
exports.DAO_DEFINITIONS = {
    Single: dao_single_json_1.default,
    Multisig: dao_multisig_json_1.default,
    Threshold: dao_threshold_json_1.default,
    Token: dao_token_json_1.default,
};
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
    return state.signers.some(s => s.value === agent);
}
exports.isSigner = isSigner;
/**
 * Check if agent has signed current proposal
 */
function hasSigned(state, agent) {
    return agent in state.signatures;
}
exports.hasSigned = hasSigned;
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
    const totalVoted = state.votes.votesFor + state.votes.votesAgainst + state.votes.votesAbstain;
    return totalVoted >= state.quorum;
}
exports.hasQuorum = hasQuorum;
/**
 * Check if proposal is passing
 */
function isPassing(state) {
    if (!state.votes)
        return false;
    return state.votes.votesFor > state.votes.votesAgainst && hasQuorum(state);
}
exports.isPassing = isPassing;
/**
 * Check if agent can propose
 */
function canPropose(state, agent) {
    return (state.balances[agent] ?? 0) >= state.proposalThreshold;
}
exports.canPropose = canPropose;
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
    return state.members.some(m => m.value === agent);
}
exports.isMember = isMember;
/**
 * Check if threshold proposal has quorum
 */
function thresholdHasQuorum(state) {
    if (!state.votes)
        return false;
    const totalVoted = state.votes.votesFor.length + state.votes.votesAgainst.length;
    return totalVoted >= state.quorum;
}
exports.thresholdHasQuorum = thresholdHasQuorum;
