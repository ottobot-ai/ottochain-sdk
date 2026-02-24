/**
 * Hashing Utilities
 *
 * SHA-256 and SHA-512 hashing for the Constellation signature protocol.
 */
import { Hash } from './types.js';
/**
 * Compute SHA-256 hash of canonical JSON data
 *
 * @param data - Any JSON-serializable object
 * @returns Hash object with hex string and raw bytes
 *
 * @example
 * ```typescript
 * const hashResult = hash({ action: 'test' });
 * console.log(hashResult.value); // 64-char hex string
 * ```
 */
export declare function hash<T>(data: T): Hash;
/**
 * Compute SHA-256 hash of raw bytes
 *
 * @param bytes - Input bytes
 * @returns Hash object with hex string and raw bytes
 */
export declare function hashBytes(bytes: Uint8Array): Hash;
/**
 * Compute the full signing digest according to Constellation protocol
 *
 * Protocol:
 * 1. Serialize data to binary (with optional DataUpdate prefix)
 * 2. Compute SHA-256 hash
 * 3. Convert hash to hex string
 * 4. Treat hex string as UTF-8 bytes (NOT hex decode)
 * 5. Compute SHA-512 of those bytes
 * 6. Truncate to 32 bytes for secp256k1 signing
 *
 * @param data - Any JSON-serializable object
 * @param isDataUpdate - Whether to apply DataUpdate encoding
 * @returns 32-byte digest ready for ECDSA signing
 */
export declare function computeDigest<T>(data: T, isDataUpdate?: boolean): Uint8Array;
/**
 * Compute SHA-256 hash of data with optional DataUpdate encoding
 *
 * @param data - Any JSON-serializable object
 * @param isDataUpdate - Whether to apply DataUpdate encoding
 * @returns Hash object
 */
export declare function hashData<T>(data: T, isDataUpdate?: boolean): Hash;
