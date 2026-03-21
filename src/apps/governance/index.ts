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
 *   getGovernanceDefinition,
 *   GOVERNANCE_DEFINITIONS
 * } from '@ottochain/sdk/apps/governance';
 *
 * const multisigDef = getGovernanceDefinition('daoMultisig');
 * const simpleDef = getGovernanceDefinition('simple');
 * ```
 *
 * @packageDocumentation
 */

// Re-export generated protobuf types (source of truth)
export {
  DAOType,
  DAOStatus,
  ProposalStatus,
  VoteChoice,
  DAOMetadata,
  Proposal,
  Vote,
  VoteTally,
  SingleOwnerDAO,
  SingleOwnerAction,
  OwnershipTransfer,
  MultisigDAO,
  MultisigAction,
  TokenDAO,
  TokenProposalResult,
  ThresholdDAO,
  ThresholdVotes,
  ThresholdHistoryEntry,
  CreateDAORequest,
  ProposeRequest,
  VoteRequest,
  ExecuteRequest,
  dAOTypeFromJSON,
  dAOTypeToJSON,
  dAOStatusFromJSON,
  dAOStatusToJSON,
  proposalStatusFromJSON,
  proposalStatusToJSON,
  voteChoiceFromJSON,
  voteChoiceToJSON,
} from "../../generated/ottochain/apps/governance/v1/governance.js";

// ---------------------------------------------------------------------------
// State Machine Definitions (generated from JSON at build time)
// ---------------------------------------------------------------------------

import {
  govUniversalDef,
  govSimpleDef,
  daoSingleDef,
  daoMultisigDef,
  daoTokenDef,
  daoReputationDef,
} from "./state-machines/index.js";

export {
  govUniversalDef,
  govSimpleDef,
  daoSingleDef,
  daoMultisigDef,
  daoTokenDef,
  daoReputationDef,
};

/** All governance state machine definitions */
export const GOVERNANCE_DEFINITIONS = {
  universal: govUniversalDef,
  simple: govSimpleDef,
  daoSingle: daoSingleDef,
  daoMultisig: daoMultisigDef,
  daoToken: daoTokenDef,
  daoReputation: daoReputationDef,
} as const;

export type GovernanceType = keyof typeof GOVERNANCE_DEFINITIONS;

/**
 * Get a governance state machine definition by type.
 * @param type - 'universal' | 'simple' | 'daoSingle' | 'daoMultisig' | 'daoToken' | 'daoReputation'
 */
export function getGovernanceDefinition(type: GovernanceType): unknown {
  return GOVERNANCE_DEFINITIONS[type];
}

/** @deprecated Use getGovernanceDefinition('daoSingle' | 'daoMultisig' | 'daoToken' | 'daoReputation') */
export function getDAODefinition(
  daoType: "Single" | "Multisig" | "Threshold" | "Token",
): unknown {
  const map: Record<string, GovernanceType> = {
    Single: "daoSingle",
    Multisig: "daoMultisig",
    Threshold: "daoReputation",
    Token: "daoToken",
  };
  return GOVERNANCE_DEFINITIONS[map[daoType]];
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

import type {
  MultisigDAO,
  TokenDAO,
  ThresholdDAO,
} from "../../generated/ottochain/apps/governance/v1/governance.js";

/**
 * Check if multisig has enough signatures to execute
 */
export function isThresholdMet(state: MultisigDAO): boolean {
  return Object.keys(state.signatures).length >= state.threshold;
}

/**
 * Get remaining signatures needed
 */
export function signaturesNeeded(state: MultisigDAO): number {
  return Math.max(0, state.threshold - Object.keys(state.signatures).length);
}

/**
 * Check if agent is a signer
 */
export function isSigner(state: MultisigDAO, agent: string): boolean {
  return state.signers.includes(agent);
}

/**
 * Check if agent has signed current proposal
 */
export function hasSigned(state: MultisigDAO, agent: string): boolean {
  return agent in state.signatures;
}

/**
 * Get effective voting power (includes delegation)
 */
export function getVotingPower(state: TokenDAO, agent: string): number {
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
export function hasQuorum(state: TokenDAO): boolean {
  if (!state.votes) return false;
  const totalVoted =
    state.votes.votesFor + state.votes.votesAgainst + state.votes.votesAbstain;
  return totalVoted >= state.quorum;
}

/**
 * Check if proposal is passing
 */
export function isPassing(state: TokenDAO): boolean {
  if (!state.votes) return false;
  return state.votes.votesFor > state.votes.votesAgainst && hasQuorum(state);
}

/**
 * Check if agent can propose
 */
export function canPropose(state: TokenDAO, agent: string): boolean {
  return (state.balances[agent] ?? 0) >= state.proposalThreshold;
}

/**
 * Check if agent meets threshold for action
 */
export function meetsThreshold(
  state: ThresholdDAO,
  reputation: number,
  action: "member" | "vote" | "propose",
): boolean {
  switch (action) {
    case "member":
      return reputation >= state.memberThreshold;
    case "vote":
      return reputation >= state.voteThreshold;
    case "propose":
      return reputation >= state.proposeThreshold;
  }
}

/**
 * Check if agent is a member
 */
export function isMember(state: ThresholdDAO, agent: string): boolean {
  return state.members.includes(agent);
}

/**
 * Check if threshold proposal has quorum
 */
export function thresholdHasQuorum(state: ThresholdDAO): boolean {
  if (!state.votes) return false;
  const totalVoted =
    state.votes.votesFor.length + state.votes.votesAgainst.length;
  return totalVoted >= state.quorum;
}
