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
/**
 * Delegation Validation Client for SDK
 */
export class DelegationValidationClient {
    constructor(config) {
        this.cache = new Map();
        this.config = {
            timeout: 5000,
            retries: 3,
            enableLocalValidation: true,
            ...config
        };
    }
    /**
     * Validate a delegation operation before submission
     *
     * @param request Validation request parameters
     * @returns Validation result with detailed feedback
     */
    async validateOperation(request) {
        const start = performance.now();
        const validationId = `val_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        try {
            // Step 1: Get delegation info (with caching)
            const delegationInfo = await this.getDelegationInfo(request.delegationId);
            if (!delegationInfo) {
                return {
                    isValid: false,
                    errors: [{
                            type: 'SCOPE_VIOLATION',
                            message: 'Delegation not found or inaccessible'
                        }],
                    latencyMs: performance.now() - start,
                    validationId,
                    timestamp: Date.now()
                };
            }
            // Step 2: Local validation (if enabled)
            const errors = [];
            if (this.config.enableLocalValidation) {
                const localErrors = await this.performLocalValidation(request, delegationInfo);
                errors.push(...localErrors);
            }
            // Step 3: Remote validation via bridge API (if local validation passes)
            if (errors.length === 0) {
                const remoteErrors = await this.performRemoteValidation(request);
                errors.push(...remoteErrors);
            }
            const latencyMs = performance.now() - start;
            // Log performance if it exceeds target
            if (latencyMs > 25) {
                console.warn(`SDK validation took ${latencyMs.toFixed(2)}ms (target: <25ms for local validation)`);
            }
            return {
                isValid: errors.length === 0,
                errors: errors.length > 0 ? errors : undefined,
                latencyMs,
                validationId,
                timestamp: Date.now()
            };
        }
        catch (error) {
            console.error('Delegation validation failed:', error);
            return {
                isValid: false,
                errors: [{
                        type: 'SIGNATURE_INVALID',
                        message: error instanceof Error ? error.message : 'Unknown validation error',
                        details: { error }
                    }],
                latencyMs: performance.now() - start,
                validationId,
                timestamp: Date.now()
            };
        }
    }
    /**
     * Get delegation information with caching
     *
     * @param delegationId Delegation identifier
     * @returns Delegation info or null if not found
     */
    async getDelegationInfo(delegationId) {
        // Check cache first
        const cached = this.cache.get(delegationId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }
        try {
            const response = await fetch(`${this.config.bridgeEndpoint}/delegation/${delegationId}`, {
                method: 'GET',
                signal: typeof AbortSignal !== "undefined" && this.config.timeout ? AbortSignal.timeout(this.config.timeout) : undefined,
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Failed to fetch delegation info: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const delegationInfo = data.delegation;
            // Cache for 5 minutes
            this.cache.set(delegationId, {
                data: delegationInfo,
                expiresAt: Date.now() + 5 * 60 * 1000
            });
            return delegationInfo;
        }
        catch (error) {
            console.error(`Failed to fetch delegation info for ${delegationId}:`, error);
            return null;
        }
    }
    /**
     * Perform local validation checks
     *
     * @param request Validation request
     * @param delegationInfo Delegation information
     * @returns Array of validation errors
     */
    async performLocalValidation(request, delegationInfo) {
        const errors = [];
        const now = new Date();
        // 1. Check delegation status
        if (delegationInfo.status !== 'ACTIVE') {
            errors.push({
                type: 'DELEGATION_REVOKED',
                message: `Delegation is ${delegationInfo.status.toLowerCase()}`
            });
            return errors; // Early return for non-active delegations
        }
        // 2. Check expiry
        const expiryDate = new Date(delegationInfo.expiresAt);
        if (expiryDate <= now) {
            errors.push({
                type: 'SESSION_KEY_EXPIRED',
                message: 'Delegation has expired'
            });
        }
        // 3. Check authorized actions
        if (!delegationInfo.authorizedActions.includes(request.operation)) {
            errors.push({
                type: 'SCOPE_VIOLATION',
                message: `Operation '${request.operation}' not authorized`,
                details: {
                    operation: request.operation,
                    authorizedActions: delegationInfo.authorizedActions
                }
            });
        }
        // 4. Check scope constraints
        if (delegationInfo.scope) {
            const scopeErrors = this.validateScope(request, delegationInfo.scope);
            errors.push(...scopeErrors);
        }
        return errors;
    }
    /**
     * Validate scope constraints
     *
     * @param request Validation request
     * @param scope Delegation scope
     * @returns Array of scope validation errors
     */
    validateScope(request, scope) {
        const errors = [];
        // Check allowed operations
        if (scope.allowedOperations && !scope.allowedOperations.includes(request.operation)) {
            errors.push({
                type: 'SCOPE_VIOLATION',
                message: 'Operation not allowed by delegation scope',
                details: {
                    operation: request.operation,
                    allowedOperations: scope.allowedOperations
                }
            });
        }
        // Check allowed contracts
        if (scope.allowedContracts && request.target) {
            if (!scope.allowedContracts.includes(request.target)) {
                errors.push({
                    type: 'SCOPE_VIOLATION',
                    message: 'Target contract not allowed by delegation scope',
                    details: {
                        target: request.target,
                        allowedContracts: scope.allowedContracts
                    }
                });
            }
        }
        // Check spending limits
        if (scope.maxAmount && request.amount) {
            const usedAmount = scope.usedAmount || 0;
            if (usedAmount + request.amount > scope.maxAmount) {
                errors.push({
                    type: 'SPENDING_LIMIT_EXCEEDED',
                    message: 'Transaction would exceed spending limit',
                    details: {
                        requestAmount: request.amount,
                        usedAmount,
                        maxAmount: scope.maxAmount,
                        wouldExceedBy: (usedAmount + request.amount) - scope.maxAmount
                    }
                });
            }
        }
        // Check transaction count limits
        if (scope.maxTransactionCount) {
            const transactionCount = scope.transactionCount || 0;
            if (transactionCount >= scope.maxTransactionCount) {
                errors.push({
                    type: 'SPENDING_LIMIT_EXCEEDED',
                    message: 'Transaction count limit exceeded',
                    details: {
                        transactionCount,
                        maxTransactionCount: scope.maxTransactionCount
                    }
                });
            }
        }
        return errors;
    }
    /**
     * Perform remote validation via bridge API
     *
     * @param request Validation request
     * @returns Array of validation errors from remote validation
     */
    async performRemoteValidation(request) {
        try {
            const response = await fetch(`${this.config.bridgeEndpoint}/delegation/validate`, {
                method: 'POST',
                signal: typeof AbortSignal !== "undefined" && this.config.timeout ? AbortSignal.timeout(this.config.timeout) : undefined,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    delegationId: request.delegationId,
                    sessionKeyId: request.sessionKeyId,
                    operation: request.operation,
                    amount: request.amount,
                    target: request.target,
                    signature: request.signature,
                    nonce: request.nonce,
                    timestamp: Date.now()
                })
            });
            if (response.ok) {
                // Remote validation passed
                return [];
            }
            // Parse error response
            const errorData = await response.json();
            return [{
                    type: this.mapRemoteErrorType(errorData.errorType),
                    message: errorData.error || 'Remote validation failed',
                    details: errorData
                }];
        }
        catch (error) {
            console.error('Remote validation failed:', error);
            return [{
                    type: 'SIGNATURE_INVALID',
                    message: 'Failed to connect to validation service',
                    details: { error }
                }];
        }
    }
    /**
     * Map remote error types to local error types
     */
    mapRemoteErrorType(remoteType) {
        const mapping = {
            'SESSION_KEY_EXPIRED': 'SESSION_KEY_EXPIRED',
            'DELEGATION_REVOKED': 'DELEGATION_REVOKED',
            'SCOPE_VIOLATION': 'SCOPE_VIOLATION',
            'SPENDING_LIMIT_EXCEEDED': 'SPENDING_LIMIT_EXCEEDED',
            'REPUTATION_TOO_LOW': 'REPUTATION_TOO_LOW',
            'SIGNATURE_INVALID': 'SIGNATURE_INVALID'
        };
        return mapping[remoteType || ''] || 'SIGNATURE_INVALID';
    }
    /**
     * Submit a pre-validated delegation transaction
     *
     * @param request Transaction request
     * @returns Transaction result
     */
    async submitDelegatedTransaction(request) {
        // Pre-validate before submission
        const validationResult = await this.validateOperation({
            delegationId: request.delegationId,
            sessionKeyId: request.sessionKeyId,
            operation: request.transaction.type,
            amount: request.transaction.payload?.amount,
            target: request.transaction.target,
            signature: request.signature,
            nonce: request.nonce
        });
        if (!validationResult.isValid) {
            return {
                success: false,
                error: validationResult.errors?.[0]?.message || 'Validation failed',
                validationLatency: validationResult.latencyMs
            };
        }
        try {
            const response = await fetch(`${this.config.bridgeEndpoint}/delegation/submit`, {
                method: 'POST',
                signal: typeof AbortSignal !== "undefined" && this.config.timeout ? AbortSignal.timeout(this.config.timeout) : undefined,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    delegationId: request.delegationId,
                    transaction: request.transaction,
                    sessionKeyId: request.sessionKeyId,
                    relayerSignature: request.signature,
                    nonce: request.nonce
                })
            });
            const data = await response.json();
            if (response.ok) {
                return {
                    success: true,
                    transactionHash: data.transactionHash,
                    validationLatency: validationResult.latencyMs
                };
            }
            else {
                return {
                    success: false,
                    error: data.error || 'Transaction submission failed',
                    validationLatency: validationResult.latencyMs
                };
            }
        }
        catch (error) {
            console.error('Transaction submission failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown submission error',
                validationLatency: validationResult.latencyMs
            };
        }
    }
    /**
     * Clear delegation cache (useful for testing or forced refresh)
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics for monitoring
     */
    getCacheStats() {
        const now = Date.now();
        let activeEntries = 0;
        let expiredEntries = 0;
        for (const value of this.cache.values()) {
            if (value.expiresAt > now) {
                activeEntries++;
            }
            else {
                expiredEntries++;
            }
        }
        return {
            totalEntries: this.cache.size,
            activeEntries,
            expiredEntries,
            cacheHitRate: this.cache.size > 0 ? activeEntries / this.cache.size : 0
        };
    }
}
/**
 * Create a delegation validation client with default configuration
 */
export function createDelegationValidationClient(bridgeEndpoint, options) {
    return new DelegationValidationClient({
        bridgeEndpoint,
        ...options
    });
}
/**
 * Type guards for validation responses
 */
export function isValidationSuccess(response) {
    return response.isValid && !response.errors;
}
export function isValidationError(response) {
    return !response.isValid && !!response.errors;
}
