import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Any } from "../../../../google/protobuf/any.js";
export declare const protobufPackage = "ottochain.apps.delegation.v1";
/** Status of an intent */
export declare enum IntentStatus {
    INTENT_STATUS_UNSPECIFIED = "INTENT_STATUS_UNSPECIFIED",
    /** INTENT_STATUS_PENDING - Created but conditions not yet met */
    INTENT_STATUS_PENDING = "INTENT_STATUS_PENDING",
    /** INTENT_STATUS_READY - All conditions met, ready for execution */
    INTENT_STATUS_READY = "INTENT_STATUS_READY",
    /** INTENT_STATUS_EXECUTING - Currently being executed */
    INTENT_STATUS_EXECUTING = "INTENT_STATUS_EXECUTING",
    /** INTENT_STATUS_COMPLETED - Successfully completed */
    INTENT_STATUS_COMPLETED = "INTENT_STATUS_COMPLETED",
    /** INTENT_STATUS_FAILED - Failed during execution */
    INTENT_STATUS_FAILED = "INTENT_STATUS_FAILED",
    /** INTENT_STATUS_CANCELLED - Cancelled by user */
    INTENT_STATUS_CANCELLED = "INTENT_STATUS_CANCELLED",
    /** INTENT_STATUS_EXPIRED - Expired before execution */
    INTENT_STATUS_EXPIRED = "INTENT_STATUS_EXPIRED",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function intentStatusFromJSON(object: any): IntentStatus;
export declare function intentStatusToJSON(object: IntentStatus): string;
export declare function intentStatusToNumber(object: IntentStatus): number;
export declare enum IntentValidationErrorType {
    INTENT_VALIDATION_ERROR_UNSPECIFIED = "INTENT_VALIDATION_ERROR_UNSPECIFIED",
    INTENT_VALIDATION_ERROR_INTENT_NOT_FOUND = "INTENT_VALIDATION_ERROR_INTENT_NOT_FOUND",
    INTENT_VALIDATION_ERROR_INTENT_EXPIRED = "INTENT_VALIDATION_ERROR_INTENT_EXPIRED",
    INTENT_VALIDATION_ERROR_INTENT_CANCELLED = "INTENT_VALIDATION_ERROR_INTENT_CANCELLED",
    INTENT_VALIDATION_ERROR_DELEGATION_INVALID = "INTENT_VALIDATION_ERROR_DELEGATION_INVALID",
    INTENT_VALIDATION_ERROR_VALIDATION_RULES_FAILED = "INTENT_VALIDATION_ERROR_VALIDATION_RULES_FAILED",
    INTENT_VALIDATION_ERROR_EXECUTION_CONDITIONS_NOT_MET = "INTENT_VALIDATION_ERROR_EXECUTION_CONDITIONS_NOT_MET",
    INTENT_VALIDATION_ERROR_VALUE_THRESHOLD_EXCEEDED = "INTENT_VALIDATION_ERROR_VALUE_THRESHOLD_EXCEEDED",
    INTENT_VALIDATION_ERROR_INVALID_USER_SIGNATURE = "INTENT_VALIDATION_ERROR_INVALID_USER_SIGNATURE",
    INTENT_VALIDATION_ERROR_INVALID_RELAYER_SIGNATURE = "INTENT_VALIDATION_ERROR_INVALID_RELAYER_SIGNATURE",
    INTENT_VALIDATION_ERROR_JSON_LOGIC_PARSE_ERROR = "INTENT_VALIDATION_ERROR_JSON_LOGIC_PARSE_ERROR",
    INTENT_VALIDATION_ERROR_JSON_LOGIC_EVALUATION_ERROR = "INTENT_VALIDATION_ERROR_JSON_LOGIC_EVALUATION_ERROR",
    INTENT_VALIDATION_ERROR_CONTEXT_INSUFFICIENT = "INTENT_VALIDATION_ERROR_CONTEXT_INSUFFICIENT",
    INTENT_VALIDATION_ERROR_INVALID_NONCE = "INTENT_VALIDATION_ERROR_INVALID_NONCE",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function intentValidationErrorTypeFromJSON(object: any): IntentValidationErrorType;
export declare function intentValidationErrorTypeToJSON(object: IntentValidationErrorType): string;
export declare function intentValidationErrorTypeToNumber(object: IntentValidationErrorType): number;
/**
 * Intent represents a high-level user intention that requires semantic validation
 * beyond simple delegation scope checking
 */
export interface Intent {
    /** Unique identifier for this intent */
    intentId: string;
    /** The delegation that grants authority for this intent */
    delegationId: string;
    /** User who created this intent (must match delegation delegator) */
    userAddress: string;
    /** High-level description of what the user intends to accomplish */
    description: string;
    /**
     * JSON Logic expression defining the validation rules for this intent
     * This will be evaluated against transaction context to determine validity
     */
    validationRules?: Any | undefined;
    /**
     * Conditions under which this intent should be executed
     * e.g., market conditions, time constraints, dependency completion
     */
    executionConditions: ExecutionCondition[];
    /**
     * Maximum value threshold - intents above this require explicit user signatures
     * Below this threshold, session key signatures are sufficient
     */
    maxValueThreshold?: string | undefined;
    /** When this intent was created */
    createdAt?: Date | undefined;
    /** When this intent expires (cannot exceed delegation expiry) */
    expiresAt?: Date | undefined;
    /** Nonce for replay protection (separate from delegation nonce) */
    intentNonce: number;
    /** Signature by user authorizing this intent */
    userSignature: string;
    /** Current status of the intent */
    status: IntentStatus;
}
/** Execution condition that must be met before intent can be executed */
export interface ExecutionCondition {
    /** Type of condition (market_price, time_condition, dependency, etc.) */
    conditionType: string;
    /**
     * JSON Logic expression defining the condition
     * Will be evaluated against current state to check if condition is met
     */
    conditionLogic?: Any | undefined;
    /** Human-readable description of the condition */
    description: string;
    /** Whether this condition has been met */
    isMet: boolean;
    /** When this condition was last evaluated */
    lastEvaluated?: Date | undefined;
}
/** Transaction executed via intent system */
export interface IntentTransaction {
    /** Reference to the intent authorizing this transaction */
    intentId: string;
    /** The actual transaction payload */
    transactionPayload?: Any | undefined;
    /** Context information used for JSON Logic validation */
    validationContext?: TransactionContext | undefined;
    /** Signature by relayer/session key (for low-value transactions) */
    relayerSignature?: string | undefined;
    /** Fallback signature by user (required for high-value transactions) */
    userSignature?: string | undefined;
    /** Nonce for transaction replay protection */
    transactionNonce: number;
    /** When transaction was created */
    createdAt?: Date | undefined;
}
/** Context information available during JSON Logic validation */
export interface TransactionContext {
    /** Current market conditions (prices, liquidity, etc.) */
    marketData: {
        [key: string]: string;
    };
    /** User's current balances and holdings */
    userBalances: {
        [key: string]: string;
    };
    /** Current time and date information */
    currentTime?: Date | undefined;
    /** Transaction amount and asset type */
    transactionAmount?: string | undefined;
    assetType?: string | undefined;
    /** Target address or fiber ID */
    target?: string | undefined;
    /** Additional custom context fields */
    customContext: {
        [key: string]: string;
    };
}
export interface TransactionContext_MarketDataEntry {
    key: string;
    value: string;
}
export interface TransactionContext_UserBalancesEntry {
    key: string;
    value: string;
}
export interface TransactionContext_CustomContextEntry {
    key: string;
    value: string;
}
/** Request to create a new intent */
export interface CreateIntentRequest {
    intent?: Intent | undefined;
}
/** Response when intent is created */
export interface CreateIntentResponse {
    intentId: string;
    success: boolean;
    errorMessage: string;
    validationErrors: IntentValidationError[];
}
/** Request to cancel an intent */
export interface CancelIntentRequest {
    intentId: string;
    userAddress: string;
    cancellationSignature: string;
    nonce: number;
}
/** Response when intent is cancelled */
export interface CancelIntentResponse {
    success: boolean;
    errorMessage: string;
}
/** Request to submit a transaction via intent */
export interface SubmitIntentTransactionRequest {
    intentTransaction?: IntentTransaction | undefined;
}
/** Response for intent transaction submission */
export interface SubmitIntentTransactionResponse {
    success: boolean;
    transactionHash: string;
    errorMessage: string;
    validationErrors: IntentValidationError[];
}
/** Detailed validation error for intent failures */
export interface IntentValidationError {
    errorType: IntentValidationErrorType;
    errorMessage: string;
    fieldPath: string;
    /** Specific JSON Logic evaluation error */
    jsonLogicError: string;
}
/** Query for intents */
export interface GetIntentsRequest {
    userAddress?: string | undefined;
    delegationId?: string | undefined;
    statusFilter?: IntentStatus | undefined;
    limit: number;
    offset: number;
}
/** Response with list of intents */
export interface GetIntentsResponse {
    intents: Intent[];
    totalCount: number;
    hasMore: boolean;
}
/** Request to evaluate intent conditions */
export interface EvaluateIntentConditionsRequest {
    intentId: string;
    currentContext?: TransactionContext | undefined;
}
/** Response with condition evaluation results */
export interface EvaluateIntentConditionsResponse {
    allConditionsMet: boolean;
    conditionResults: ConditionEvaluationResult[];
    errorMessage: string;
}
/** Result of evaluating a single condition */
export interface ConditionEvaluationResult {
    conditionType: string;
    isMet: boolean;
    /** JSON representation of evaluation */
    evaluationResult: string;
    errorMessage: string;
}
export declare const Intent: MessageFns<Intent>;
export declare const ExecutionCondition: MessageFns<ExecutionCondition>;
export declare const IntentTransaction: MessageFns<IntentTransaction>;
export declare const TransactionContext: MessageFns<TransactionContext>;
export declare const TransactionContext_MarketDataEntry: MessageFns<TransactionContext_MarketDataEntry>;
export declare const TransactionContext_UserBalancesEntry: MessageFns<TransactionContext_UserBalancesEntry>;
export declare const TransactionContext_CustomContextEntry: MessageFns<TransactionContext_CustomContextEntry>;
export declare const CreateIntentRequest: MessageFns<CreateIntentRequest>;
export declare const CreateIntentResponse: MessageFns<CreateIntentResponse>;
export declare const CancelIntentRequest: MessageFns<CancelIntentRequest>;
export declare const CancelIntentResponse: MessageFns<CancelIntentResponse>;
export declare const SubmitIntentTransactionRequest: MessageFns<SubmitIntentTransactionRequest>;
export declare const SubmitIntentTransactionResponse: MessageFns<SubmitIntentTransactionResponse>;
export declare const IntentValidationError: MessageFns<IntentValidationError>;
export declare const GetIntentsRequest: MessageFns<GetIntentsRequest>;
export declare const GetIntentsResponse: MessageFns<GetIntentsResponse>;
export declare const EvaluateIntentConditionsRequest: MessageFns<EvaluateIntentConditionsRequest>;
export declare const EvaluateIntentConditionsResponse: MessageFns<EvaluateIntentConditionsResponse>;
export declare const ConditionEvaluationResult: MessageFns<ConditionEvaluationResult>;
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
