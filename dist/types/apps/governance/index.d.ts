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
export { DAOType, DAOStatus, ProposalStatus, VoteChoice, DAOMetadata, Proposal, Vote, VoteTally, SingleOwnerDAO, SingleOwnerAction, OwnershipTransfer, MultisigDAO, MultisigAction, TokenDAO, TokenProposalResult, ThresholdDAO, ThresholdVotes, ThresholdHistoryEntry, CreateDAORequest, ProposeRequest, VoteRequest, ExecuteRequest, dAOTypeFromJSON, dAOTypeToJSON, dAOStatusFromJSON, dAOStatusToJSON, proposalStatusFromJSON, proposalStatusToJSON, voteChoiceFromJSON, voteChoiceToJSON, } from '../../generated/ottochain/apps/governance/v1/governance.js';
export type DAODefinitionType = 'Single' | 'Multisig' | 'Threshold' | 'Token';
export type GovernanceDefinitionType = 'Legislature' | 'Executive' | 'Judiciary' | 'Constitution' | 'Simple';
export declare const DAO_DEFINITIONS: Record<DAODefinitionType, unknown>;
export declare const GOVERNANCE_DEFINITIONS: Record<GovernanceDefinitionType, unknown>;
/**
 * Get the state machine definition for a DAO type.
 */
export declare function getDAODefinition(daoType: DAODefinitionType): unknown;
/**
 * Get the state machine definition for a governance type.
 */
export declare function getGovernanceDefinition(governanceType: GovernanceDefinitionType): unknown;
import type { MultisigDAO, TokenDAO, ThresholdDAO } from '../../generated/ottochain/apps/governance/v1/governance.js';
/**
 * Check if multisig has enough signatures to execute
 */
export declare function isThresholdMet(state: MultisigDAO): boolean;
/**
 * Get remaining signatures needed
 */
export declare function signaturesNeeded(state: MultisigDAO): number;
/**
 * Check if agent is a signer
 */
export declare function isSigner(state: MultisigDAO, agent: string): boolean;
/**
 * Check if agent has signed current proposal
 */
export declare function hasSigned(state: MultisigDAO, agent: string): boolean;
/**
 * Get effective voting power (includes delegation)
 */
export declare function getVotingPower(state: TokenDAO, agent: string): number;
/**
 * Check if proposal has quorum
 */
export declare function hasQuorum(state: TokenDAO): boolean;
/**
 * Check if proposal is passing
 */
export declare function isPassing(state: TokenDAO): boolean;
/**
 * Check if agent can propose
 */
export declare function canPropose(state: TokenDAO, agent: string): boolean;
/**
 * Check if agent meets threshold for action
 */
export declare function meetsThreshold(state: ThresholdDAO, reputation: number, action: 'member' | 'vote' | 'propose'): boolean;
/**
 * Check if agent is a member
 */
export declare function isMember(state: ThresholdDAO, agent: string): boolean;
/**
 * Check if threshold proposal has quorum
 */
export declare function thresholdHasQuorum(state: ThresholdDAO): boolean;
