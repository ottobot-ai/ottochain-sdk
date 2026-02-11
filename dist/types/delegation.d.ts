/**
 * Delegation SDK Utilities
 *
 * High-level convenience methods for creating, signing, and managing
 * delegated transactions in OttoChain.
 *
 * @packageDocumentation
 */
import { DelegationAuthority, DelegationScope, DelegationApproach, DelegationRevocation, RelayedTransaction, GasConfig, SessionKeyProof, SignedIntentProof } from './generated/ottochain/v1/delegation.js';
/**
 * Configuration for creating a delegation
 */
export interface DelegationConfig {
    /** Principal (user) DAG address */
    principalAddress: string;
    /** Delegate (relayer) DAG address */
    delegateAddress: string;
    /** Delegation scope and permissions (use combineScopes for multiple constraints) */
    scope: DelegationScope | Partial<DelegationScope>;
    /** Delegation approach (session key or signed intent) */
    approach: DelegationApproach;
    /** Expiry timestamp (Date will be converted to protobuf Timestamp) */
    expiresAt: Date;
    /** Optional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Create a delegation authority structure
 */
export declare function createDelegation(config: DelegationConfig): DelegationAuthority;
/**
 * Sign a delegation with the principal's private key
 */
export declare function signDelegation(delegation: DelegationAuthority, principalPrivateKey: string): Promise<DelegationAuthority>;
/**
 * Create a delegation revocation message
 */
export declare function revokeDelegation(delegationId: string, reason?: string): DelegationRevocation;
/**
 * Sign a delegation revocation with the principal's private key
 */
export declare function signRevocation(revocation: DelegationRevocation, principalPrivateKey: string): Promise<DelegationRevocation>;
/**
 * Submit a signed delegation revocation to the bridge
 *
 * This method submits a signed revocation to immediately invalidate
 * a delegation and prevent further use.
 */
export declare function submitRevocation(revocation: DelegationRevocation, bridgeUrl?: string): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Client-side validation of delegation
 */
export declare function isDelegationValid(delegation: DelegationAuthority): {
    valid: boolean;
    errors: string[];
};
/**
 * Verify a delegation signature
 */
export declare function verifyDelegationSignature(delegation: DelegationAuthority, principalPublicKey: string): Promise<boolean>;
/**
 * Create a relayed transaction envelope
 */
export declare function createRelayedTransaction(transaction: Record<string, unknown>, delegationProof: {
    type: 'sessionKey';
    proof: SessionKeyProof;
} | {
    type: 'signedIntent';
    proof: SignedIntentProof;
}, gasConfig: GasConfig, relayerAddress: string): RelayedTransaction;
/**
 * Submit a delegated transaction via relayer
 *
 * This method creates a relayed transaction envelope and submits it to the bridge
 * endpoint for processing. The transaction is executed with delegation authority
 * rather than direct user signing.
 */
export declare function submitDelegated(transaction: Record<string, unknown>, delegation: DelegationAuthority, bridgeUrl?: string): Promise<{
    txId: string;
    status: string;
    receipt?: unknown;
}>;
/**
 * Query delegation status from the bridge
 *
 * Retrieves the current status of a delegation, including whether it's active,
 * revoked, expired, and usage statistics.
 */
export declare function getDelegationStatus(delegationId: string, bridgeUrl?: string): Promise<{
    active: boolean;
    revoked: boolean;
    expired: boolean;
    usageCount: number;
    lastUsed?: Date;
    delegation?: DelegationAuthority;
}>;
/**
 * List active delegations for a principal address
 *
 * Retrieves all active delegations created by a user, useful for
 * delegation management and audit purposes.
 */
export declare function listDelegations(principalAddress: string, options?: {
    includeExpired?: boolean;
    includeRevoked?: boolean;
    bridgeUrl?: string;
}): Promise<Array<{
    delegation: DelegationAuthority;
    active: boolean;
    usageCount: number;
    lastUsed?: Date;
}>>;
/**
 * Create time-based delegation scope
 */
export declare function timeWindow(start: Date, end: Date): Partial<DelegationScope>;
/**
 * Create action filter for delegation scope
 */
export declare function actionFilter(allowedActions: string[]): Partial<DelegationScope>;
/**
 * Create spending limit for delegation scope
 */
export declare function amountLimit(maxAmount: number): Partial<DelegationScope>;
/**
 * Combine multiple scope constraints
 */
export declare function combineScopes(...scopes: Partial<DelegationScope>[]): DelegationScope;
