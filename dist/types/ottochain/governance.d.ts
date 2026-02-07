/**
 * Governance and DAO type definitions
 *
 * TypeScript interfaces for governance state machines and DAO configurations.
 * These types represent the on-chain governance primitives: voting, proposals,
 * delegations, and multi-branch governance structures.
 *
 * @see governance/*.json for JSON state machine definitions
 * @packageDocumentation
 */
import type { Address, StateMachineDefinition, JsonLogicValue } from './types.js';
/**
 * Type of governance structure.
 * Maps to the separation of powers model.
 */
export type GovernanceType = 'Legislature' | 'Executive' | 'Judiciary' | 'Constitution' | 'Simple';
/**
 * Type of DAO voting mechanism.
 */
export type DAOType = 'Single' | 'Multisig' | 'Threshold' | 'Token';
/**
 * Current state of a proposal in the governance lifecycle.
 */
export type ProposalStatus = 'Draft' | 'Active' | 'Pending' | 'Queued' | 'Executing' | 'Executed' | 'Defeated' | 'Vetoed' | 'Cancelled' | 'Expired';
/**
 * Proposal action to be executed if passed.
 */
export interface ProposalAction {
    /** Target fiber ID to invoke */
    targetFiberId: string;
    /** Event name to trigger on target */
    eventName: string;
    /** Payload for the event */
    payload: JsonLogicValue;
}
/**
 * Full proposal state.
 */
export interface ProposalState {
    /** Unique proposal ID */
    id: string;
    /** Human-readable title */
    title: string;
    /** Detailed description */
    description: string;
    /** URL to discussion forum/thread */
    discussionUrl?: string;
    /** Actions to execute if passed */
    actions: ProposalAction[];
    /** Address that created the proposal */
    proposer: Address;
    /** Current status */
    status: ProposalStatus;
    /** When proposal was submitted for voting */
    submittedAt?: string;
    /** When voting period ends */
    votingEndsAt?: string;
    /** When veto period ends */
    vetoEndsAt?: string;
    /** When proposal becomes executable (after timelock) */
    executableAt?: string;
    /** Block/ordinal at which voting power snapshot was taken */
    snapshotBlock?: number;
}
/**
 * Vote choice.
 */
export type VoteChoice = 'For' | 'Against' | 'Abstain';
/**
 * Record of a single vote cast.
 */
export interface VoteRecord {
    /** Address of the voter */
    voter: Address;
    /** Vote choice */
    choice: VoteChoice;
    /** Voting weight (tokens, stake, or 1 for one-person-one-vote) */
    weight: number;
    /** Conviction multiplier for conviction voting */
    conviction?: number;
    /** If vote was cast on behalf of delegator */
    delegatedFrom?: Address;
    /** Timestamp when vote was cast */
    votedAt: string;
}
/**
 * Aggregated vote tally.
 */
export interface VoteTally {
    /** Total weight of For votes */
    for: number;
    /** Total weight of Against votes */
    against: number;
    /** Total weight of Abstain votes */
    abstain: number;
    /** Whether quorum was reached */
    quorumReached: boolean;
    /** Whether proposal passed */
    passed: boolean;
    /** Reason for defeat if not passed */
    reason?: string;
}
/**
 * Delegation of voting power.
 */
export interface Delegation {
    /** Address delegating their voting power */
    delegator: Address;
    /** Address receiving the delegation */
    delegateTo: Address;
    /** Weight being delegated */
    weight: number;
    /** When delegation was created */
    delegatedAt: string;
}
/**
 * Voting mechanism type.
 */
export type VotingMechanism = 'simple' | 'supermajority' | 'quadratic' | 'conviction' | 'ranked';
/**
 * Quorum calculation type.
 */
export type QuorumType = 'percentage' | 'absolute';
/**
 * DAO governance configuration.
 */
export interface DAOConfig {
    /** How votes are weighted and counted */
    votingMechanism: VotingMechanism;
    /** How quorum is calculated */
    quorumType: QuorumType;
    /** Quorum value (percentage 0-1 or absolute count) */
    quorumValue: number;
    /** Threshold to pass (percentage 0-1) */
    passingThreshold: number;
    /** Duration of voting period in milliseconds */
    votingPeriodMs: number;
    /** Duration of veto period in milliseconds (0 for no veto) */
    vetoPeriodMs: number;
    /** Grace period for finalization in milliseconds */
    gracePeriodMs: number;
    /** Duration of timelock before execution in milliseconds */
    timelockMs?: number;
    /** Whether delegation is allowed */
    allowDelegation: boolean;
    /** Whether anyone can vote (vs. whitelist) */
    openVoting: boolean;
    /** One person one vote regardless of holdings */
    onePersonOneVote: boolean;
    /** Half-life for conviction decay in milliseconds */
    convictionHalfLifeMs?: number;
    /** Minimum tokens required to create proposal */
    proposalThreshold?: number;
}
/**
 * DAO role configuration.
 */
export interface DAORoles {
    /** Addresses allowed to create proposals (empty = open) */
    proposers: Address[];
    /** Addresses allowed to vote (empty = open or token-weighted) */
    voters: Address[];
    /** Addresses allowed to execute passed proposals */
    executors: Address[];
    /** Addresses allowed to veto (guardians) */
    vetoers: Address[];
    /** Admin addresses for configuration changes */
    admins: Address[];
}
/**
 * Multisig-specific configuration.
 */
export interface MultisigConfig {
    /** Required number of signatures */
    threshold: number;
    /** Authorized signers */
    signers: Address[];
    /** Time-to-live for proposals in milliseconds */
    proposalTTLMs: number;
}
/**
 * Token DAO-specific configuration.
 */
export interface TokenDAOConfig extends DAOConfig {
    /** Token fiber ID for balance queries */
    tokenId: string;
    /** Current token balances (address -> amount) */
    balances: Record<string, number>;
    /** Current delegations (delegator -> delegate) */
    delegations: Record<string, string>;
}
/**
 * Complete governance definition with state machine and configuration.
 */
export interface GovernanceDefinition {
    /** Type of governance structure */
    governanceType: GovernanceType;
    /** Type of DAO (for DAO governance types) */
    daoType?: DAOType;
    /** State machine definition (from JSON) */
    stateMachine: StateMachineDefinition;
    /** Governance configuration */
    config: DAOConfig;
    /** Role assignments */
    roles: DAORoles;
    /** Constitution fiber ID (for separation of powers) */
    constitutionId?: string;
    /** Metadata */
    metadata?: {
        name: string;
        description?: string;
        version?: string;
    };
}
/**
 * Current state of a DAO governance fiber.
 */
export interface DAOState {
    /** Schema identifier for indexing */
    schema: 'Governance' | 'MultisigDAO' | 'TokenDAO' | string;
    /** DAO name */
    name: string;
    /** Current governance status */
    status: 'ACTIVE' | 'VOTING' | 'PENDING' | 'DISSOLVED' | string;
    /** Current proposal (if any) */
    proposal: ProposalState | null;
    /** Current votes */
    votes: Record<string, VoteRecord> | VoteTally | null;
    /** Current delegations */
    delegations?: Record<string, Delegation>;
    /** Configuration */
    config: DAOConfig | MultisigConfig;
    /** Roles */
    roles?: DAORoles;
    /** History of executed proposals */
    executedProposals?: ProposalState[];
    /** History of rejected proposals */
    rejectedProposals?: ProposalState[];
    /** History of cancelled proposals */
    cancelledProposals?: ProposalState[];
}
/**
 * Multisig DAO state.
 */
export interface MultisigDAOState extends DAOState {
    schema: 'MultisigDAO';
    /** Authorized signers */
    signers: Address[];
    /** Required signature threshold */
    threshold: number;
    /** Current signatures on pending proposal */
    signatures: Record<string, string>;
    /** Executed actions history */
    actions: Array<{
        id: string;
        type: string;
        payload: JsonLogicValue;
        signatures: Record<string, string>;
        executedAt: string;
    }>;
}
/**
 * Token DAO state.
 */
export interface TokenDAOState extends Omit<DAOState, 'delegations'> {
    schema: 'TokenDAO';
    /** Token fiber ID */
    tokenId: string;
    /** Current balances */
    balances: Record<string, number>;
    /** Token delegation mapping (simple address -> address) */
    delegations: Record<string, string>;
    /** Minimum tokens to propose */
    proposalThreshold: number;
    /** Minimum total participation */
    quorum: number;
}
/**
 * DAO state machine definitions by type.
 */
export declare const DAO_DEFINITIONS: Record<DAOType, unknown>;
/**
 * Governance state machine definitions by type.
 */
export declare const GOVERNANCE_DEFINITIONS: Record<GovernanceType, unknown>;
/**
 * Get the state machine definition for a DAO type.
 */
export declare function getDAODefinition(daoType: DAOType): unknown;
/**
 * Get the state machine definition for a governance type.
 */
export declare function getGovernanceDefinition(governanceType: GovernanceType): unknown;
/**
 * Extract state machine definition from JSON governance file.
 * Returns just the states, initialState, and transitions needed for CreateStateMachine.
 */
export declare function extractStateMachineDefinition(jsonDef: unknown): StateMachineDefinition;
