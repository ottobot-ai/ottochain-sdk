/**
 * Signature Verification
 *
 * Verify ECDSA signatures using secp256k1 curve via dag4js.
 */
import { Signed, SignatureProof, VerificationResult } from './types.js';
/**
 * Verify a signed object
 *
 * @param signed - Signed object with value and proofs
 * @param isDataUpdate - Whether the value was signed as a DataUpdate
 * @returns VerificationResult with valid/invalid proof lists
 *
 * @example
 * ```typescript
 * const result = await verify(signedObject);
 * if (result.isValid) {
 *   console.log('All signatures valid');
 * }
 * ```
 */
export declare function verify<T>(signed: Signed<T>, isDataUpdate?: boolean): Promise<VerificationResult>;
/**
 * Verify a signature against a SHA-256 hash
 *
 * Protocol:
 * 1. Treat hash hex as UTF-8 bytes (NOT hex decode)
 * 2. SHA-512 hash
 * 3. Truncate to 32 bytes (handled internally by dag4)
 * 4. Verify ECDSA signature
 *
 * @param hashHex - SHA-256 hash as 64-character hex string
 * @param signature - DER-encoded signature in hex format
 * @param publicKeyId - Public key in hex (with or without 04 prefix)
 * @returns true if signature is valid
 */
export declare function verifyHash(hashHex: string, signature: string, publicKeyId: string): Promise<boolean>;
/**
 * Verify a single signature proof against data
 *
 * @param data - The original data that was signed
 * @param proof - The signature proof to verify
 * @param isDataUpdate - Whether data was signed as DataUpdate
 * @returns true if signature is valid
 */
export declare function verifySignature<T>(data: T, proof: SignatureProof, isDataUpdate?: boolean): Promise<boolean>;
/**
 * Normalize a DER-encoded signature to use low-S value.
 *
 * BIP 62/146 requires S values to be in the lower half of the curve order.
 * Some signing implementations produce high-S signatures which are mathematically
 * valid but rejected by strict verifiers. This normalizes high-S to low-S by
 * computing S' = N - S where N is the curve order.
 */
export declare function normalizeSignatureToLowS(signatureHex: string): string;
