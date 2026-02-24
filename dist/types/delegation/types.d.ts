/**
 * @fileoverview SDK-specific delegation types and interfaces
 */
import { DelegationScope, DelegationApproach, FeePaymentMethod } from '../generated/ottochain/v1/delegation.js';
/** Options for creating a new delegation */
export interface CreateDelegationOptions {
    /** Principal (user) address granting the delegation */
    principalAddress: string;
    /** Delegate (relayer) address receiving the authority */
    delegateAddress: string;
    /** Delegation scope and permissions */
    scope: DelegationScope;
    /** Delegation approach (session key or signed intent) */
    approach: DelegationApproach;
    /** Expiry time for the delegation (default: 1 hour) */
    expiresAt?: Date;
    /** Optional metadata */
    metadata?: Record<string, any>;
}
/** Options for creating a session key */
export interface CreateSessionKeyOptions {
    /** Delegation ID this session key belongs to */
    delegationId: string;
    /** Generated session key pair */
    sessionKeyPair: {
        publicKey: string;
        privateKey: string;
    };
    /** Session-specific scope restrictions (optional) */
    sessionScope?: DelegationScope;
    /** Session expiry (must be <= delegation expiry) */
    sessionExpiresAt?: Date;
}
/** Options for creating a signed intent */
export interface CreateSignedIntentOptions {
    /** Delegation ID this intent belongs to */
    delegationId: string;
    /** The transaction to pre-authorize */
    transaction: Record<string, any>;
    /** Intent expiry timestamp */
    intentExpiresAt?: Date;
    /** Execution conditions (JSON Logic) */
    executionConditions?: any;
}
/** Options for submitting a relayed transaction */
export interface SubmitRelayedTransactionOptions {
    /** The original transaction to execute */
    transaction: Record<string, any>;
    /** Delegation proof (session key or signed intent) */
    delegationProof: {
        type: 'session_key' | 'signed_intent';
        proof: any;
    };
    /** Gas configuration */
    gasConfig?: {
        gasLimit: number;
        gasPrice?: number;
        paymentMethod: FeePaymentMethod;
    };
    /** Relayer address */
    relayerAddress: string;
}
/** Delegation status information */
export interface DelegationStatus {
    /** Delegation ID */
    delegationId: string;
    /** Current status */
    status: 'active' | 'expired' | 'revoked' | 'invalid';
    /** Whether the delegation is currently usable */
    isValid: boolean;
    /** Delegation details */
    delegation?: any;
    /** Error message if invalid */
    error?: string;
}
/** Key pair for cryptographic operations */
export interface KeyPair {
    publicKey: string;
    privateKey: string;
}
/** Signature result */
export interface SignatureResult {
    signature: string;
    publicKey: string;
}
/** SDK configuration for delegation operations */
export interface DelegationConfig {
    /** Bridge API base URL */
    bridgeUrl: string;
    /** Default gas configuration */
    defaultGasConfig?: {
        gasLimit: number;
        gasPrice?: number;
        paymentMethod: FeePaymentMethod;
    };
    /** HTTP timeout in milliseconds */
    timeout?: number;
}
