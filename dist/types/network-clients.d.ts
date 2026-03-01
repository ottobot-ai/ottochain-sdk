/**
 * OttoChain network clients — CurrencyL1Client and DataL1Client.
 *
 * These clients provide a higher-level API on top of the HttpClient from
 * @constellation-network/metagraph-sdk/network, tailored for Constellation L1 nodes.
 *
 * HttpClient and NetworkError are re-exported from the package for convenience.
 *
 * @packageDocumentation
 */
import type { TransactionReference, CurrencyTransaction, Signed } from '@constellation-network/metagraph-sdk';
export { HttpClient, NetworkError } from '@constellation-network/metagraph-sdk/network';
export type { MetagraphClient } from '@constellation-network/metagraph-sdk/network';
export { createMetagraphClient } from '@constellation-network/metagraph-sdk/network';
/**
 * HTTP request options
 */
export interface RequestOptions {
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Additional headers */
    headers?: Record<string, string>;
}
/**
 * Transaction status in the network
 */
export type TransactionStatus = 'Waiting' | 'InProgress' | 'Accepted';
/**
 * Pending transaction response from L1
 */
export interface PendingTransaction {
    hash: string;
    status: TransactionStatus;
    transaction: CurrencyTransaction;
}
/** Response from posting a transaction */
export interface PostTransactionResponse {
    hash: string;
}
/** Response from estimating data transaction fee */
export interface EstimateFeeResponse {
    fee: number;
    address: string;
}
/** Response from posting data */
export interface PostDataResponse {
    hash: string;
}
/**
 * Network configuration for connecting to Constellation L1 nodes.
 */
export interface NetworkConfig {
    /** Currency L1 endpoint URL (e.g., 'http://localhost:9010') */
    l1Url?: string;
    /** Data L1 endpoint URL (e.g., 'http://localhost:8080') */
    dataL1Url?: string;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
}
/**
 * Client for interacting with Currency L1 nodes.
 *
 * @example
 * ```typescript
 * const client = new CurrencyL1Client({ l1Url: 'http://localhost:9010' });
 * const lastRef = await client.getLastReference('DAG...');
 * ```
 */
export declare class CurrencyL1Client {
    private client;
    constructor(config: NetworkConfig);
    getLastReference(address: string, options?: RequestOptions): Promise<TransactionReference>;
    postTransaction(transaction: CurrencyTransaction, options?: RequestOptions): Promise<PostTransactionResponse>;
    getPendingTransaction(hash: string, options?: RequestOptions): Promise<PendingTransaction | null>;
    checkHealth(options?: RequestOptions): Promise<boolean>;
}
/**
 * Client for interacting with Data L1 nodes (metagraphs).
 *
 * @example
 * ```typescript
 * const client = new DataL1Client({ dataL1Url: 'http://localhost:8080' });
 * const result = await client.postData(signedData);
 * ```
 */
export declare class DataL1Client {
    private client;
    constructor(config: NetworkConfig);
    estimateFee<T>(data: Signed<T>, options?: RequestOptions): Promise<EstimateFeeResponse>;
    postData<T>(data: Signed<T>, options?: RequestOptions): Promise<PostDataResponse>;
    checkHealth(options?: RequestOptions): Promise<boolean>;
}
