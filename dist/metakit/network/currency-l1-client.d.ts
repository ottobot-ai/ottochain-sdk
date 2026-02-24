/**
 * Currency L1 client for submitting and querying transactions
 *
 * @packageDocumentation
 */
import type { NetworkConfig, PendingTransaction, PostTransactionResponse, RequestOptions } from './types.js';
import type { TransactionReference, CurrencyTransaction } from '../currency-types.js';
/**
 * Client for interacting with Currency L1 nodes
 *
 * @example
 * ```typescript
 * const client = new CurrencyL1Client({ l1Url: 'http://localhost:9010' });
 *
 * // Get last reference for an address
 * const lastRef = await client.getLastReference('DAG...');
 *
 * // Submit a transaction
 * const result = await client.postTransaction(signedTx);
 *
 * // Check transaction status
 * const pending = await client.getPendingTransaction(result.hash);
 * ```
 */
export declare class CurrencyL1Client {
    private client;
    /**
     * Create a new CurrencyL1Client
     *
     * @param config - Network configuration with l1Url
     * @throws Error if l1Url is not provided
     */
    constructor(config: NetworkConfig);
    /**
     * Get the last accepted transaction reference for an address
     *
     * This is needed to create a new transaction that chains from
     * the address's most recent transaction.
     *
     * @param address - DAG address to query
     * @param options - Request options
     * @returns Transaction reference with hash and ordinal
     */
    getLastReference(address: string, options?: RequestOptions): Promise<TransactionReference>;
    /**
     * Submit a signed currency transaction to the L1 network
     *
     * @param transaction - Signed currency transaction
     * @param options - Request options
     * @returns Response containing the transaction hash
     */
    postTransaction(transaction: CurrencyTransaction, options?: RequestOptions): Promise<PostTransactionResponse>;
    /**
     * Get a pending transaction by hash
     *
     * Use this to poll for transaction status after submission.
     * Returns null if the transaction is not found (already confirmed or invalid).
     *
     * @param hash - Transaction hash
     * @param options - Request options
     * @returns Pending transaction details or null if not found
     */
    getPendingTransaction(hash: string, options?: RequestOptions): Promise<PendingTransaction | null>;
    /**
     * Check the health/availability of the L1 node
     *
     * @param options - Request options
     * @returns True if the node is healthy
     */
    checkHealth(options?: RequestOptions): Promise<boolean>;
}
