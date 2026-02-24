/**
 * @fileoverview Utility functions for delegation management
 */
import { createHash, randomBytes } from 'crypto';
/**
 * Generate a unique delegation ID
 */
export function generateId() {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString('hex');
    return `del_${timestamp}_${random}`;
}
/**
 * Get current timestamp
 */
export function getCurrentTimestamp() {
    return new Date();
}
/**
 * Add hours to a date
 */
export function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
}
/**
 * Check if a date is expired
 */
export function isExpired(expiryDate) {
    return expiryDate <= new Date();
}
/**
 * Hash a message for signing
 */
export function hashMessage(message) {
    return createHash('sha256').update(message, 'utf8').digest('hex');
}
/**
 * Serialize delegation for signing
 */
export function serializeDelegationForSigning(delegation) {
    // Create a canonical representation for signing
    const signingData = {
        delegationId: delegation.delegationId,
        principalAddress: delegation.principalAddress,
        delegateAddress: delegation.delegateAddress,
        scope: delegation.scope,
        approach: delegation.approach,
        expiresAt: delegation.expiresAt?.toISOString(),
        nonce: delegation.nonce,
        metadata: delegation.metadata
    };
    return JSON.stringify(signingData, Object.keys(signingData).sort());
}
/**
 * Serialize session key for signing
 */
export function serializeSessionKeyForSigning(sessionKey) {
    const signingData = {
        delegationId: sessionKey.delegationId,
        sessionPublicKey: sessionKey.sessionPublicKey,
        sessionExpiresAt: sessionKey.sessionExpiresAt?.toISOString(),
        sessionScope: sessionKey.sessionScope
    };
    return JSON.stringify(signingData, Object.keys(signingData).sort());
}
/**
 * Serialize signed intent for signing
 */
export function serializeSignedIntentForSigning(signedIntent) {
    const signingData = {
        delegationId: signedIntent.delegationId,
        transaction: signedIntent.transaction,
        intentNonce: signedIntent.intentNonce,
        intentExpiresAt: signedIntent.intentExpiresAt?.toISOString(),
        executionConditions: signedIntent.executionConditions
    };
    return JSON.stringify(signingData, Object.keys(signingData).sort());
}
/**
 * Serialize revocation for signing
 */
export function serializeRevocationForSigning(revocation) {
    const signingData = {
        delegationId: revocation.delegationId,
        reason: revocation.reason,
        nonce: revocation.nonce,
        revokedAt: revocation.revokedAt?.toISOString()
    };
    return JSON.stringify(signingData, Object.keys(signingData).sort());
}
/**
 * Validate an Ethereum-style address
 */
export function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
/**
 * Validate a signature format
 */
export function isValidSignature(signature) {
    return /^0x[a-fA-F0-9]{128,132}$/.test(signature);
}
/**
 * Generate a random nonce
 */
export function generateNonce() {
    return Math.floor(Math.random() * 1000000);
}
/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelayMs = 1000) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxRetries - 1) {
                throw lastError;
            }
            const delay = baseDelayMs * Math.pow(2, attempt);
            await sleep(delay);
        }
    }
    throw lastError;
}
