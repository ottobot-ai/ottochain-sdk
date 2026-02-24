/**
 * @fileoverview Delegation Manager for high-level delegation operations
 */
import { CreateDelegation, RegisterSessionKey, SubmitSignedIntent, RevokeDelegation } from '../generated/ottochain/v1/delegation.js';
import { DelegationBuilder } from './delegation-builder.js';
import { serializeDelegationForSigning, serializeSessionKeyForSigning, serializeSignedIntentForSigning, serializeRevocationForSigning, hashMessage, isExpired, generateNonce, isValidAddress, isValidSignature, retryWithBackoff } from './utils.js';
/**
 * High-level delegation management interface
 */
export class DelegationManager {
    constructor(config) {
        this.activeDelegations = new Map();
        this.sessionKeys = new Map();
        this.signedIntents = new Map();
        this.config = {
            timeout: 30000,
            ...config
        };
    }
    /**
     * Create and sign a new delegation
     */
    async createDelegation(options, signingFunction) {
        // Validate addresses
        if (!isValidAddress(options.principalAddress)) {
            throw new Error('Invalid principal address format');
        }
        if (!isValidAddress(options.delegateAddress)) {
            throw new Error('Invalid delegate address format');
        }
        // Create delegation
        const delegation = DelegationBuilder.createDelegation(options);
        // Sign delegation
        const messageToSign = serializeDelegationForSigning(delegation);
        const hashedMessage = hashMessage(messageToSign);
        const signatureResult = await signingFunction(hashedMessage);
        // Validate signature
        if (!isValidSignature(signatureResult.signature)) {
            throw new Error('Invalid signature format');
        }
        // Update delegation with signature
        delegation.principalSignature = signatureResult.signature;
        // Store locally
        this.activeDelegations.set(delegation.delegationId, delegation);
        return delegation;
    }
    /**
     * Create and sign a session key
     */
    async createSessionKey(options, signingFunction) {
        // Check if delegation exists and is valid
        const delegation = this.activeDelegations.get(options.delegationId);
        if (!delegation) {
            throw new Error(`Delegation ${options.delegationId} not found`);
        }
        if (isExpired(delegation.expiresAt)) {
            throw new Error(`Delegation ${options.delegationId} has expired`);
        }
        // Create session key
        const sessionKey = DelegationBuilder.createSessionKey(options);
        // Sign session key authorization
        const messageToSign = serializeSessionKeyForSigning(sessionKey);
        const hashedMessage = hashMessage(messageToSign);
        const signatureResult = await signingFunction(hashedMessage);
        // Update session key with signature
        sessionKey.authorizationSignature = signatureResult.signature;
        // Store locally
        this.sessionKeys.set(sessionKey.delegationId, sessionKey);
        return sessionKey;
    }
    /**
     * Create and sign a signed intent
     */
    async createSignedIntent(options, signingFunction) {
        // Check if delegation exists and is valid
        const delegation = this.activeDelegations.get(options.delegationId);
        if (!delegation) {
            throw new Error(`Delegation ${options.delegationId} not found`);
        }
        if (isExpired(delegation.expiresAt)) {
            throw new Error(`Delegation ${options.delegationId} has expired`);
        }
        // Create signed intent
        const signedIntent = DelegationBuilder.createSignedIntent(options);
        // Sign intent
        const messageToSign = serializeSignedIntentForSigning(signedIntent);
        const hashedMessage = hashMessage(messageToSign);
        const signatureResult = await signingFunction(hashedMessage);
        // Update signed intent with signature
        signedIntent.intentSignature = signatureResult.signature;
        // Store locally
        const intentKey = `${signedIntent.delegationId}_${signedIntent.intentNonce}`;
        this.signedIntents.set(intentKey, signedIntent);
        return signedIntent;
    }
    /**
     * Revoke a delegation
     */
    async revokeDelegation(delegationId, reason, signingFunction) {
        // Check if delegation exists
        const delegation = this.activeDelegations.get(delegationId);
        if (!delegation) {
            throw new Error(`Delegation ${delegationId} not found`);
        }
        // Create revocation
        const revocation = {
            delegationId,
            reason,
            nonce: generateNonce(),
            revokedAt: new Date(),
            revocationSignature: ''
        };
        // Sign revocation
        const messageToSign = serializeRevocationForSigning(revocation);
        const hashedMessage = hashMessage(messageToSign);
        const signatureResult = await signingFunction(hashedMessage);
        // Update revocation with signature
        revocation.revocationSignature = signatureResult.signature;
        // Remove from active delegations
        this.activeDelegations.delete(delegationId);
        // Clean up associated session keys and intents
        this.sessionKeys.delete(delegationId);
        for (const [key, intent] of this.signedIntents.entries()) {
            if (intent.delegationId === delegationId) {
                this.signedIntents.delete(key);
            }
        }
        return revocation;
    }
    /**
     * Submit delegation to bridge
     */
    async submitDelegation(delegation) {
        const createMessage = CreateDelegation.create({ delegation });
        await this.submitToBridge('/delegation/create', createMessage);
    }
    /**
     * Submit session key to bridge
     */
    async submitSessionKey(sessionKey) {
        const registerMessage = RegisterSessionKey.create({ sessionKey });
        await this.submitToBridge('/delegation/session-key', registerMessage);
    }
    /**
     * Submit signed intent to bridge
     */
    async submitSignedIntent(signedIntent) {
        const submitMessage = SubmitSignedIntent.create({ signedIntent });
        await this.submitToBridge('/delegation/signed-intent', submitMessage);
    }
    /**
     * Submit revocation to bridge
     */
    async submitRevocation(revocation) {
        const revokeMessage = RevokeDelegation.create({ revocation });
        await this.submitToBridge('/delegation/revoke', revokeMessage);
    }
    /**
     * Get delegation status
     */
    async getDelegationStatus(delegationId) {
        try {
            const response = await this.queryBridge(`/delegation/status/${delegationId}`);
            return response;
        }
        catch (error) {
            // If not found on bridge, check local storage
            const localDelegation = this.activeDelegations.get(delegationId);
            if (localDelegation) {
                const isValid = !isExpired(localDelegation.expiresAt);
                return {
                    delegationId,
                    status: isValid ? 'active' : 'expired',
                    isValid,
                    delegation: localDelegation
                };
            }
            return {
                delegationId,
                status: 'invalid',
                isValid: false,
                error: 'Delegation not found'
            };
        }
    }
    /**
     * List all active delegations
     */
    getActiveDelegations() {
        const active = [];
        for (const delegation of this.activeDelegations.values()) {
            if (!isExpired(delegation.expiresAt)) {
                active.push(delegation);
            }
        }
        return active;
    }
    /**
     * Get session key for a delegation
     */
    getSessionKey(delegationId) {
        return this.sessionKeys.get(delegationId);
    }
    /**
     * Get all signed intents for a delegation
     */
    getSignedIntents(delegationId) {
        const intents = [];
        for (const intent of this.signedIntents.values()) {
            if (intent.delegationId === delegationId) {
                intents.push(intent);
            }
        }
        return intents;
    }
    /**
     * Clear expired delegations and associated data
     */
    cleanup() {
        for (const [id, delegation] of this.activeDelegations.entries()) {
            if (isExpired(delegation.expiresAt)) {
                this.activeDelegations.delete(id);
                this.sessionKeys.delete(id);
                // Remove associated signed intents
                for (const [key, intent] of this.signedIntents.entries()) {
                    if (intent.delegationId === id) {
                        this.signedIntents.delete(key);
                    }
                }
            }
        }
        // Clean up expired session keys
        for (const [id, sessionKey] of this.sessionKeys.entries()) {
            if (sessionKey.sessionExpiresAt && isExpired(sessionKey.sessionExpiresAt)) {
                this.sessionKeys.delete(id);
            }
        }
        // Clean up expired signed intents
        for (const [key, intent] of this.signedIntents.entries()) {
            if (intent.intentExpiresAt && isExpired(intent.intentExpiresAt)) {
                this.signedIntents.delete(key);
            }
        }
    }
    async submitToBridge(path, data) {
        return retryWithBackoff(async () => {
            const response = await fetch(`${this.config.bridgeUrl}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(this.config.timeout)
            });
            if (!response.ok) {
                throw new Error(`Bridge request failed: ${response.status} ${response.statusText}`);
            }
            return response.json();
        });
    }
    async queryBridge(path) {
        const response = await fetch(`${this.config.bridgeUrl}${path}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(this.config.timeout)
        });
        if (!response.ok) {
            throw new Error(`Bridge query failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
}
