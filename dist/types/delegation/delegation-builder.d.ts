/**
 * @fileoverview Delegation Builder for creating delegation structures
 */
import { DelegationAuthority, DelegationScope, SessionKey, SignedIntent } from '../generated/ottochain/v1/delegation.js';
import { CreateDelegationOptions, CreateSessionKeyOptions, CreateSignedIntentOptions, KeyPair as DelegationKeyPair } from './types.js';
/**
 * Builder class for creating delegation structures with proper validation
 */
export declare class DelegationBuilder {
    /**
     * Create a new delegation authority
     */
    static createDelegation(options: CreateDelegationOptions): DelegationAuthority;
    /**
     * Create a session key for delegation
     */
    static createSessionKey(options: CreateSessionKeyOptions): SessionKey;
    /**
     * Create a signed intent for delegation
     */
    static createSignedIntent(options: CreateSignedIntentOptions): SignedIntent;
    /**
     * Create a delegation scope with sensible defaults
     */
    static createScope(options: {
        fiberIds?: string[];
        allowedOperations: string[];
        maxGasPerTx?: number;
        maxTotalGas?: number;
        policyRules?: any;
    }): DelegationScope;
    /**
     * Generate a new key pair for session keys
     */
    static generateKeyPair(): DelegationKeyPair;
    /**
     * Validate a delegation structure
     */
    static validateDelegation(delegation: DelegationAuthority): string[];
    private static generateRandomHex;
}
