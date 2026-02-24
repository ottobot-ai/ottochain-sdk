/**
 * Signing Functions
 *
 * ECDSA signing using secp256k1 curve via dag4js.
 * Implements the Constellation signature protocol.
 */
import { SignatureProof } from './types.js';
/**
 * Sign data using the regular Constellation protocol (non-DataUpdate)
 *
 * Protocol:
 * 1. Canonicalize JSON (RFC 8785)
 * 2. SHA-256 hash the canonical JSON string
 * 3. Sign using dag4.keyStore.sign
 *
 * @param data - Any JSON-serializable object
 * @param privateKey - Private key in hex format
 * @returns SignatureProof with public key ID and signature
 *
 * @example
 * ```typescript
 * const proof = await sign({ action: 'test' }, privateKeyHex);
 * console.log(proof.id);        // public key (128 chars)
 * console.log(proof.signature); // DER signature
 * ```
 */
export declare function sign<T>(data: T, privateKey: string): Promise<SignatureProof>;
/**
 * Sign data as a DataUpdate (with Constellation prefix)
 *
 * Protocol:
 * 1. Canonicalize JSON (RFC 8785)
 * 2. Base64 encode the canonical JSON
 * 3. Sign using dag4.keyStore.dataSign (adds Constellation prefix internally)
 *
 * @param data - Any JSON-serializable object
 * @param privateKey - Private key in hex format
 * @returns SignatureProof
 */
export declare function signDataUpdate<T>(data: T, privateKey: string): Promise<SignatureProof>;
/**
 * Sign a pre-computed SHA-256 hash
 *
 * This is the low-level signing function. Use `sign()` or `signDataUpdate()`
 * for most use cases.
 *
 * Protocol (performed by dag4.keyStore.sign):
 * 1. Treat hashHex as UTF-8 bytes (64 ASCII characters = 64 bytes)
 * 2. SHA-512 hash those bytes (produces 64 bytes)
 * 3. Truncate to first 32 bytes (for secp256k1 curve order)
 * 4. Sign with ECDSA secp256k1
 * 5. Return DER-encoded signature
 *
 * @param hashHex - SHA-256 hash as 64-character hex string
 * @param privateKey - Private key in hex format (64 characters)
 * @returns DER-encoded signature in hex format
 *
 * @example
 * ```typescript
 * // Compute your own hash
 * const hashHex = sha256(myData);
 * const signature = await signHash(hashHex, privateKey);
 * ```
 */
export declare function signHash(hashHex: string, privateKey: string): Promise<string>;
