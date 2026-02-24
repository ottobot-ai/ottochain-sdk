/**
 * @fileoverview Utility functions for delegation management
 */
/**
 * Generate a unique delegation ID
 */
export declare function generateId(): string;
/**
 * Get current timestamp
 */
export declare function getCurrentTimestamp(): Date;
/**
 * Add hours to a date
 */
export declare function addHours(date: Date, hours: number): Date;
/**
 * Check if a date is expired
 */
export declare function isExpired(expiryDate: Date): boolean;
/**
 * Hash a message for signing
 */
export declare function hashMessage(message: string): string;
/**
 * Serialize delegation for signing
 */
export declare function serializeDelegationForSigning(delegation: any): string;
/**
 * Serialize session key for signing
 */
export declare function serializeSessionKeyForSigning(sessionKey: any): string;
/**
 * Serialize signed intent for signing
 */
export declare function serializeSignedIntentForSigning(signedIntent: any): string;
/**
 * Serialize revocation for signing
 */
export declare function serializeRevocationForSigning(revocation: any): string;
/**
 * Validate an Ethereum-style address
 */
export declare function isValidAddress(address: string): boolean;
/**
 * Validate a signature format
 */
export declare function isValidSignature(signature: string): boolean;
/**
 * Generate a random nonce
 */
export declare function generateNonce(): number;
/**
 * Sleep for a specified number of milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry a function with exponential backoff
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number, baseDelayMs?: number): Promise<T>;
