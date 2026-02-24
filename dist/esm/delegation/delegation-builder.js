/**
 * @fileoverview Delegation Builder for creating delegation structures
 */
import { DelegationAuthority, DelegationScope, DelegationApproach, SessionKey, SignedIntent } from '../generated/ottochain/v1/delegation.js';
import { generateId, getCurrentTimestamp, addHours } from './utils.js';
/**
 * Builder class for creating delegation structures with proper validation
 */
export class DelegationBuilder {
    /**
     * Create a new delegation authority
     */
    static createDelegation(options) {
        const now = getCurrentTimestamp();
        const defaultExpiry = addHours(now, 1); // 1 hour default
        // Validate inputs
        if (!options.principalAddress || !options.delegateAddress) {
            throw new Error('Principal and delegate addresses are required');
        }
        if (options.principalAddress === options.delegateAddress) {
            throw new Error('Principal and delegate addresses cannot be the same');
        }
        if (!options.scope || !options.scope.allowedOperations.length) {
            throw new Error('Delegation scope with allowed operations is required');
        }
        const expiresAt = options.expiresAt || defaultExpiry;
        if (expiresAt <= now) {
            throw new Error('Expiry time must be in the future');
        }
        return DelegationAuthority.create({
            delegationId: generateId(),
            principalAddress: options.principalAddress,
            delegateAddress: options.delegateAddress,
            scope: options.scope,
            approach: options.approach,
            expiresAt,
            nonce: Math.floor(Math.random() * 1000000),
            principalSignature: '', // Will be set by signing method
            metadata: options.metadata
        });
    }
    /**
     * Create a session key for delegation
     */
    static createSessionKey(options) {
        const now = getCurrentTimestamp();
        // Validate inputs
        if (!options.delegationId) {
            throw new Error('Delegation ID is required');
        }
        if (!options.sessionKeyPair.publicKey || !options.sessionKeyPair.privateKey) {
            throw new Error('Session key pair is required');
        }
        // Default session expiry to 30 minutes
        const defaultSessionExpiry = addHours(now, 0.5);
        const sessionExpiresAt = options.sessionExpiresAt || defaultSessionExpiry;
        if (sessionExpiresAt <= now) {
            throw new Error('Session expiry time must be in the future');
        }
        return SessionKey.create({
            delegationId: options.delegationId,
            sessionPublicKey: options.sessionKeyPair.publicKey,
            sessionExpiresAt,
            sessionScope: options.sessionScope,
            authorizationSignature: '' // Will be set by signing method
        });
    }
    /**
     * Create a signed intent for delegation
     */
    static createSignedIntent(options) {
        const now = getCurrentTimestamp();
        // Validate inputs
        if (!options.delegationId) {
            throw new Error('Delegation ID is required');
        }
        if (!options.transaction || typeof options.transaction !== 'object') {
            throw new Error('Transaction object is required');
        }
        // Default intent expiry to 15 minutes
        const defaultIntentExpiry = addHours(now, 0.25);
        const intentExpiresAt = options.intentExpiresAt || defaultIntentExpiry;
        if (intentExpiresAt <= now) {
            throw new Error('Intent expiry time must be in the future');
        }
        return SignedIntent.create({
            delegationId: options.delegationId,
            transaction: options.transaction,
            intentNonce: Math.floor(Math.random() * 1000000),
            intentExpiresAt,
            executionConditions: options.executionConditions,
            intentSignature: '' // Will be set by signing method
        });
    }
    /**
     * Create a delegation scope with sensible defaults
     */
    static createScope(options) {
        if (!options.allowedOperations.length) {
            throw new Error('At least one allowed operation is required');
        }
        return DelegationScope.create({
            fiberIds: options.fiberIds || [],
            allowedOperations: options.allowedOperations,
            maxGasPerTx: options.maxGasPerTx,
            maxTotalGas: options.maxTotalGas,
            policyRules: options.policyRules
        });
    }
    /**
     * Generate a new key pair for session keys
     */
    static generateKeyPair() {
        // In a real implementation, this would use a proper crypto library
        // For now, returning placeholder values
        const privateKey = this.generateRandomHex(64);
        const publicKey = this.generateRandomHex(66); // Compressed public key
        return {
            privateKey,
            publicKey
        };
    }
    /**
     * Validate a delegation structure
     */
    static validateDelegation(delegation) {
        const errors = [];
        if (!delegation.delegationId) {
            errors.push('Delegation ID is required');
        }
        if (!delegation.principalAddress) {
            errors.push('Principal address is required');
        }
        if (!delegation.delegateAddress) {
            errors.push('Delegate address is required');
        }
        if (delegation.principalAddress === delegation.delegateAddress) {
            errors.push('Principal and delegate addresses cannot be the same');
        }
        if (!delegation.scope) {
            errors.push('Delegation scope is required');
        }
        else {
            if (!delegation.scope.allowedOperations.length) {
                errors.push('At least one allowed operation is required');
            }
        }
        if (!delegation.expiresAt) {
            errors.push('Expiry time is required');
        }
        else if (delegation.expiresAt <= new Date()) {
            errors.push('Delegation has expired');
        }
        if (delegation.approach === DelegationApproach.DELEGATION_APPROACH_UNSPECIFIED) {
            errors.push('Delegation approach must be specified');
        }
        return errors;
    }
    static generateRandomHex(length) {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return '0x' + result;
    }
}
