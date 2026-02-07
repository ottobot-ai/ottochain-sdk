/**
 * Wallet and Key Management Utilities
 *
 * Functions for generating and managing cryptographic keys.
 */
import { KeyPair } from './types.js';
/**
 * Generate a new random key pair
 *
 * @returns KeyPair with private key, public key, and DAG address
 *
 * @example
 * ```typescript
 * const keyPair = generateKeyPair();
 * console.log(keyPair.address);    // DAG address
 * console.log(keyPair.privateKey); // 64 char hex
 * console.log(keyPair.publicKey);  // 130 char hex (with 04 prefix)
 * ```
 */
export declare function generateKeyPair(): KeyPair;
/**
 * Derive a key pair from an existing private key
 *
 * @param privateKey - Private key in hex format (64 characters)
 * @returns KeyPair with private key, public key, and DAG address
 *
 * @example
 * ```typescript
 * const keyPair = keyPairFromPrivateKey(existingPrivateKey);
 * ```
 */
export declare function keyPairFromPrivateKey(privateKey: string): KeyPair;
/**
 * Get the public key hex from a private key
 *
 * @param privateKey - Private key in hex format
 * @param compressed - If true, returns compressed public key (33 bytes)
 * @returns Public key in hex format
 */
export declare function getPublicKeyHex(privateKey: string, compressed?: boolean): string;
/**
 * Get the public key ID (without 04 prefix) from a private key
 *
 * This format is used in SignatureProof.id
 *
 * @param privateKey - Private key in hex format
 * @returns Public key ID (128 characters, no 04 prefix)
 */
export declare function getPublicKeyId(privateKey: string): string;
/**
 * Get DAG address from a public key
 *
 * @param publicKey - Public key in hex format (with or without 04 prefix)
 * @returns DAG address string
 */
export declare function getAddress(publicKey: string): string;
/**
 * Validate that a private key is correctly formatted
 *
 * @param privateKey - Private key to validate
 * @returns true if valid hex string of correct length
 */
export declare function isValidPrivateKey(privateKey: string): boolean;
/**
 * Validate that a public key is correctly formatted
 *
 * @param publicKey - Public key to validate
 * @returns true if valid hex string of correct length
 */
export declare function isValidPublicKey(publicKey: string): boolean;
