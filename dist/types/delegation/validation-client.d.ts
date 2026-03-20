/**
 * OttoChain SDK Delegation Validation Client
 *
 * Client-side validation and security checks for delegation operations.
 * Provides efficient validation before submitting transactions to bridge API.
 *
 * Security Features:
 * - Local validation for fast feedback
 * - Cryptographic signature verification
 * - Scope enforcement checks
 * - Rate limiting and quota management
 * - Integration with bridge validation pipeline
 */
export interface DelegationValidationConfig {
    bridgeEndpoint: string;
    timeout?: number;
    retries?: number;
    enableLocalValidation?: boolean;
}
export interface ValidationRequest {
    delegationId: string;
    sessionKeyId?: string;
    operation: string;
    amount?: number;
    target?: string;
    signature?: string;
    nonce?: number;
}
export interface ValidationResponse {
    isValid: boolean;
    errors?: ValidationError[];
    latencyMs: number;
    validationId: string;
    timestamp: number;
}
export interface ValidationError {
    type: 'SESSION_KEY_EXPIRED' | 'DELEGATION_REVOKED' | 'SCOPE_VIOLATION' | 'SPENDING_LIMIT_EXCEEDED' | 'REPUTATION_TOO_LOW' | 'SIGNATURE_INVALID';
    message: string;
    details?: any;
}
export interface DelegationScope {
    allowedOperations: string[];
    allowedContracts?: string[];
    maxAmount?: number;
    maxTransactionCount?: number;
    usedAmount?: number;
    transactionCount?: number;
}
export interface DelegationInfo {
    id: string;
    delegatorAddress: string;
    relayerPublicKey: string;
    authorizedActions: string[];
    expiresAt: string;
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'EXHAUSTED';
    scope?: DelegationScope;
    minReputationScore?: number;
}
/**
 * Delegation Validation Client for SDK
 */
export declare class DelegationValidationClient {
    private config;
    private cache;
    constructor(config: DelegationValidationConfig);
    /**
     * Validate a delegation operation before submission
     *
     * @param request Validation request parameters
     * @returns Validation result with detailed feedback
     */
    validateOperation(request: ValidationRequest): Promise<ValidationResponse>;
    /**
     * Get delegation information with caching
     *
     * @param delegationId Delegation identifier
     * @returns Delegation info or null if not found
     */
    getDelegationInfo(delegationId: string): Promise<DelegationInfo | null>;
    /**
     * Perform local validation checks
     *
     * @param request Validation request
     * @param delegationInfo Delegation information
     * @returns Array of validation errors
     */
    private performLocalValidation;
    /**
     * Validate scope constraints
     *
     * @param request Validation request
     * @param scope Delegation scope
     * @returns Array of scope validation errors
     */
    private validateScope;
    /**
     * Perform remote validation via bridge API
     *
     * @param request Validation request
     * @returns Array of validation errors from remote validation
     */
    private performRemoteValidation;
    /**
     * Map remote error types to local error types
     */
    private mapRemoteErrorType;
    /**
     * Submit a pre-validated delegation transaction
     *
     * @param request Transaction request
     * @returns Transaction result
     */
    submitDelegatedTransaction(request: {
        delegationId: string;
        transaction: {
            type: string;
            payload: any;
            target?: string;
        };
        sessionKeyId?: string;
        signature: string;
        nonce?: number;
    }): Promise<{
        success: boolean;
        transactionHash?: string;
        error?: string;
        validationLatency?: number;
    }>;
    /**
     * Clear delegation cache (useful for testing or forced refresh)
     */
    clearCache(): void;
    /**
     * Get cache statistics for monitoring
     */
    getCacheStats(): {
        totalEntries: number;
        activeEntries: number;
        expiredEntries: number;
        cacheHitRate: number;
    };
}
/**
 * Create a delegation validation client with default configuration
 */
export declare function createDelegationValidationClient(bridgeEndpoint: string, options?: Partial<DelegationValidationConfig>): DelegationValidationClient;
/**
 * Type guards for validation responses
 */
export declare function isValidationSuccess(response: ValidationResponse): boolean;
export declare function isValidationError(response: ValidationResponse): response is ValidationResponse & {
    errors: ValidationError[];
};
