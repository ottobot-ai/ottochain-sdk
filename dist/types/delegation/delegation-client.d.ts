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
import { Delegation, SessionKey, DelegationScope, DelegatedTransaction, DelegationStatus, CreateDelegationRequest, CreateDelegationResponse, RevokeDelegationRequest, RevokeDelegationResponse, GetDelegationsRequest, GetDelegationsResponse, ValidateDelegatedTransactionResponse } from '../generated/ottochain/apps/delegation/v1/delegation.js';
import { Intent, CreateIntentRequest, CreateIntentResponse } from '../generated/ottochain/apps/delegation/v1/intents.js';
export interface DelegationClientConfig {
    bridgeUrl: string;
    timeout?: number;
    retries?: number;
    apiKey?: string;
    enableValidation?: boolean;
    enableRevocationMonitoring?: boolean;
}
export interface CreateSessionKeyOptions {
    delegateAddress: string;
    scope: DelegationScope;
    expiryHours?: number;
    autoRevoke?: boolean;
}
export interface SignIntentOptions {
    delegationId: string;
    intent: Intent;
    sessionKeyId?: string;
    validateBeforeSign?: boolean;
}
export interface DelegationStatusInfo {
    delegation: Delegation;
    isValid: boolean;
    timeRemaining?: number;
    spendingRemaining?: string;
    errors?: string[];
}
/**
 * Main delegation management client
 */
export declare class DelegationClient {
    private config;
    constructor(config: DelegationClientConfig);
    /**
     * Create a new session key delegation
     */
    createSessionKey(delegatorAddress: string, options: CreateSessionKeyOptions, userSignature: string, nonce: number): Promise<CreateDelegationResponse>;
    /**
     * Sign an intent using a session key
     */
    signIntent(userAddress: string, options: SignIntentOptions, sessionKeyPrivateKey: string): Promise<CreateIntentResponse>;
    /**
     * Revoke a delegation
     */
    revokeDelegation(delegationId: string, userAddress: string, reason: string, revocationSignature: string, nonce: number): Promise<RevokeDelegationResponse>;
    /**
     * Get delegations with filtering
     */
    getDelegations(filters: Partial<GetDelegationsRequest>): Promise<GetDelegationsResponse>;
    /**
     * Check delegation status with detailed information
     */
    checkDelegationStatus(delegationId: string): Promise<DelegationStatusInfo>;
    /**
     * Validate a delegated transaction
     */
    validateDelegatedTransaction(transaction: DelegatedTransaction): Promise<ValidateDelegatedTransactionResponse>;
    /**
     * Get all active delegations for a user
     */
    getActiveDelegations(userAddress: string, asDelegate?: boolean): Promise<Delegation[]>;
    /**
     * Batch revoke multiple delegations
     */
    batchRevokeDelegations(delegationIds: string[], userAddress: string, reason: string, revocationSignature: string, nonce: number): Promise<RevokeDelegationResponse[]>;
    private generateDelegationId;
    private generateSessionKeyId;
    private signIntentWithSessionKey;
    private createSignature;
    private callBridgeAPI;
}
/**
 * Helper functions for delegation management
 */
export declare class DelegationHelpers {
    /**
     * Create a basic delegation scope for simple transfers
     */
    static createTransferScope(maxTransactionAmount?: string, maxTotalAmount?: string, allowedContracts?: string[]): DelegationScope;
    /**
     * Create a delegation scope for market operations
     */
    static createMarketScope(maxTransactionAmount?: string, maxTotalAmount?: string, minReputationScore?: number): DelegationScope;
    /**
     * Create a delegation scope for governance operations
     */
    static createGovernanceScope(minReputationScore?: number): DelegationScope;
    /**
     * Validate a delegation scope
     */
    static validateScope(scope: DelegationScope): {
        isValid: boolean;
        errors: string[];
    };
}
export type { Delegation, SessionKey, DelegationScope, DelegatedTransaction, DelegationStatus, CreateDelegationRequest, CreateDelegationResponse, RevokeDelegationRequest, RevokeDelegationResponse, GetDelegationsRequest, GetDelegationsResponse, Intent, CreateIntentRequest, CreateIntentResponse, };
