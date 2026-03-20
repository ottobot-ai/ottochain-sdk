"use strict";
/**
 * OttoChain SDK Delegation Management Client
 *
 * Provides high-level methods for creating, signing, and managing delegations.
 * This is the main entry point for delegation operations in the SDK.
 *
 * Features:
 * - Session key creation and management
 * - Intent signing and validation
 * - Delegation creation and revocation
 * - Status checking and monitoring
 * - Integration with bridge API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegationHelpers = exports.DelegationClient = void 0;
const delegation_js_1 = require("../generated/ottochain/apps/delegation/v1/delegation.js");
/**
 * Main delegation management client
 */
class DelegationClient {
    // Note: Validation and revocation clients temporarily disabled due to TypeScript issues
    // private validationClient?: DelegationValidationClient;
    // private revocationClient?: RevocationClient;
    constructor(config) {
        this.config = {
            timeout: 30000,
            retries: 3,
            enableValidation: true,
            enableRevocationMonitoring: true,
            ...config
        };
        // Validation and revocation clients temporarily disabled
        // Will be re-enabled when underlying clients are fixed
        if (this.config.enableValidation) {
            console.warn('Validation client temporarily unavailable - performing basic validation only');
        }
        if (this.config.enableRevocationMonitoring) {
            console.warn('Revocation monitoring temporarily unavailable');
        }
    }
    /**
     * Create a new session key delegation
     */
    async createSessionKey(delegatorAddress, options, userSignature, nonce) {
        const expiryHours = Math.min(options.expiryHours || 24, 24);
        const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
        const delegation = {
            delegationId: this.generateDelegationId(),
            delegatorAddress,
            delegateAddress: options.delegateAddress,
            sessionKey: {
                sessionKeyId: this.generateSessionKeyId(),
                publicKey: '', // Will be filled by bridge service
                createdAt: new Date(),
                expiresAt,
                isActive: true,
            },
            scope: options.scope,
            createdAt: new Date(),
            expiresAt,
            status: delegation_js_1.DelegationStatus.DELEGATION_STATUS_ACTIVE,
            nonce,
            userSignature,
        };
        const request = {
            delegation,
        };
        const response = await this.callBridgeAPI('/api/v1/delegations', 'POST', request);
        const createResponse = response;
        // Revocation monitoring will be available when client is fixed
        if (this.config.enableRevocationMonitoring && options.autoRevoke && createResponse.success) {
            console.log(`Revocation monitoring requested for delegation ${createResponse.delegationId}`);
        }
        return createResponse;
    }
    /**
     * Sign an intent using a session key
     */
    async signIntent(userAddress, options, sessionKeyPrivateKey) {
        // Basic validation (enhanced validation available when validation client is fixed)
        if (this.config.enableValidation) {
            if (!options.delegationId) {
                throw new Error('Delegation ID is required for intent signing');
            }
            // Additional validation would be performed by DelegationValidationClient
            console.log('Performing basic delegation validation for intent signing');
        }
        // Create intent with proper validation rules
        const intent = {
            ...options.intent,
            delegationId: options.delegationId,
            userAddress,
            createdAt: new Date(),
        };
        // Sign the intent using session key
        const signedIntent = await this.signIntentWithSessionKey(intent, sessionKeyPrivateKey);
        const request = {
            intent: signedIntent,
        };
        const response = await this.callBridgeAPI('/api/v1/intents', 'POST', request);
        return response;
    }
    /**
     * Revoke a delegation
     */
    async revokeDelegation(delegationId, userAddress, reason, revocationSignature, nonce) {
        const request = {
            delegationId,
            userAddress,
            revocationSignature,
            nonce,
            reason,
        };
        const response = await this.callBridgeAPI('/api/v1/delegations/revoke', 'POST', request);
        // Note: Revocation status will be updated on next check
        // The RevocationClient doesn't have a direct cache invalidation method
        return response;
    }
    /**
     * Get delegations with filtering
     */
    async getDelegations(filters) {
        const queryParams = new URLSearchParams();
        if (filters.delegatorAddress)
            queryParams.set('delegator_address', filters.delegatorAddress);
        if (filters.delegateAddress)
            queryParams.set('delegate_address', filters.delegateAddress);
        if (filters.statusFilter)
            queryParams.set('status', filters.statusFilter);
        if (filters.limit)
            queryParams.set('limit', filters.limit.toString());
        if (filters.offset)
            queryParams.set('offset', filters.offset.toString());
        const url = `/api/v1/delegations?${queryParams.toString()}`;
        const response = await this.callBridgeAPI(url, 'GET');
        return response;
    }
    /**
     * Check delegation status with detailed information
     */
    async checkDelegationStatus(delegationId) {
        const delegationsResponse = await this.getDelegations({
            limit: 1,
            offset: 0
        });
        const delegation = delegationsResponse.delegations.find(d => d.delegationId === delegationId);
        if (!delegation) {
            return {
                delegation: {},
                isValid: false,
                errors: ['Delegation not found'],
            };
        }
        // Check if delegation is still valid
        const now = Date.now();
        const expiryTime = delegation.expiresAt ? delegation.expiresAt.getTime() : 0;
        const isExpired = now >= expiryTime;
        const isRevoked = delegation.status === delegation_js_1.DelegationStatus.DELEGATION_STATUS_REVOKED;
        let isValid = !isExpired && !isRevoked && delegation.status === delegation_js_1.DelegationStatus.DELEGATION_STATUS_ACTIVE;
        // Revocation status checking available when RevocationClient is fixed
        if (this.config.enableRevocationMonitoring) {
            console.log('Revocation status check requested - using basic delegation status only');
            // Enhanced revocation checking would be performed by RevocationClient
        }
        const timeRemaining = isExpired ? 0 : Math.floor((expiryTime - now) / 1000);
        const errors = [];
        if (isExpired)
            errors.push('Delegation has expired');
        if (isRevoked)
            errors.push('Delegation has been revoked');
        if (delegation.status !== delegation_js_1.DelegationStatus.DELEGATION_STATUS_ACTIVE) {
            errors.push(`Delegation status: ${delegation.status}`);
        }
        return {
            delegation,
            isValid,
            timeRemaining,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    /**
     * Validate a delegated transaction
     */
    async validateDelegatedTransaction(transaction) {
        if (!this.config.enableValidation) {
            throw new Error('Validation is disabled in this client configuration');
        }
        // Basic validation
        const errors = [];
        if (!transaction.delegationId)
            errors.push('Missing delegation ID');
        if (!transaction.sessionKeyId)
            errors.push('Missing session key ID');
        if (!transaction.operation)
            errors.push('Missing operation');
        const response = {
            isValid: errors.length === 0,
            validationErrors: errors.map(msg => ({
                errorType: delegation_js_1.DelegationValidationErrorType.DELEGATION_VALIDATION_ERROR_SCOPE_VIOLATION,
                errorMessage: msg,
                fieldPath: '',
            }))
        };
        return response;
    }
    /**
     * Get all active delegations for a user
     */
    async getActiveDelegations(userAddress, asDelegate = false) {
        const filters = {
            statusFilter: delegation_js_1.DelegationStatus.DELEGATION_STATUS_ACTIVE,
            limit: 100,
            offset: 0,
        };
        if (asDelegate) {
            filters.delegateAddress = userAddress;
        }
        else {
            filters.delegatorAddress = userAddress;
        }
        const response = await this.getDelegations(filters);
        return response.delegations;
    }
    /**
     * Batch revoke multiple delegations
     */
    async batchRevokeDelegations(delegationIds, userAddress, reason, revocationSignature, nonce) {
        const results = [];
        for (const delegationId of delegationIds) {
            try {
                const result = await this.revokeDelegation(delegationId, userAddress, reason, revocationSignature, nonce + results.length);
                results.push(result);
            }
            catch (error) {
                results.push({
                    success: false,
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return results;
    }
    // Private helper methods
    generateDelegationId() {
        return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSessionKeyId() {
        return `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async signIntentWithSessionKey(intent, sessionKeyPrivateKey) {
        // This would integrate with the actual cryptographic signing
        // For now, we'll add placeholder signature
        return {
            ...intent,
            userSignature: this.createSignature(intent, sessionKeyPrivateKey),
        };
    }
    createSignature(data, privateKey) {
        // Placeholder for actual cryptographic signing
        // In a real implementation, this would use the constellation network's signing library
        const dataString = JSON.stringify(data);
        // Note: privateKey would be used in actual implementation
        return `sig_${Buffer.from(dataString + privateKey.slice(-8)).toString('base64').slice(0, 32)}`;
    }
    async callBridgeAPI(path, method, body) {
        const url = `${this.config.bridgeUrl}${path}`;
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        const options = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        };
        let lastError = null;
        for (let attempt = 0; attempt < (this.config.retries || 3); attempt++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return await response.json();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                if (attempt < (this.config.retries || 3) - 1) {
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        throw lastError || new Error('Max retries exceeded');
    }
}
exports.DelegationClient = DelegationClient;
/**
 * Helper functions for delegation management
 */
class DelegationHelpers {
    /**
     * Create a basic delegation scope for simple transfers
     */
    static createTransferScope(maxTransactionAmount, maxTotalAmount, allowedContracts) {
        return {
            allowedOperations: ['transfer'],
            allowedContracts: allowedContracts || [],
            maxTransactionAmount,
            maxTotalAmount,
        };
    }
    /**
     * Create a delegation scope for market operations
     */
    static createMarketScope(maxTransactionAmount, maxTotalAmount, minReputationScore) {
        return {
            allowedOperations: ['create_market', 'place_bet', 'claim_winnings'],
            allowedContracts: [],
            maxTransactionAmount,
            maxTotalAmount,
            minReputationScore,
        };
    }
    /**
     * Create a delegation scope for governance operations
     */
    static createGovernanceScope(minReputationScore) {
        return {
            allowedOperations: ['vote', 'delegate_vote', 'create_proposal'],
            allowedContracts: [],
            minReputationScore,
        };
    }
    /**
     * Validate a delegation scope
     */
    static validateScope(scope) {
        const errors = [];
        if (scope.allowedOperations.length === 0) {
            errors.push('At least one allowed operation must be specified');
        }
        if (scope.maxTransactionAmount && scope.maxTotalAmount) {
            const maxTx = parseFloat(scope.maxTransactionAmount);
            const maxTotal = parseFloat(scope.maxTotalAmount);
            if (maxTx > maxTotal) {
                errors.push('Max transaction amount cannot exceed max total amount');
            }
        }
        if (scope.minReputationScore && scope.minReputationScore < 0) {
            errors.push('Minimum reputation score cannot be negative');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.DelegationHelpers = DelegationHelpers;
