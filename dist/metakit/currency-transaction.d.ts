/**
 * Currency transaction operations for metagraph token transfers
 *
 * @packageDocumentation
 */
import type { CurrencyTransaction, TransactionReference, TransferParams } from './currency-types.js';
import type { VerificationResult } from './types.js';
/**
 * Convert token amount to smallest units
 *
 * @param amount - Amount in token units (e.g., 100.5)
 * @returns Amount in smallest units (1e-8)
 *
 * @example
 * ```typescript
 * const units = tokenToUnits(100.5); // 10050000000
 * ```
 */
export declare function tokenToUnits(amount: number): number;
/**
 * Convert smallest units to token amount
 *
 * @param units - Amount in smallest units
 * @returns Amount in token units
 *
 * @example
 * ```typescript
 * const tokens = unitsToToken(10050000000); // 100.5
 * ```
 */
export declare function unitsToToken(units: number): number;
/**
 * Validate DAG address format
 *
 * @param address - DAG address to validate
 * @returns True if address is valid
 *
 * @example
 * ```typescript
 * const valid = isValidDagAddress('DAG...');
 * ```
 */
export declare function isValidDagAddress(address: string): boolean;
/**
 * Create a metagraph token transaction
 *
 * @param params - Transfer parameters
 * @param privateKey - Private key to sign with (hex string)
 * @param lastRef - Reference to last accepted transaction
 * @returns Signed currency transaction
 *
 * @throws If addresses are invalid or amount is too small
 *
 * @example
 * ```typescript
 * const tx = await createCurrencyTransaction(
 *   { destination: 'DAG...', amount: 100.5, fee: 0 },
 *   privateKey,
 *   { hash: 'abc123...', ordinal: 5 }
 * );
 * ```
 */
export declare function createCurrencyTransaction(params: TransferParams, privateKey: string, lastRef: TransactionReference): Promise<CurrencyTransaction>;
/**
 * Create multiple metagraph token transactions (batch)
 *
 * @param transfers - Array of transfer parameters
 * @param privateKey - Private key to sign with
 * @param lastRef - Reference to last accepted transaction
 * @returns Array of signed currency transactions
 *
 * @throws If any address is invalid or amount is too small
 *
 * @example
 * ```typescript
 * const txns = await createCurrencyTransactionBatch(
 *   [
 *     { destination: 'DAG...1', amount: 10 },
 *     { destination: 'DAG...2', amount: 20 },
 *   ],
 *   privateKey,
 *   { hash: 'abc123...', ordinal: 5 }
 * );
 * ```
 */
export declare function createCurrencyTransactionBatch(transfers: TransferParams[], privateKey: string, lastRef: TransactionReference): Promise<CurrencyTransaction[]>;
/**
 * Add a signature to an existing currency transaction (for multi-sig)
 *
 * @param transaction - Transaction to sign
 * @param privateKey - Private key to sign with
 * @returns Transaction with additional signature
 *
 * @throws If sign-verify fails
 *
 * @example
 * ```typescript
 * const signedTx = await signCurrencyTransaction(tx, privateKey2);
 * ```
 */
export declare function signCurrencyTransaction(transaction: CurrencyTransaction, privateKey: string): Promise<CurrencyTransaction>;
/**
 * Verify all signatures on a currency transaction
 *
 * @param transaction - Transaction to verify
 * @returns Verification result with valid/invalid proofs
 *
 * @example
 * ```typescript
 * const result = await verifyCurrencyTransaction(tx);
 * console.log('Valid:', result.isValid);
 * ```
 */
export declare function verifyCurrencyTransaction(transaction: CurrencyTransaction): Promise<VerificationResult>;
/**
 * Encode a currency transaction for hashing
 *
 * @param transaction - Transaction to encode
 * @returns Hex-encoded string
 *
 * @example
 * ```typescript
 * const encoded = encodeCurrencyTransaction(tx);
 * ```
 */
export declare function encodeCurrencyTransaction(transaction: CurrencyTransaction): string;
/**
 * Hash a currency transaction
 *
 * @param transaction - Transaction to hash
 * @returns Hash object with value and bytes
 *
 * @example
 * ```typescript
 * const hash = await hashCurrencyTransaction(tx);
 * console.log('Hash:', hash.value);
 * ```
 */
export declare function hashCurrencyTransaction(transaction: CurrencyTransaction): Promise<{
    value: string;
    bytes: Uint8Array;
}>;
/**
 * Get transaction reference from a currency transaction
 * Useful for chaining transactions
 *
 * @param transaction - Transaction to extract reference from
 * @param ordinal - Ordinal number for this transaction
 * @returns Transaction reference
 *
 * @example
 * ```typescript
 * const ref = await getTransactionReference(tx, 6);
 * // Use ref as lastRef for next transaction
 * ```
 */
export declare function getTransactionReference(transaction: CurrencyTransaction, ordinal: number): Promise<TransactionReference>;
