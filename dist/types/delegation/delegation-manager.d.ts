/**
 * @fileoverview Delegation Manager for high-level delegation operations
 */
import { DelegationAuthority, DelegationRevocation, SessionKey, SignedIntent } from '../generated/ottochain/v1/delegation.js';
import { CreateDelegationOptions, CreateSessionKeyOptions, CreateSignedIntentOptions, DelegationStatus, DelegationConfig as DelegationManagerConfig, SignatureResult } from './types.js';
/**
 * High-level delegation management interface
 */
export declare class DelegationManager {
    private config;
    private activeDelegations;
    private sessionKeys;
    private signedIntents;
    constructor(config: DelegationManagerConfig);
    /**
     * Create and sign a new delegation
     */
    createDelegation(options: CreateDelegationOptions, signingFunction: (message: string) => Promise<SignatureResult>): Promise<DelegationAuthority>;
    /**
     * Create and sign a session key
     */
    createSessionKey(options: CreateSessionKeyOptions, signingFunction: (message: string) => Promise<SignatureResult>): Promise<SessionKey>;
    /**
     * Create and sign a signed intent
     */
    createSignedIntent(options: CreateSignedIntentOptions, signingFunction: (message: string) => Promise<SignatureResult>): Promise<SignedIntent>;
    /**
     * Revoke a delegation
     */
    revokeDelegation(delegationId: string, reason: string | undefined, signingFunction: (message: string) => Promise<SignatureResult>): Promise<DelegationRevocation>;
    /**
     * Submit delegation to bridge
     */
    submitDelegation(delegation: DelegationAuthority): Promise<void>;
    /**
     * Submit session key to bridge
     */
    submitSessionKey(sessionKey: SessionKey): Promise<void>;
    /**
     * Submit signed intent to bridge
     */
    submitSignedIntent(signedIntent: SignedIntent): Promise<void>;
    /**
     * Submit revocation to bridge
     */
    submitRevocation(revocation: DelegationRevocation): Promise<void>;
    /**
     * Get delegation status
     */
    getDelegationStatus(delegationId: string): Promise<DelegationStatus>;
    /**
     * List all active delegations
     */
    getActiveDelegations(): DelegationAuthority[];
    /**
     * Get session key for a delegation
     */
    getSessionKey(delegationId: string): SessionKey | undefined;
    /**
     * Get all signed intents for a delegation
     */
    getSignedIntents(delegationId: string): SignedIntent[];
    /**
     * Clear expired delegations and associated data
     */
    cleanup(): void;
    private submitToBridge;
    private queryBridge;
}
