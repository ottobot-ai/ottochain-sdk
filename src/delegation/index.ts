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

// Main delegation client (note: uses optional validation/revocation clients)
export { DelegationClient, DelegationHelpers } from './delegation-client.js';

// Validation and revocation clients are available but not re-exported 
// to avoid conflicts with existing SDK validation
// import { ValidationClient } from './validation-client.js';
// import { RevocationClient } from './revocation-client.js';

// Generated types
export type {
  // Core delegation types
  Delegation,
  SessionKey,
  DelegationScope,
  DelegatedTransaction,
  DelegationStatus,
  
  // Request/Response types
  CreateDelegationRequest,
  CreateDelegationResponse,
  RevokeDelegationRequest,
  RevokeDelegationResponse,
  GetDelegationsRequest,
  GetDelegationsResponse,
  ValidateDelegatedTransactionRequest,
  ValidateDelegatedTransactionResponse,
  DelegationValidationError,
  DelegationValidationErrorType,
} from '../generated/ottochain/apps/delegation/v1/delegation.js';

export type {
  Intent,
  IntentStatus,
  ExecutionCondition,
  IntentTransaction,
  TransactionContext,
  CreateIntentRequest,
  CreateIntentResponse,
  CancelIntentRequest,
  CancelIntentResponse,
  SubmitIntentTransactionRequest,
  SubmitIntentTransactionResponse,
  IntentValidationError,
  IntentValidationErrorType,
  GetIntentsRequest,
  GetIntentsResponse,
  EvaluateIntentConditionsRequest,
  EvaluateIntentConditionsResponse,
  ConditionEvaluationResult,
} from '../generated/ottochain/apps/delegation/v1/intents.js';

// Client configuration types
export type {
  DelegationClientConfig,
  CreateSessionKeyOptions,
  SignIntentOptions,
  DelegationStatusInfo,
} from './delegation-client.js';

/**
 * Delegation utilities and constants
 */
export const DELEGATION_CONSTANTS = {
  // Maximum delegation duration (24 hours in milliseconds)
  MAX_DELEGATION_DURATION_MS: 24 * 60 * 60 * 1000,
  
  // Default delegation duration (1 hour in milliseconds)
  DEFAULT_DELEGATION_DURATION_MS: 60 * 60 * 1000,
  
  // Maximum session key lifetime
  MAX_SESSION_KEY_LIFETIME_MS: 24 * 60 * 60 * 1000,
  
  // Default validation timeout
  DEFAULT_VALIDATION_TIMEOUT_MS: 30 * 1000,
  
  // Default revocation cache TTL
  DEFAULT_REVOCATION_CACHE_TTL_MS: 60 * 1000,
  
  // Common operation types
  OPERATIONS: {
    TRANSFER: 'transfer',
    CREATE_MARKET: 'create_market',
    PLACE_BET: 'place_bet',
    CLAIM_WINNINGS: 'claim_winnings',
    VOTE: 'vote',
    DELEGATE_VOTE: 'delegate_vote',
    CREATE_PROPOSAL: 'create_proposal',
    SIGN_INTENT: 'sign_intent',
  },
  
  // Validation error messages
  VALIDATION_ERRORS: {
    DELEGATION_NOT_FOUND: 'Delegation not found',
    DELEGATION_EXPIRED: 'Delegation has expired',
    DELEGATION_REVOKED: 'Delegation has been revoked',
    SCOPE_VIOLATION: 'Operation not allowed by delegation scope',
    SPENDING_LIMIT_EXCEEDED: 'Transaction exceeds spending limits',
    REPUTATION_TOO_LOW: 'Delegate reputation below minimum requirement',
    INVALID_SIGNATURE: 'Invalid signature provided',
    SESSION_KEY_EXPIRED: 'Session key has expired',
    SESSION_KEY_INACTIVE: 'Session key is not active',
  },
} as const;

/**
 * Delegation error classes for structured error handling
 */
export class DelegationError extends Error {
  constructor(
    message: string,
    public readonly code: keyof typeof DELEGATION_CONSTANTS.VALIDATION_ERRORS,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'DelegationError';
  }
}

export class DelegationScopeError extends DelegationError {
  constructor(message: string, details?: any) {
    super(message, 'SCOPE_VIOLATION', details);
    this.name = 'DelegationScopeError';
  }
}

export class RevocationError extends DelegationError {
  constructor(message: string, details?: any) {
    super(message, 'DELEGATION_REVOKED', details);
    this.name = 'RevocationError';
  }
}

export class SessionKeyError extends DelegationError {
  constructor(message: string, details?: any) {
    super(message, 'SESSION_KEY_EXPIRED', details);
    this.name = 'SessionKeyError';
  }
}