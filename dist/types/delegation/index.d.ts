/**
 * OttoChain SDK Delegation Module
 *
 * Complete delegation management system for OttoChain agents and users.
 * Provides session key delegation, intent signing, and transaction validation.
 *
 * @example
 * ```typescript
 * import { DelegationClient, DelegationHelpers } from '@ottochain/sdk/delegation';
 *
 * const client = new DelegationClient({
 *   bridgeUrl: 'https://bridge.ottochain.xyz',
 *   enableValidation: true,
 *   enableRevocationMonitoring: true,
 * });
 *
 * // Create a session key delegation
 * const scope = DelegationHelpers.createTransferScope('1000', '5000');
 * const delegation = await client.createSessionKey(
 *   userAddress,
 *   { delegateAddress: agentAddress, scope },
 *   userSignature,
 *   nonce
 * );
 *
 * // Sign an intent
 * const intent = await client.signIntent(
 *   userAddress,
 *   { delegationId: delegation.delegationId, intent: myIntent },
 *   sessionKeyPrivateKey
 * );
 * ```
 */
export { DelegationClient, DelegationHelpers } from './delegation-client.js';
export type { Delegation, SessionKey, DelegationScope, DelegatedTransaction, DelegationStatus, CreateDelegationRequest, CreateDelegationResponse, RevokeDelegationRequest, RevokeDelegationResponse, GetDelegationsRequest, GetDelegationsResponse, ValidateDelegatedTransactionRequest, ValidateDelegatedTransactionResponse, DelegationValidationError, DelegationValidationErrorType, } from '../generated/ottochain/apps/delegation/v1/delegation.js';
export type { Intent, IntentStatus, ExecutionCondition, IntentTransaction, TransactionContext, CreateIntentRequest, CreateIntentResponse, CancelIntentRequest, CancelIntentResponse, SubmitIntentTransactionRequest, SubmitIntentTransactionResponse, IntentValidationError, IntentValidationErrorType, GetIntentsRequest, GetIntentsResponse, EvaluateIntentConditionsRequest, EvaluateIntentConditionsResponse, ConditionEvaluationResult, } from '../generated/ottochain/apps/delegation/v1/intents.js';
export type { DelegationClientConfig, CreateSessionKeyOptions, SignIntentOptions, DelegationStatusInfo, } from './delegation-client.js';
/**
 * Delegation utilities and constants
 */
export declare const DELEGATION_CONSTANTS: {
    readonly MAX_DELEGATION_DURATION_MS: number;
    readonly DEFAULT_DELEGATION_DURATION_MS: number;
    readonly MAX_SESSION_KEY_LIFETIME_MS: number;
    readonly DEFAULT_VALIDATION_TIMEOUT_MS: number;
    readonly DEFAULT_REVOCATION_CACHE_TTL_MS: number;
    readonly OPERATIONS: {
        readonly TRANSFER: "transfer";
        readonly CREATE_MARKET: "create_market";
        readonly PLACE_BET: "place_bet";
        readonly CLAIM_WINNINGS: "claim_winnings";
        readonly VOTE: "vote";
        readonly DELEGATE_VOTE: "delegate_vote";
        readonly CREATE_PROPOSAL: "create_proposal";
        readonly SIGN_INTENT: "sign_intent";
    };
    readonly VALIDATION_ERRORS: {
        readonly DELEGATION_NOT_FOUND: "Delegation not found";
        readonly DELEGATION_EXPIRED: "Delegation has expired";
        readonly DELEGATION_REVOKED: "Delegation has been revoked";
        readonly SCOPE_VIOLATION: "Operation not allowed by delegation scope";
        readonly SPENDING_LIMIT_EXCEEDED: "Transaction exceeds spending limits";
        readonly REPUTATION_TOO_LOW: "Delegate reputation below minimum requirement";
        readonly INVALID_SIGNATURE: "Invalid signature provided";
        readonly SESSION_KEY_EXPIRED: "Session key has expired";
        readonly SESSION_KEY_INACTIVE: "Session key is not active";
    };
};
/**
 * Delegation error classes for structured error handling
 */
export declare class DelegationError extends Error {
    readonly code: keyof typeof DELEGATION_CONSTANTS.VALIDATION_ERRORS;
    readonly details?: any;
    constructor(message: string, code: keyof typeof DELEGATION_CONSTANTS.VALIDATION_ERRORS, details?: any);
}
export declare class DelegationScopeError extends DelegationError {
    constructor(message: string, details?: any);
}
export declare class RevocationError extends DelegationError {
    constructor(message: string, details?: any);
}
export declare class SessionKeyError extends DelegationError {
    constructor(message: string, details?: any);
}
