"use strict";
/**
 * @fileoverview Delegation Manager for high-level delegation operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegationManager = void 0;
const delegation_js_1 = require("../generated/ottochain/v1/delegation.js");
const delegation_builder_js_1 = require("./delegation-builder.js");
const utils_js_1 = require("./utils.js");
/**
 * High-level delegation management interface
 */
class DelegationManager {
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
        if (!(0, utils_js_1.isValidAddress)(options.principalAddress)) {
            throw new Error('Invalid principal address format');
        }
        if (!(0, utils_js_1.isValidAddress)(options.delegateAddress)) {
            throw new Error('Invalid delegate address format');
        }
        // Create delegation
        const delegation = delegation_builder_js_1.DelegationBuilder.createDelegation(options);
        // Sign delegation
        const messageToSign = (0, utils_js_1.serializeDelegationForSigning)(delegation);
        const hashedMessage = (0, utils_js_1.hashMessage)(messageToSign);
        const signatureResult = await signingFunction(hashedMessage);
        // Validate signature
        if (!(0, utils_js_1.isValidSignature)(signatureResult.signature)) {
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
        if ((0, utils_js_1.isExpired)(delegation.expiresAt)) {
            throw new Error(`Delegation ${options.delegationId} has expired`);
        }
        // Create session key
        const sessionKey = delegation_builder_js_1.DelegationBuilder.createSessionKey(options);
        // Sign session key authorization
        const messageToSign = (0, utils_js_1.serializeSessionKeyForSigning)(sessionKey);
        const hashedMessage = (0, utils_js_1.hashMessage)(messageToSign);
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
        if ((0, utils_js_1.isExpired)(delegation.expiresAt)) {
            throw new Error(`Delegation ${options.delegationId} has expired`);
        }
        // Create signed intent
        const signedIntent = delegation_builder_js_1.DelegationBuilder.createSignedIntent(options);
        // Sign intent
        const messageToSign = (0, utils_js_1.serializeSignedIntentForSigning)(signedIntent);
        const hashedMessage = (0, utils_js_1.hashMessage)(messageToSign);
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
            nonce: (0, utils_js_1.generateNonce)(),
            revokedAt: new Date(),
            revocationSignature: ''
        };
        // Sign revocation
        const messageToSign = (0, utils_js_1.serializeRevocationForSigning)(revocation);
        const hashedMessage = (0, utils_js_1.hashMessage)(messageToSign);
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
        const createMessage = delegation_js_1.CreateDelegation.create({ delegation });
        await this.submitToBridge('/delegation/create', createMessage);
    }
    /**
     * Submit session key to bridge
     */
    async submitSessionKey(sessionKey) {
        const registerMessage = delegation_js_1.RegisterSessionKey.create({ sessionKey });
        await this.submitToBridge('/delegation/session-key', registerMessage);
    }
    /**
     * Submit signed intent to bridge
     */
    async submitSignedIntent(signedIntent) {
        const submitMessage = delegation_js_1.SubmitSignedIntent.create({ signedIntent });
        await this.submitToBridge('/delegation/signed-intent', submitMessage);
    }
    /**
     * Submit revocation to bridge
     */
    async submitRevocation(revocation) {
        const revokeMessage = delegation_js_1.RevokeDelegation.create({ revocation });
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
                const isValid = !(0, utils_js_1.isExpired)(localDelegation.expiresAt);
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
            if (!(0, utils_js_1.isExpired)(delegation.expiresAt)) {
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
            if ((0, utils_js_1.isExpired)(delegation.expiresAt)) {
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
            if (sessionKey.sessionExpiresAt && (0, utils_js_1.isExpired)(sessionKey.sessionExpiresAt)) {
                this.sessionKeys.delete(id);
            }
        }
        // Clean up expired signed intents
        for (const [key, intent] of this.signedIntents.entries()) {
            if (intent.intentExpiresAt && (0, utils_js_1.isExpired)(intent.intentExpiresAt)) {
                this.signedIntents.delete(key);
            }
        }
    }
    async submitToBridge(path, data) {
        return (0, utils_js_1.retryWithBackoff)(async () => {
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
exports.DelegationManager = DelegationManager;
