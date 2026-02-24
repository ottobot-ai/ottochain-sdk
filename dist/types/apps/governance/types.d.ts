/**
 * Governance & DAO Types
 *
 * TypeScript types matching the JSON Logic state machine definitions
 * in ottochain/docs/trust-graph/state-machines/dao/
 *
 * @packageDocumentation
 */
/**
 * DAO status values (matches JSON schema status field)
 */
export type DAOStatus = 'ACTIVE' | 'DISSOLVED';
/**
 * Proposal status for voting DAOs
 */
export type ProposalStatus = 'ACTIVE' | 'PENDING' | 'VOTING' | 'QUEUED' | 'EXECUTED' | 'REJECTED' | 'CANCELLED';
/**
 * Vote choice
 */
export type VoteChoice = 'for' | 'against' | 'abstain';
/**
 * Base metadata for all DAOs
 */
export interface DAOMetadata {
    description?: string;
    website?: string;
    logo?: string;
    [key: string]: unknown;
}
/**
 * Single owner DAO state.
 * One address controls all actions. Simplest governance model.
 */
export interface SingleOwnerDAOState {
    schema: 'SingleOwnerDAO';
    name: string;
    owner: string;
    pendingOwner: string | null;
    transferInitiatedAt: number | null;
    actions: SingleOwnerAction[];
    ownershipHistory: OwnershipTransfer[];
    metadata: DAOMetadata;
    status: DAOStatus;
}
export interface SingleOwnerAction {
    id: string;
    type: string;
    payload: unknown;
    executedAt: number;
}
export interface OwnershipTransfer {
    from: string;
    to: string;
    at: number;
}
/**
 * Events for SingleOwnerDAO
 */
export type SingleOwnerEvent = {
    eventName: 'execute';
    agent: string;
    actionId: string;
    actionType: string;
    payload: unknown;
} | {
    eventName: 'transfer_ownership';
    agent: string;
    newOwner: string;
} | {
    eventName: 'accept_ownership';
    agent: string;
} | {
    eventName: 'cancel_transfer';
    agent: string;
} | {
    eventName: 'dissolve';
    agent: string;
};
/**
 * Multisig DAO state.
 * N-of-M signatures required for actions.
 */
export interface MultisigDAOState {
    schema: 'MultisigDAO';
    name: string;
    signers: string[];
    threshold: number;
    proposalTTLMs: number;
    proposal: MultisigProposal | null;
    signatures: Record<string, number>;
    actions: MultisigAction[];
    cancelledProposals: MultisigProposal[];
    metadata: DAOMetadata;
    status: DAOStatus;
}
export interface MultisigProposal {
    id: string;
    actionType: string;
    payload: unknown;
    proposer: string;
    proposedAt: number;
    expiresAt: number;
}
export interface MultisigAction extends MultisigProposal {
    signatures: Record<string, number>;
    executedAt: number;
}
/**
 * Events for MultisigDAO
 */
export type MultisigEvent = {
    eventName: 'propose';
    agent: string;
    proposalId: string;
    actionType: string;
    payload: unknown;
} | {
    eventName: 'sign';
    agent: string;
} | {
    eventName: 'execute';
    agent: string;
} | {
    eventName: 'cancel';
    agent: string;
} | {
    eventName: 'propose_add_signer';
    agent: string;
    proposalId: string;
    newSigner: string;
} | {
    eventName: 'propose_remove_signer';
    agent: string;
    proposalId: string;
    removeSigner: string;
} | {
    eventName: 'propose_change_threshold';
    agent: string;
    proposalId: string;
    newThreshold: number;
} | {
    eventName: 'apply_signer_change';
    agent: string;
} | {
    eventName: 'dissolve';
    agent: string;
    signatureCount: number;
};
/**
 * Token DAO state.
 * Token-weighted voting. Voting power proportional to holdings.
 */
export interface TokenDAOState {
    schema: 'TokenDAO';
    name: string;
    tokenId: string;
    balances: Record<string, number>;
    delegations: Record<string, string>;
    proposalThreshold: number;
    votingPeriodMs: number;
    timelockMs: number;
    quorum: number;
    proposal: TokenProposal | null;
    votes: TokenVotes | null;
    executedProposals: TokenProposalResult[];
    rejectedProposals: TokenProposalResult[];
    cancelledProposals: TokenProposal[];
    metadata: DAOMetadata;
    status: DAOStatus;
}
export interface TokenProposal {
    id: string;
    title: string;
    description: string;
    actionType: string;
    payload: unknown;
    proposer: string;
    proposedAt: number;
    votingEndsAt: number;
    snapshotBlock?: number;
    queuedAt?: number;
    executableAt?: number;
}
export interface TokenVotes {
    for: number;
    against: number;
    abstain: number;
    voters: Record<string, TokenVote>;
}
export interface TokenVote {
    vote: VoteChoice;
    weight: number;
    votedAt: number;
}
export interface TokenProposalResult extends TokenProposal {
    votes: TokenVotes;
    executedAt?: number;
    rejectedAt?: number;
}
/**
 * Events for TokenDAO
 */
export type TokenEvent = {
    eventName: 'propose';
    agent: string;
    proposalId: string;
    title: string;
    description: string;
    actionType: string;
    payload: unknown;
    snapshotBlock?: number;
} | {
    eventName: 'vote';
    agent: string;
    vote: VoteChoice;
} | {
    eventName: 'queue';
    agent: string;
} | {
    eventName: 'execute';
    agent: string;
} | {
    eventName: 'reject';
    agent: string;
} | {
    eventName: 'cancel';
    agent: string;
} | {
    eventName: 'delegate';
    agent: string;
    delegateTo: string;
} | {
    eventName: 'undelegate';
    agent: string;
};
/**
 * Threshold DAO state.
 * Reputation-based governance. Minimum reputation required for participation.
 */
export interface ThresholdDAOState {
    schema: 'ThresholdDAO';
    name: string;
    members: string[];
    memberJoinedAt: Record<string, number>;
    memberThreshold: number;
    voteThreshold: number;
    proposeThreshold: number;
    quorum: number;
    votingPeriodMs: number;
    proposal: ThresholdProposal | null;
    votes: ThresholdVotes | null;
    history: ThresholdHistoryEntry[];
    metadata: DAOMetadata;
    status: DAOStatus;
}
export interface ThresholdProposal {
    id: string;
    title: string;
    description?: string;
    actionType: string;
    payload: unknown;
    proposer: string;
    proposedAt: number;
    deadline: number;
}
export interface ThresholdVotes {
    for: string[];
    against: string[];
    abstain: string[];
}
export interface ThresholdHistoryEntry {
    type: 'executed' | 'rejected';
    proposal: ThresholdProposal;
    votes: ThresholdVotes;
    at: number;
}
/**
 * Events for ThresholdDAO
 * Note: agentReputation is passed in from the reputation oracle
 */
export type ThresholdEvent = {
    eventName: 'propose';
    agent: string;
    agentReputation: number;
    proposalId: string;
    title: string;
    description?: string;
    actionType: string;
    payload: unknown;
} | {
    eventName: 'vote';
    agent: string;
    agentReputation: number;
    vote: VoteChoice;
} | {
    eventName: 'execute';
    agent: string;
} | {
    eventName: 'reject';
    agent: string;
} | {
    eventName: 'join';
    agent: string;
    agentReputation: number;
} | {
    eventName: 'leave';
    agent: string;
} | {
    eventName: 'propose_threshold_change';
    agent: string;
    agentReputation: number;
    proposalId: string;
    memberThreshold?: number;
    voteThreshold?: number;
    proposeThreshold?: number;
};
/**
 * Any DAO state
 */
export type DAOState = SingleOwnerDAOState | MultisigDAOState | TokenDAOState | ThresholdDAOState;
/**
 * Any DAO event
 */
export type DAOEvent = SingleOwnerEvent | MultisigEvent | TokenEvent | ThresholdEvent;
/**
 * DAO schema names for type discrimination
 */
export type DAOSchema = 'SingleOwnerDAO' | 'MultisigDAO' | 'TokenDAO' | 'ThresholdDAO';
/**
 * Type guard for SingleOwnerDAO
 */
export declare function isSingleOwnerDAO(state: DAOState): state is SingleOwnerDAOState;
/**
 * Type guard for MultisigDAO
 */
export declare function isMultisigDAO(state: DAOState): state is MultisigDAOState;
/**
 * Type guard for TokenDAO
 */
export declare function isTokenDAO(state: DAOState): state is TokenDAOState;
/**
 * Type guard for ThresholdDAO
 */
export declare function isThresholdDAO(state: DAOState): state is ThresholdDAOState;
