import type { GenEnum, GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Address } from "../../../v1/common_pb.js";
import type { Timestamp } from "@bufbuild/protobuf/wkt";
import type { JsonObject, Message } from "@bufbuild/protobuf";
/**
 * Describes the file ottochain/apps/governance/v1/governance.proto.
 */
export declare const file_ottochain_apps_governance_v1_governance: GenFile;
/**
 * DAO metadata
 *
 * @generated from message ottochain.apps.governance.v1.DAOMetadata
 */
export type DAOMetadata = Message<"ottochain.apps.governance.v1.DAOMetadata"> & {
    /**
     * @generated from field: string description = 1;
     */
    description: string;
    /**
     * @generated from field: string website = 2;
     */
    website: string;
    /**
     * @generated from field: string logo = 3;
     */
    logo: string;
    /**
     * @generated from field: google.protobuf.Struct extra = 4;
     */
    extra?: JsonObject;
};
/**
 * Describes the message ottochain.apps.governance.v1.DAOMetadata.
 * Use `create(DAOMetadataSchema)` to create a new message.
 */
export declare const DAOMetadataSchema: GenMessage<DAOMetadata>;
/**
 * Proposal for any DAO type
 *
 * @generated from message ottochain.apps.governance.v1.Proposal
 */
export type Proposal = Message<"ottochain.apps.governance.v1.Proposal"> & {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: string title = 2;
     */
    title: string;
    /**
     * @generated from field: string description = 3;
     */
    description: string;
    /**
     * @generated from field: string action_type = 4;
     */
    actionType: string;
    /**
     * @generated from field: google.protobuf.Struct payload = 5;
     */
    payload?: JsonObject;
    /**
     * @generated from field: ottochain.v1.Address proposer = 6;
     */
    proposer?: Address;
    /**
     * @generated from field: google.protobuf.Timestamp proposed_at = 7;
     */
    proposedAt?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp deadline = 8;
     */
    deadline?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp queued_at = 9;
     */
    queuedAt?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp executable_at = 10;
     */
    executableAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.governance.v1.Proposal.
 * Use `create(ProposalSchema)` to create a new message.
 */
export declare const ProposalSchema: GenMessage<Proposal>;
/**
 * Vote record
 *
 * @generated from message ottochain.apps.governance.v1.Vote
 */
export type Vote = Message<"ottochain.apps.governance.v1.Vote"> & {
    /**
     * @generated from field: ottochain.v1.Address voter = 1;
     */
    voter?: Address;
    /**
     * @generated from field: ottochain.apps.governance.v1.VoteChoice choice = 2;
     */
    choice: VoteChoice;
    /**
     * @generated from field: int64 weight = 3;
     */
    weight: bigint;
    /**
     * @generated from field: google.protobuf.Timestamp voted_at = 4;
     */
    votedAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.governance.v1.Vote.
 * Use `create(VoteSchema)` to create a new message.
 */
export declare const VoteSchema: GenMessage<Vote>;
/**
 * Vote tally
 *
 * @generated from message ottochain.apps.governance.v1.VoteTally
 */
export type VoteTally = Message<"ottochain.apps.governance.v1.VoteTally"> & {
    /**
     * @generated from field: int64 votes_for = 1;
     */
    votesFor: bigint;
    /**
     * @generated from field: int64 votes_against = 2;
     */
    votesAgainst: bigint;
    /**
     * @generated from field: int64 votes_abstain = 3;
     */
    votesAbstain: bigint;
    /**
     * @generated from field: repeated ottochain.apps.governance.v1.Vote votes = 4;
     */
    votes: Vote[];
};
/**
 * Describes the message ottochain.apps.governance.v1.VoteTally.
 * Use `create(VoteTallySchema)` to create a new message.
 */
export declare const VoteTallySchema: GenMessage<VoteTally>;
/**
 * @generated from message ottochain.apps.governance.v1.SingleOwnerDAO
 */
export type SingleOwnerDAO = Message<"ottochain.apps.governance.v1.SingleOwnerDAO"> & {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: ottochain.v1.Address owner = 2;
     */
    owner?: Address;
    /**
     * @generated from field: ottochain.v1.Address pending_owner = 3;
     */
    pendingOwner?: Address;
    /**
     * @generated from field: google.protobuf.Timestamp transfer_initiated_at = 4;
     */
    transferInitiatedAt?: Timestamp;
    /**
     * @generated from field: repeated ottochain.apps.governance.v1.SingleOwnerAction actions = 5;
     */
    actions: SingleOwnerAction[];
    /**
     * @generated from field: repeated ottochain.apps.governance.v1.OwnershipTransfer ownership_history = 6;
     */
    ownershipHistory: OwnershipTransfer[];
    /**
     * @generated from field: ottochain.apps.governance.v1.DAOMetadata metadata = 7;
     */
    metadata?: DAOMetadata;
    /**
     * @generated from field: ottochain.apps.governance.v1.DAOStatus status = 8;
     */
    status: DAOStatus;
};
/**
 * Describes the message ottochain.apps.governance.v1.SingleOwnerDAO.
 * Use `create(SingleOwnerDAOSchema)` to create a new message.
 */
export declare const SingleOwnerDAOSchema: GenMessage<SingleOwnerDAO>;
/**
 * @generated from message ottochain.apps.governance.v1.SingleOwnerAction
 */
export type SingleOwnerAction = Message<"ottochain.apps.governance.v1.SingleOwnerAction"> & {
    /**
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * @generated from field: string action_type = 2;
     */
    actionType: string;
    /**
     * @generated from field: google.protobuf.Struct payload = 3;
     */
    payload?: JsonObject;
    /**
     * @generated from field: google.protobuf.Timestamp executed_at = 4;
     */
    executedAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.governance.v1.SingleOwnerAction.
 * Use `create(SingleOwnerActionSchema)` to create a new message.
 */
export declare const SingleOwnerActionSchema: GenMessage<SingleOwnerAction>;
/**
 * @generated from message ottochain.apps.governance.v1.OwnershipTransfer
 */
export type OwnershipTransfer = Message<"ottochain.apps.governance.v1.OwnershipTransfer"> & {
    /**
     * @generated from field: ottochain.v1.Address from = 1;
     */
    from?: Address;
    /**
     * @generated from field: ottochain.v1.Address to = 2;
     */
    to?: Address;
    /**
     * @generated from field: google.protobuf.Timestamp at = 3;
     */
    at?: Timestamp;
};
/**
 * Describes the message ottochain.apps.governance.v1.OwnershipTransfer.
 * Use `create(OwnershipTransferSchema)` to create a new message.
 */
export declare const OwnershipTransferSchema: GenMessage<OwnershipTransfer>;
/**
 * @generated from message ottochain.apps.governance.v1.MultisigDAO
 */
export type MultisigDAO = Message<"ottochain.apps.governance.v1.MultisigDAO"> & {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: repeated ottochain.v1.Address signers = 2;
     */
    signers: Address[];
    /**
     * @generated from field: int32 threshold = 3;
     */
    threshold: number;
    /**
     * @generated from field: int64 proposal_ttl_ms = 4;
     */
    proposalTtlMs: bigint;
    /**
     * @generated from field: ottochain.apps.governance.v1.Proposal proposal = 5;
     */
    proposal?: Proposal;
    /**
     * signer address -> timestamp
     *
     * @generated from field: map<string, int64> signatures = 6;
     */
    signatures: {
        [key: string]: bigint;
    };
    /**
     * @generated from field: repeated ottochain.apps.governance.v1.MultisigAction actions = 7;
     */
    actions: MultisigAction[];
    /**
     * @generated from field: repeated ottochain.apps.governance.v1.Proposal cancelled_proposals = 8;
     */
    cancelledProposals: Proposal[];
    /**
     * @generated from field: ottochain.apps.governance.v1.DAOMetadata metadata = 9;
     */
    metadata?: DAOMetadata;
    /**
     * @generated from field: ottochain.apps.governance.v1.DAOStatus status = 10;
     */
    status: DAOStatus;
};
/**
 * Describes the message ottochain.apps.governance.v1.MultisigDAO.
 * Use `create(MultisigDAOSchema)` to create a new message.
 */
export declare const MultisigDAOSchema: GenMessage<MultisigDAO>;
/**
 * @generated from message ottochain.apps.governance.v1.MultisigAction
 */
export type MultisigAction = Message<"ottochain.apps.governance.v1.MultisigAction"> & {
    /**
     * @generated from field: ottochain.apps.governance.v1.Proposal proposal = 1;
     */
    proposal?: Proposal;
    /**
     * @generated from field: map<string, int64> signatures = 2;
     */
    signatures: {
        [key: string]: bigint;
    };
    /**
     * @generated from field: google.protobuf.Timestamp executed_at = 3;
     */
    executedAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.governance.v1.MultisigAction.
 * Use `create(MultisigActionSchema)` to create a new message.
 */
export declare const MultisigActionSchema: GenMessage<MultisigAction>;
/**
 * @generated from message ottochain.apps.governance.v1.TokenDAO
 */
export type TokenDAO = Message<"ottochain.apps.governance.v1.TokenDAO"> & {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: string token_id = 2;
     */
    tokenId: string;
    /**
     * address -> balance
     *
     * @generated from field: map<string, int64> balances = 3;
     */
    balances: {
        [key: string]: bigint;
    };
    /**
     * delegator -> delegatee
     *
     * @generated from field: map<string, string> delegations = 4;
     */
    delegations: {
        [key: string]: string;
    };
    /**
     * Governance parameters
     *
     * @generated from field: int64 proposal_threshold = 5;
     */
    proposalThreshold: bigint;
    /**
     * @generated from field: int64 voting_period_ms = 6;
     */
    votingPeriodMs: bigint;
    /**
     * @generated from field: int64 timelock_ms = 7;
     */
    timelockMs: bigint;
    /**
     * @generated from field: int64 quorum = 8;
     */
    quorum: bigint;
    /**
     * Current state
     *
     * @generated from field: ottochain.apps.governance.v1.Proposal proposal = 9;
     */
    proposal?: Proposal;
    /**
     * @generated from field: ottochain.apps.governance.v1.VoteTally votes = 10;
     */
    votes?: VoteTally;
    /**
     * History
     *
     * @generated from field: repeated ottochain.apps.governance.v1.TokenProposalResult executed_proposals = 11;
     */
    executedProposals: TokenProposalResult[];
    /**
     * @generated from field: repeated ottochain.apps.governance.v1.TokenProposalResult rejected_proposals = 12;
     */
    rejectedProposals: TokenProposalResult[];
    /**
     * @generated from field: repeated ottochain.apps.governance.v1.Proposal cancelled_proposals = 13;
     */
    cancelledProposals: Proposal[];
    /**
     * @generated from field: ottochain.apps.governance.v1.DAOMetadata metadata = 14;
     */
    metadata?: DAOMetadata;
    /**
     * @generated from field: ottochain.apps.governance.v1.DAOStatus status = 15;
     */
    status: DAOStatus;
};
/**
 * Describes the message ottochain.apps.governance.v1.TokenDAO.
 * Use `create(TokenDAOSchema)` to create a new message.
 */
export declare const TokenDAOSchema: GenMessage<TokenDAO>;
/**
 * @generated from message ottochain.apps.governance.v1.TokenProposalResult
 */
export type TokenProposalResult = Message<"ottochain.apps.governance.v1.TokenProposalResult"> & {
    /**
     * @generated from field: ottochain.apps.governance.v1.Proposal proposal = 1;
     */
    proposal?: Proposal;
    /**
     * @generated from field: ottochain.apps.governance.v1.VoteTally votes = 2;
     */
    votes?: VoteTally;
    /**
     * @generated from field: google.protobuf.Timestamp finalized_at = 3;
     */
    finalizedAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.governance.v1.TokenProposalResult.
 * Use `create(TokenProposalResultSchema)` to create a new message.
 */
export declare const TokenProposalResultSchema: GenMessage<TokenProposalResult>;
/**
 * @generated from message ottochain.apps.governance.v1.ThresholdDAO
 */
export type ThresholdDAO = Message<"ottochain.apps.governance.v1.ThresholdDAO"> & {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: repeated ottochain.v1.Address members = 2;
     */
    members: Address[];
    /**
     * @generated from field: map<string, int64> member_joined_at = 3;
     */
    memberJoinedAt: {
        [key: string]: bigint;
    };
    /**
     * Thresholds
     *
     * @generated from field: int64 member_threshold = 4;
     */
    memberThreshold: bigint;
    /**
     * @generated from field: int64 vote_threshold = 5;
     */
    voteThreshold: bigint;
    /**
     * @generated from field: int64 propose_threshold = 6;
     */
    proposeThreshold: bigint;
    /**
     * @generated from field: int64 quorum = 7;
     */
    quorum: bigint;
    /**
     * @generated from field: int64 voting_period_ms = 8;
     */
    votingPeriodMs: bigint;
    /**
     * Current state
     *
     * @generated from field: ottochain.apps.governance.v1.Proposal proposal = 9;
     */
    proposal?: Proposal;
    /**
     * @generated from field: ottochain.apps.governance.v1.ThresholdVotes votes = 10;
     */
    votes?: ThresholdVotes;
    /**
     * History
     *
     * @generated from field: repeated ottochain.apps.governance.v1.ThresholdHistoryEntry history = 11;
     */
    history: ThresholdHistoryEntry[];
    /**
     * @generated from field: ottochain.apps.governance.v1.DAOMetadata metadata = 12;
     */
    metadata?: DAOMetadata;
    /**
     * @generated from field: ottochain.apps.governance.v1.DAOStatus status = 13;
     */
    status: DAOStatus;
};
/**
 * Describes the message ottochain.apps.governance.v1.ThresholdDAO.
 * Use `create(ThresholdDAOSchema)` to create a new message.
 */
export declare const ThresholdDAOSchema: GenMessage<ThresholdDAO>;
/**
 * @generated from message ottochain.apps.governance.v1.ThresholdVotes
 */
export type ThresholdVotes = Message<"ottochain.apps.governance.v1.ThresholdVotes"> & {
    /**
     * @generated from field: repeated ottochain.v1.Address votes_for = 1;
     */
    votesFor: Address[];
    /**
     * @generated from field: repeated ottochain.v1.Address votes_against = 2;
     */
    votesAgainst: Address[];
    /**
     * @generated from field: repeated ottochain.v1.Address votes_abstain = 3;
     */
    votesAbstain: Address[];
};
/**
 * Describes the message ottochain.apps.governance.v1.ThresholdVotes.
 * Use `create(ThresholdVotesSchema)` to create a new message.
 */
export declare const ThresholdVotesSchema: GenMessage<ThresholdVotes>;
/**
 * @generated from message ottochain.apps.governance.v1.ThresholdHistoryEntry
 */
export type ThresholdHistoryEntry = Message<"ottochain.apps.governance.v1.ThresholdHistoryEntry"> & {
    /**
     * "executed" | "rejected"
     *
     * @generated from field: string result_type = 1;
     */
    resultType: string;
    /**
     * @generated from field: ottochain.apps.governance.v1.Proposal proposal = 2;
     */
    proposal?: Proposal;
    /**
     * @generated from field: ottochain.apps.governance.v1.ThresholdVotes votes = 3;
     */
    votes?: ThresholdVotes;
    /**
     * @generated from field: google.protobuf.Timestamp at = 4;
     */
    at?: Timestamp;
};
/**
 * Describes the message ottochain.apps.governance.v1.ThresholdHistoryEntry.
 * Use `create(ThresholdHistoryEntrySchema)` to create a new message.
 */
export declare const ThresholdHistoryEntrySchema: GenMessage<ThresholdHistoryEntry>;
/**
 * @generated from message ottochain.apps.governance.v1.CreateDAORequest
 */
export type CreateDAORequest = Message<"ottochain.apps.governance.v1.CreateDAORequest"> & {
    /**
     * @generated from field: ottochain.apps.governance.v1.DAOType dao_type = 1;
     */
    daoType: DAOType;
    /**
     * @generated from field: string name = 2;
     */
    name: string;
    /**
     * @generated from field: ottochain.v1.Address creator = 3;
     */
    creator?: Address;
    /**
     * @generated from field: ottochain.apps.governance.v1.DAOMetadata metadata = 4;
     */
    metadata?: DAOMetadata;
    /**
     * Type-specific config (signers, thresholds, etc.)
     *
     * @generated from field: google.protobuf.Struct config = 5;
     */
    config?: JsonObject;
};
/**
 * Describes the message ottochain.apps.governance.v1.CreateDAORequest.
 * Use `create(CreateDAORequestSchema)` to create a new message.
 */
export declare const CreateDAORequestSchema: GenMessage<CreateDAORequest>;
/**
 * @generated from message ottochain.apps.governance.v1.ProposeRequest
 */
export type ProposeRequest = Message<"ottochain.apps.governance.v1.ProposeRequest"> & {
    /**
     * @generated from field: string dao_id = 1;
     */
    daoId: string;
    /**
     * @generated from field: ottochain.v1.Address proposer = 2;
     */
    proposer?: Address;
    /**
     * @generated from field: string title = 3;
     */
    title: string;
    /**
     * @generated from field: string description = 4;
     */
    description: string;
    /**
     * @generated from field: string action_type = 5;
     */
    actionType: string;
    /**
     * @generated from field: google.protobuf.Struct payload = 6;
     */
    payload?: JsonObject;
};
/**
 * Describes the message ottochain.apps.governance.v1.ProposeRequest.
 * Use `create(ProposeRequestSchema)` to create a new message.
 */
export declare const ProposeRequestSchema: GenMessage<ProposeRequest>;
/**
 * @generated from message ottochain.apps.governance.v1.VoteRequest
 */
export type VoteRequest = Message<"ottochain.apps.governance.v1.VoteRequest"> & {
    /**
     * @generated from field: string dao_id = 1;
     */
    daoId: string;
    /**
     * @generated from field: ottochain.v1.Address voter = 2;
     */
    voter?: Address;
    /**
     * @generated from field: ottochain.apps.governance.v1.VoteChoice choice = 3;
     */
    choice: VoteChoice;
};
/**
 * Describes the message ottochain.apps.governance.v1.VoteRequest.
 * Use `create(VoteRequestSchema)` to create a new message.
 */
export declare const VoteRequestSchema: GenMessage<VoteRequest>;
/**
 * @generated from message ottochain.apps.governance.v1.ExecuteRequest
 */
export type ExecuteRequest = Message<"ottochain.apps.governance.v1.ExecuteRequest"> & {
    /**
     * @generated from field: string dao_id = 1;
     */
    daoId: string;
    /**
     * @generated from field: ottochain.v1.Address executor = 2;
     */
    executor?: Address;
};
/**
 * Describes the message ottochain.apps.governance.v1.ExecuteRequest.
 * Use `create(ExecuteRequestSchema)` to create a new message.
 */
export declare const ExecuteRequestSchema: GenMessage<ExecuteRequest>;
/**
 * Type of DAO governance model
 *
 * @generated from enum ottochain.apps.governance.v1.DAOType
 */
export declare enum DAOType {
    /**
     * @generated from enum value: DAO_TYPE_UNSPECIFIED = 0;
     */
    DAO_TYPE_UNSPECIFIED = 0,
    /**
     * Single owner controls all actions
     *
     * @generated from enum value: DAO_TYPE_SINGLE = 1;
     */
    DAO_TYPE_SINGLE = 1,
    /**
     * N-of-M signatures required
     *
     * @generated from enum value: DAO_TYPE_MULTISIG = 2;
     */
    DAO_TYPE_MULTISIG = 2,
    /**
     * Token-weighted voting
     *
     * @generated from enum value: DAO_TYPE_TOKEN = 3;
     */
    DAO_TYPE_TOKEN = 3,
    /**
     * Reputation threshold for participation
     *
     * @generated from enum value: DAO_TYPE_THRESHOLD = 4;
     */
    DAO_TYPE_THRESHOLD = 4
}
/**
 * Describes the enum ottochain.apps.governance.v1.DAOType.
 */
export declare const DAOTypeSchema: GenEnum<DAOType>;
/**
 * DAO lifecycle status
 *
 * @generated from enum ottochain.apps.governance.v1.DAOStatus
 */
export declare enum DAOStatus {
    /**
     * @generated from enum value: DAO_STATUS_UNSPECIFIED = 0;
     */
    DAO_STATUS_UNSPECIFIED = 0,
    /**
     * @generated from enum value: DAO_STATUS_ACTIVE = 1;
     */
    DAO_STATUS_ACTIVE = 1,
    /**
     * @generated from enum value: DAO_STATUS_DISSOLVED = 2;
     */
    DAO_STATUS_DISSOLVED = 2
}
/**
 * Describes the enum ottochain.apps.governance.v1.DAOStatus.
 */
export declare const DAOStatusSchema: GenEnum<DAOStatus>;
/**
 * Proposal status for voting DAOs
 *
 * @generated from enum ottochain.apps.governance.v1.ProposalStatus
 */
export declare enum ProposalStatus {
    /**
     * @generated from enum value: PROPOSAL_STATUS_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: PROPOSAL_STATUS_PENDING = 1;
     */
    PENDING = 1,
    /**
     * @generated from enum value: PROPOSAL_STATUS_VOTING = 2;
     */
    VOTING = 2,
    /**
     * @generated from enum value: PROPOSAL_STATUS_QUEUED = 3;
     */
    QUEUED = 3,
    /**
     * @generated from enum value: PROPOSAL_STATUS_EXECUTED = 4;
     */
    EXECUTED = 4,
    /**
     * @generated from enum value: PROPOSAL_STATUS_REJECTED = 5;
     */
    REJECTED = 5,
    /**
     * @generated from enum value: PROPOSAL_STATUS_CANCELLED = 6;
     */
    CANCELLED = 6
}
/**
 * Describes the enum ottochain.apps.governance.v1.ProposalStatus.
 */
export declare const ProposalStatusSchema: GenEnum<ProposalStatus>;
/**
 * Vote choice
 *
 * @generated from enum ottochain.apps.governance.v1.VoteChoice
 */
export declare enum VoteChoice {
    /**
     * @generated from enum value: VOTE_CHOICE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: VOTE_CHOICE_FOR = 1;
     */
    FOR = 1,
    /**
     * @generated from enum value: VOTE_CHOICE_AGAINST = 2;
     */
    AGAINST = 2,
    /**
     * @generated from enum value: VOTE_CHOICE_ABSTAIN = 3;
     */
    ABSTAIN = 3
}
/**
 * Describes the enum ottochain.apps.governance.v1.VoteChoice.
 */
export declare const VoteChoiceSchema: GenEnum<VoteChoice>;
