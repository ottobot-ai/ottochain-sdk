"use strict";
/**
 * @fileoverview Utility functions for delegation management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryWithBackoff = exports.sleep = exports.generateNonce = exports.isValidSignature = exports.isValidAddress = exports.serializeRevocationForSigning = exports.serializeSignedIntentForSigning = exports.serializeSessionKeyForSigning = exports.serializeDelegationForSigning = exports.hashMessage = exports.isExpired = exports.addHours = exports.getCurrentTimestamp = exports.generateId = void 0;
const crypto_1 = require("crypto");
/**
 * Generate a unique delegation ID
 */
function generateId() {
    const timestamp = Date.now().toString(36);
    const random = (0, crypto_1.randomBytes)(8).toString('hex');
    return `del_${timestamp}_${random}`;
}
exports.generateId = generateId;
/**
 * Get current timestamp
 */
function getCurrentTimestamp() {
    return new Date();
}
exports.getCurrentTimestamp = getCurrentTimestamp;
/**
 * Add hours to a date
 */
function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
}
exports.addHours = addHours;
/**
 * Check if a date is expired
 */
function isExpired(expiryDate) {
    return expiryDate <= new Date();
}
exports.isExpired = isExpired;
/**
 * Hash a message for signing
 */
function hashMessage(message) {
    return (0, crypto_1.createHash)('sha256').update(message, 'utf8').digest('hex');
}
exports.hashMessage = hashMessage;
/**
 * Serialize delegation for signing
 */
function serializeDelegationForSigning(delegation) {
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
exports.serializeDelegationForSigning = serializeDelegationForSigning;
/**
 * Serialize session key for signing
 */
function serializeSessionKeyForSigning(sessionKey) {
    const signingData = {
        delegationId: sessionKey.delegationId,
        sessionPublicKey: sessionKey.sessionPublicKey,
        sessionExpiresAt: sessionKey.sessionExpiresAt?.toISOString(),
        sessionScope: sessionKey.sessionScope
    };
    return JSON.stringify(signingData, Object.keys(signingData).sort());
}
exports.serializeSessionKeyForSigning = serializeSessionKeyForSigning;
/**
 * Serialize signed intent for signing
 */
function serializeSignedIntentForSigning(signedIntent) {
    const signingData = {
        delegationId: signedIntent.delegationId,
        transaction: signedIntent.transaction,
        intentNonce: signedIntent.intentNonce,
        intentExpiresAt: signedIntent.intentExpiresAt?.toISOString(),
        executionConditions: signedIntent.executionConditions
    };
    return JSON.stringify(signingData, Object.keys(signingData).sort());
}
exports.serializeSignedIntentForSigning = serializeSignedIntentForSigning;
/**
 * Serialize revocation for signing
 */
function serializeRevocationForSigning(revocation) {
    const signingData = {
        delegationId: revocation.delegationId,
        reason: revocation.reason,
        nonce: revocation.nonce,
        revokedAt: revocation.revokedAt?.toISOString()
    };
    return JSON.stringify(signingData, Object.keys(signingData).sort());
}
exports.serializeRevocationForSigning = serializeRevocationForSigning;
/**
 * Validate an Ethereum-style address
 */
function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
exports.isValidAddress = isValidAddress;
/**
 * Validate a signature format
 */
function isValidSignature(signature) {
    return /^0x[a-fA-F0-9]{128,132}$/.test(signature);
}
exports.isValidSignature = isValidSignature;
/**
 * Generate a random nonce
 */
function generateNonce() {
    return Math.floor(Math.random() * 1000000);
}
exports.generateNonce = generateNonce;
/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelayMs = 1000) {
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
exports.retryWithBackoff = retryWithBackoff;
