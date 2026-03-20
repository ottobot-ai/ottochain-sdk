import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "ottochain.apps.delegation.v1";
/** Status of a delegation */
export declare enum DelegationStatus {
    DELEGATION_STATUS_UNSPECIFIED = "DELEGATION_STATUS_UNSPECIFIED",
    /** DELEGATION_STATUS_ACTIVE - Currently valid and usable */
    DELEGATION_STATUS_ACTIVE = "DELEGATION_STATUS_ACTIVE",
    /** DELEGATION_STATUS_EXPIRED - Expired due to time limit */
    DELEGATION_STATUS_EXPIRED = "DELEGATION_STATUS_EXPIRED",
    /** DELEGATION_STATUS_REVOKED - Revoked by user or system */
    DELEGATION_STATUS_REVOKED = "DELEGATION_STATUS_REVOKED",
    /** DELEGATION_STATUS_SUSPENDED - Temporarily suspended due to issues */
    DELEGATION_STATUS_SUSPENDED = "DELEGATION_STATUS_SUSPENDED",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function delegationStatusFromJSON(object: any): DelegationStatus;
export declare function delegationStatusToJSON(object: DelegationStatus): string;
export declare function delegationStatusToNumber(object: DelegationStatus): number;
export declare enum DelegationValidationErrorType {
    DELEGATION_VALIDATION_ERROR_UNSPECIFIED = "DELEGATION_VALIDATION_ERROR_UNSPECIFIED",
    DELEGATION_VALIDATION_ERROR_DELEGATION_NOT_FOUND = "DELEGATION_VALIDATION_ERROR_DELEGATION_NOT_FOUND",
    DELEGATION_VALIDATION_ERROR_DELEGATION_EXPIRED = "DELEGATION_VALIDATION_ERROR_DELEGATION_EXPIRED",
    DELEGATION_VALIDATION_ERROR_DELEGATION_REVOKED = "DELEGATION_VALIDATION_ERROR_DELEGATION_REVOKED",
    DELEGATION_VALIDATION_ERROR_SCOPE_VIOLATION = "DELEGATION_VALIDATION_ERROR_SCOPE_VIOLATION",
    DELEGATION_VALIDATION_ERROR_SPENDING_LIMIT_EXCEEDED = "DELEGATION_VALIDATION_ERROR_SPENDING_LIMIT_EXCEEDED",
    DELEGATION_VALIDATION_ERROR_REPUTATION_TOO_LOW = "DELEGATION_VALIDATION_ERROR_REPUTATION_TOO_LOW",
    DELEGATION_VALIDATION_ERROR_INVALID_SIGNATURE = "DELEGATION_VALIDATION_ERROR_INVALID_SIGNATURE",
    DELEGATION_VALIDATION_ERROR_INVALID_NONCE = "DELEGATION_VALIDATION_ERROR_INVALID_NONCE",
    DELEGATION_VALIDATION_ERROR_SESSION_KEY_EXPIRED = "DELEGATION_VALIDATION_ERROR_SESSION_KEY_EXPIRED",
    DELEGATION_VALIDATION_ERROR_SESSION_KEY_INACTIVE = "DELEGATION_VALIDATION_ERROR_SESSION_KEY_INACTIVE",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function delegationValidationErrorTypeFromJSON(object: any): DelegationValidationErrorType;
export declare function delegationValidationErrorTypeToJSON(object: DelegationValidationErrorType): string;
export declare function delegationValidationErrorTypeToNumber(object: DelegationValidationErrorType): number;
/** Session key delegation that grants limited authority to agents */
export interface Delegation {
    /** Unique identifier for this delegation */
    delegationId: string;
    /** Address of the user granting the delegation */
    delegatorAddress: string;
    /** Address of the agent receiving the delegation */
    delegateAddress: string;
    /** Session key that can be used to sign transactions */
    sessionKey?: SessionKey | undefined;
    /** Operations that are permitted under this delegation */
    scope?: DelegationScope | undefined;
    /** When this delegation was created */
    createdAt?: Date | undefined;
    /** When this delegation expires (max 24 hours from creation) */
    expiresAt?: Date | undefined;
    /** Current status of the delegation */
    status: DelegationStatus;
    /** Nonce for replay protection */
    nonce: number;
    /** User's signature authorizing this delegation */
    userSignature: string;
}
/** Session key for signing delegated transactions */
export interface SessionKey {
    /** Unique identifier for this session key */
    sessionKeyId: string;
    /** Public key (compressed format) */
    publicKey: string;
    /** When this session key was created */
    createdAt?: Date | undefined;
    /** When this session key expires */
    expiresAt?: Date | undefined;
    /** Whether this key is currently active */
    isActive: boolean;
}
/** Scope of operations permitted by a delegation */
export interface DelegationScope {
    /** Operations that are allowed (e.g., "transfer", "create_market", "vote") */
    allowedOperations: string[];
    /** Contract addresses that can be called (empty means all contracts) */
    allowedContracts: string[];
    /** Maximum amount that can be spent in a single transaction */
    maxTransactionAmount?: string | undefined;
    /** Maximum total amount that can be spent during delegation lifetime */
    maxTotalAmount?: string | undefined;
    /** Minimum reputation score required for delegate */
    minReputationScore?: number | undefined;
}
/** Transaction signed using a session key */
export interface DelegatedTransaction {
    /** Reference to the delegation authorizing this transaction */
    delegationId: string;
    /** Session key used to sign this transaction */
    sessionKeyId: string;
    /** The operation being performed */
    operation: string;
    /** Target address or contract */
    target: string;
    /** Amount being transferred or spent */
    amount?: string | undefined;
    /** Transaction payload */
    payload: Uint8Array;
    /** Session key signature */
    sessionSignature: string;
    /** Transaction nonce (separate from delegation nonce) */
    transactionNonce: number;
    /** When transaction was created */
    createdAt?: Date | undefined;
}
/** Request to create a new delegation */
export interface CreateDelegationRequest {
    /** Delegation to create */
    delegation?: Delegation | undefined;
}
/** Response when delegation is created */
export interface CreateDelegationResponse {
    /** ID of the created delegation */
    delegationId: string;
    /** Session key details */
    sessionKey?: SessionKey | undefined;
    /** Success indicator */
    success: boolean;
    /** Error message if creation failed */
    errorMessage: string;
    /** Validation errors */
    validationErrors: DelegationValidationError[];
}
/** Request to revoke a delegation */
export interface RevokeDelegationRequest {
    /** ID of delegation to revoke */
    delegationId: string;
    /** Address of user revoking (must match delegator) */
    userAddress: string;
    /** User signature authorizing revocation */
    revocationSignature: string;
    /** Nonce for replay protection */
    nonce: number;
    /** Reason for revocation */
    reason: string;
}
/** Response when delegation is revoked */
export interface RevokeDelegationResponse {
    success: boolean;
    errorMessage: string;
}
/** Request to query delegations */
export interface GetDelegationsRequest {
    /** Filter by delegator address */
    delegatorAddress?: string | undefined;
    /** Filter by delegate address */
    delegateAddress?: string | undefined;
    /** Filter by status */
    statusFilter?: DelegationStatus | undefined;
    /** Pagination */
    limit: number;
    offset: number;
}
/** Response with delegation list */
export interface GetDelegationsResponse {
    delegations: Delegation[];
    totalCount: number;
    hasMore: boolean;
}
/** Request to validate a delegated transaction */
export interface ValidateDelegatedTransactionRequest {
    transaction?: DelegatedTransaction | undefined;
}
/** Response with validation result */
export interface ValidateDelegatedTransactionResponse {
    isValid: boolean;
    validationErrors: DelegationValidationError[];
}
/** Delegation validation error */
export interface DelegationValidationError {
    errorType: DelegationValidationErrorType;
    errorMessage: string;
    fieldPath: string;
}
export declare const Delegation: MessageFns<Delegation>;
export declare const SessionKey: MessageFns<SessionKey>;
export declare const DelegationScope: MessageFns<DelegationScope>;
export declare const DelegatedTransaction: MessageFns<DelegatedTransaction>;
export declare const CreateDelegationRequest: MessageFns<CreateDelegationRequest>;
export declare const CreateDelegationResponse: MessageFns<CreateDelegationResponse>;
export declare const RevokeDelegationRequest: MessageFns<RevokeDelegationRequest>;
export declare const RevokeDelegationResponse: MessageFns<RevokeDelegationResponse>;
export declare const GetDelegationsRequest: MessageFns<GetDelegationsRequest>;
export declare const GetDelegationsResponse: MessageFns<GetDelegationsResponse>;
export declare const ValidateDelegatedTransactionRequest: MessageFns<ValidateDelegatedTransactionRequest>;
export declare const ValidateDelegatedTransactionResponse: MessageFns<ValidateDelegatedTransactionResponse>;
export declare const DelegationValidationError: MessageFns<DelegationValidationError>;
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
