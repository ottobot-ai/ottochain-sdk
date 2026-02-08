import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "ottochain.apps.governance.v1";
/** Type of DAO governance model */
export declare enum DAOType {
    DAO_TYPE_UNSPECIFIED = "DAO_TYPE_UNSPECIFIED",
    /** DAO_TYPE_SINGLE - Single owner controls all actions */
    DAO_TYPE_SINGLE = "DAO_TYPE_SINGLE",
    /** DAO_TYPE_MULTISIG - N-of-M signatures required */
    DAO_TYPE_MULTISIG = "DAO_TYPE_MULTISIG",
    /** DAO_TYPE_TOKEN - Token-weighted voting */
    DAO_TYPE_TOKEN = "DAO_TYPE_TOKEN",
    /** DAO_TYPE_THRESHOLD - Reputation threshold for participation */
    DAO_TYPE_THRESHOLD = "DAO_TYPE_THRESHOLD",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function dAOTypeFromJSON(object: any): DAOType;
export declare function dAOTypeToJSON(object: DAOType): string;
export declare function dAOTypeToNumber(object: DAOType): number;
/** DAO lifecycle status */
export declare enum DAOStatus {
    DAO_STATUS_UNSPECIFIED = "DAO_STATUS_UNSPECIFIED",
    DAO_STATUS_ACTIVE = "DAO_STATUS_ACTIVE",
    DAO_STATUS_DISSOLVED = "DAO_STATUS_DISSOLVED",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function dAOStatusFromJSON(object: any): DAOStatus;
export declare function dAOStatusToJSON(object: DAOStatus): string;
export declare function dAOStatusToNumber(object: DAOStatus): number;
/** Proposal status for voting DAOs */
export declare enum ProposalStatus {
    PROPOSAL_STATUS_UNSPECIFIED = "PROPOSAL_STATUS_UNSPECIFIED",
    PROPOSAL_STATUS_PENDING = "PROPOSAL_STATUS_PENDING",
    PROPOSAL_STATUS_VOTING = "PROPOSAL_STATUS_VOTING",
    PROPOSAL_STATUS_QUEUED = "PROPOSAL_STATUS_QUEUED",
    PROPOSAL_STATUS_EXECUTED = "PROPOSAL_STATUS_EXECUTED",
    PROPOSAL_STATUS_REJECTED = "PROPOSAL_STATUS_REJECTED",
    PROPOSAL_STATUS_CANCELLED = "PROPOSAL_STATUS_CANCELLED",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function proposalStatusFromJSON(object: any): ProposalStatus;
export declare function proposalStatusToJSON(object: ProposalStatus): string;
export declare function proposalStatusToNumber(object: ProposalStatus): number;
/** Vote choice */
export declare enum VoteChoice {
    VOTE_CHOICE_UNSPECIFIED = "VOTE_CHOICE_UNSPECIFIED",
    VOTE_CHOICE_FOR = "VOTE_CHOICE_FOR",
    VOTE_CHOICE_AGAINST = "VOTE_CHOICE_AGAINST",
    VOTE_CHOICE_ABSTAIN = "VOTE_CHOICE_ABSTAIN",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function voteChoiceFromJSON(object: any): VoteChoice;
export declare function voteChoiceToJSON(object: VoteChoice): string;
export declare function voteChoiceToNumber(object: VoteChoice): number;
/** DAO metadata */
export interface DAOMetadata {
    description: string;
    website: string;
    logo: string;
    extra?: {
        [key: string]: any;
    } | undefined;
}
/** Proposal for any DAO type */
export interface Proposal {
    id: string;
    title: string;
    description: string;
    actionType: string;
    payload?: {
        [key: string]: any;
    } | undefined;
    proposer: string;
    proposedAt?: Date | undefined;
    deadline?: Date | undefined;
    queuedAt?: Date | undefined;
    executableAt?: Date | undefined;
}
/** Vote record */
export interface Vote {
    voter: string;
    choice: VoteChoice;
    weight: number;
    votedAt?: Date | undefined;
}
/** Vote tally */
export interface VoteTally {
    votesFor: number;
    votesAgainst: number;
    votesAbstain: number;
    votes: Vote[];
}
export interface SingleOwnerDAO {
    name: string;
    owner: string;
    pendingOwner: string;
    transferInitiatedAt?: Date | undefined;
    actions: SingleOwnerAction[];
    ownershipHistory: OwnershipTransfer[];
    metadata?: DAOMetadata | undefined;
    status: DAOStatus;
}
export interface SingleOwnerAction {
    id: string;
    actionType: string;
    payload?: {
        [key: string]: any;
    } | undefined;
    executedAt?: Date | undefined;
}
export interface OwnershipTransfer {
    from: string;
    to: string;
    at?: Date | undefined;
}
export interface MultisigDAO {
    name: string;
    signers: string[];
    threshold: number;
    proposalTtlMs: number;
    proposal?: Proposal | undefined;
    /** signer address -> timestamp */
    signatures: {
        [key: string]: number;
    };
    actions: MultisigAction[];
    cancelledProposals: Proposal[];
    metadata?: DAOMetadata | undefined;
    status: DAOStatus;
}
export interface MultisigDAO_SignaturesEntry {
    key: string;
    value: number;
}
export interface MultisigAction {
    proposal?: Proposal | undefined;
    signatures: {
        [key: string]: number;
    };
    executedAt?: Date | undefined;
}
export interface MultisigAction_SignaturesEntry {
    key: string;
    value: number;
}
export interface TokenDAO {
    name: string;
    tokenId: string;
    /** address -> balance */
    balances: {
        [key: string]: number;
    };
    /** delegator -> delegatee */
    delegations: {
        [key: string]: string;
    };
    /** Governance parameters */
    proposalThreshold: number;
    votingPeriodMs: number;
    timelockMs: number;
    quorum: number;
    /** Current state */
    proposal?: Proposal | undefined;
    votes?: VoteTally | undefined;
    /** History */
    executedProposals: TokenProposalResult[];
    rejectedProposals: TokenProposalResult[];
    cancelledProposals: Proposal[];
    metadata?: DAOMetadata | undefined;
    status: DAOStatus;
}
export interface TokenDAO_BalancesEntry {
    key: string;
    value: number;
}
export interface TokenDAO_DelegationsEntry {
    key: string;
    value: string;
}
export interface TokenProposalResult {
    proposal?: Proposal | undefined;
    votes?: VoteTally | undefined;
    finalizedAt?: Date | undefined;
}
export interface ThresholdDAO {
    name: string;
    members: string[];
    memberJoinedAt: {
        [key: string]: number;
    };
    /** Thresholds */
    memberThreshold: number;
    voteThreshold: number;
    proposeThreshold: number;
    quorum: number;
    votingPeriodMs: number;
    /** Current state */
    proposal?: Proposal | undefined;
    votes?: ThresholdVotes | undefined;
    /** History */
    history: ThresholdHistoryEntry[];
    metadata?: DAOMetadata | undefined;
    status: DAOStatus;
}
export interface ThresholdDAO_MemberJoinedAtEntry {
    key: string;
    value: number;
}
export interface ThresholdVotes {
    votesFor: string[];
    votesAgainst: string[];
    votesAbstain: string[];
}
export interface ThresholdHistoryEntry {
    /** "executed" | "rejected" */
    resultType: string;
    proposal?: Proposal | undefined;
    votes?: ThresholdVotes | undefined;
    at?: Date | undefined;
}
export interface CreateDAORequest {
    daoType: DAOType;
    name: string;
    creator: string;
    metadata?: DAOMetadata | undefined;
    /** Type-specific config (signers, thresholds, etc.) */
    config?: {
        [key: string]: any;
    } | undefined;
}
export interface ProposeRequest {
    daoId: string;
    proposer: string;
    title: string;
    description: string;
    actionType: string;
    payload?: {
        [key: string]: any;
    } | undefined;
}
export interface VoteRequest {
    daoId: string;
    voter: string;
    choice: VoteChoice;
}
export interface ExecuteRequest {
    daoId: string;
    executor: string;
}
export declare const DAOMetadata: MessageFns<DAOMetadata>;
export declare const Proposal: MessageFns<Proposal>;
export declare const Vote: MessageFns<Vote>;
export declare const VoteTally: MessageFns<VoteTally>;
export declare const SingleOwnerDAO: MessageFns<SingleOwnerDAO>;
export declare const SingleOwnerAction: MessageFns<SingleOwnerAction>;
export declare const OwnershipTransfer: MessageFns<OwnershipTransfer>;
export declare const MultisigDAO: MessageFns<MultisigDAO>;
export declare const MultisigDAO_SignaturesEntry: MessageFns<MultisigDAO_SignaturesEntry>;
export declare const MultisigAction: MessageFns<MultisigAction>;
export declare const MultisigAction_SignaturesEntry: MessageFns<MultisigAction_SignaturesEntry>;
export declare const TokenDAO: MessageFns<TokenDAO>;
export declare const TokenDAO_BalancesEntry: MessageFns<TokenDAO_BalancesEntry>;
export declare const TokenDAO_DelegationsEntry: MessageFns<TokenDAO_DelegationsEntry>;
export declare const TokenProposalResult: MessageFns<TokenProposalResult>;
export declare const ThresholdDAO: MessageFns<ThresholdDAO>;
export declare const ThresholdDAO_MemberJoinedAtEntry: MessageFns<ThresholdDAO_MemberJoinedAtEntry>;
export declare const ThresholdVotes: MessageFns<ThresholdVotes>;
export declare const ThresholdHistoryEntry: MessageFns<ThresholdHistoryEntry>;
export declare const CreateDAORequest: MessageFns<CreateDAORequest>;
export declare const ProposeRequest: MessageFns<ProposeRequest>;
export declare const VoteRequest: MessageFns<VoteRequest>;
export declare const ExecuteRequest: MessageFns<ExecuteRequest>;
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {
    $case: string;
} ? {
    [K in keyof Omit<T, "$case">]?: DeepPartial<T[K]>;
} & {
    $case: T["$case"];
} : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export interface MessageFns<T> {
    encode(message: T, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): T;
    fromJSON(object: any): T;
    toJSON(message: T): unknown;
    create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
    fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
export {};
