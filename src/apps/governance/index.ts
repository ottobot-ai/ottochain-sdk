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

// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------

import daoMultisigDef from './state-machines/dao-multisig.json';
import daoSingleDef from './state-machines/dao-single.json';
import daoThresholdDef from './state-machines/dao-threshold.json';
import daoTokenDef from './state-machines/dao-token.json';
import govConstitutionDef from './state-machines/governance-constitution.json';
import govExecutiveDef from './state-machines/governance-executive.json';
import govJudiciaryDef from './state-machines/governance-judiciary.json';
import govLegislatureDef from './state-machines/governance-legislature.json';
import govSimpleDef from './state-machines/governance-simple.json';

/**
 * DAO type for selecting state machine definition.
 */
export type DAOType = 'Single' | 'Multisig' | 'Threshold' | 'Token';

/**
 * Governance type for selecting state machine definition.
 */
export type GovernanceType = 'Legislature' | 'Executive' | 'Judiciary' | 'Constitution' | 'Simple';

/**
 * DAO state machine definitions mapped by type.
 */
export const DAO_DEFINITIONS: Record<DAOType, unknown> = {
  Single: daoSingleDef,
  Multisig: daoMultisigDef,
  Threshold: daoThresholdDef,
  Token: daoTokenDef,
};

/**
 * Governance state machine definitions mapped by type.
 */
export const GOVERNANCE_DEFINITIONS: Record<GovernanceType, unknown> = {
  Legislature: govLegislatureDef,
  Executive: govExecutiveDef,
  Judiciary: govJudiciaryDef,
  Constitution: govConstitutionDef,
  Simple: govSimpleDef,
};

/**
 * Get the state machine definition for a DAO type.
 */
export function getDAODefinition(daoType: DAOType): unknown {
  const def = DAO_DEFINITIONS[daoType];
  if (!def) {
    throw new Error(`Unknown DAO type: ${daoType}`);
  }
  return def;
}

/**
 * Get the state machine definition for a governance type.
 */
export function getGovernanceDefinition(governanceType: GovernanceType): unknown {
  const def = GOVERNANCE_DEFINITIONS[governanceType];
  if (!def) {
    throw new Error(`Unknown governance type: ${governanceType}`);
  }
  return def;
}

import type {
  SingleOwnerDAOState,
  MultisigDAOState,
  TokenDAOState,
  ThresholdDAOState,
  DAOMetadata,
} from './types.js';

// =============================================================================
// State Factories
// =============================================================================

/**
 * Create initial state for a SingleOwnerDAO
 */
export function createSingleOwnerState(params: {
  name: string;
  owner: string;
  metadata?: DAOMetadata;
}): SingleOwnerDAOState {
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
export function createMultisigState(params: {
  name: string;
  signers: string[];
  threshold: number;
  proposalTTLMs?: number;
  metadata?: DAOMetadata;
}): MultisigDAOState {
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
export function createTokenState(params: {
  name: string;
  tokenId: string;
  initialBalances?: Record<string, number>;
  proposalThreshold?: number;
  votingPeriodMs?: number;
  timelockMs?: number;
  quorum?: number;
  metadata?: DAOMetadata;
}): TokenDAOState {
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
export function createThresholdState(params: {
  name: string;
  memberThreshold?: number;
  voteThreshold?: number;
  proposeThreshold?: number;
  quorum?: number;
  votingPeriodMs?: number;
  metadata?: DAOMetadata;
}): ThresholdDAOState {
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
export function isThresholdMet(state: MultisigDAOState): boolean {
  return Object.keys(state.signatures).length >= state.threshold;
}

/**
 * Get remaining signatures needed
 */
export function signaturesNeeded(state: MultisigDAOState): number {
  return Math.max(0, state.threshold - Object.keys(state.signatures).length);
}

/**
 * Check if agent is a signer
 */
export function isSigner(state: MultisigDAOState, agent: string): boolean {
  return state.signers.includes(agent);
}

/**
 * Check if agent has signed current proposal
 */
export function hasSigned(state: MultisigDAOState, agent: string): boolean {
  return agent in state.signatures;
}

// =============================================================================
// Token DAO Helpers
// =============================================================================

/**
 * Get effective voting power (includes delegation)
 */
export function getVotingPower(state: TokenDAOState, agent: string): number {
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
export function hasQuorum(state: TokenDAOState): boolean {
  if (!state.votes) return false;
  const totalVoted = state.votes.for + state.votes.against + state.votes.abstain;
  return totalVoted >= state.quorum;
}

/**
 * Check if proposal is passing
 */
export function isPassing(state: TokenDAOState): boolean {
  if (!state.votes) return false;
  return state.votes.for > state.votes.against && hasQuorum(state);
}

/**
 * Check if agent can propose
 */
export function canPropose(state: TokenDAOState, agent: string): boolean {
  return (state.balances[agent] ?? 0) >= state.proposalThreshold;
}

// =============================================================================
// Threshold DAO Helpers
// =============================================================================

/**
 * Check if agent meets threshold for action
 */
export function meetsThreshold(
  state: ThresholdDAOState,
  reputation: number,
  action: 'member' | 'vote' | 'propose'
): boolean {
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
export function isMember(state: ThresholdDAOState, agent: string): boolean {
  return state.members.includes(agent);
}

/**
 * Check if threshold proposal has quorum
 */
export function thresholdHasQuorum(state: ThresholdDAOState): boolean {
  if (!state.votes) return false;
  const totalVoted = state.votes.for.length + state.votes.against.length;
  return totalVoted >= state.quorum;
}
