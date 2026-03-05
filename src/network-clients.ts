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
import { HttpClient, NetworkError } from '@constellation-network/metagraph-sdk/network';

export { HttpClient, NetworkError } from '@constellation-network/metagraph-sdk/network';
export type { MetagraphClient } from '@constellation-network/metagraph-sdk/network';
export { createMetagraphClient } from '@constellation-network/metagraph-sdk/network';

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// CurrencyL1Client
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Client for interacting with Currency L1 nodes.
 *
 * @example
 * ```typescript
 * const client = new CurrencyL1Client({ l1Url: 'http://localhost:9010' });
 * const lastRef = await client.getLastReference('DAG...');
 * ```
 */
export class CurrencyL1Client {
  private client: HttpClient;

  constructor(config: NetworkConfig) {
    if (!config.l1Url) {
      throw new Error('l1Url is required for CurrencyL1Client');
    }
    this.client = new HttpClient(config.l1Url, config.timeout);
  }

  async getLastReference(address: string, options?: RequestOptions): Promise<TransactionReference> {
    return this.client.get<TransactionReference>(
      `/transactions/last-reference/${address}`,
      options
    );
  }

  async postTransaction(
    transaction: CurrencyTransaction,
    options?: RequestOptions
  ): Promise<PostTransactionResponse> {
    return this.client.post<PostTransactionResponse>('/transactions', transaction, options);
  }

  async getPendingTransaction(
    hash: string,
    options?: RequestOptions
  ): Promise<PendingTransaction | null> {
    try {
      return await this.client.get<PendingTransaction>(`/transactions/${hash}`, options);
    } catch (error) {
      if (error instanceof NetworkError && error.statusCode === 404) return null;
      throw error;
    }
  }

  async checkHealth(options?: RequestOptions): Promise<boolean> {
    try {
      await this.client.get('/cluster/info', options);
      return true;
    } catch {
      return false;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DataL1Client
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Client for interacting with Data L1 nodes (metagraphs).
 *
 * @example
 * ```typescript
 * const client = new DataL1Client({ dataL1Url: 'http://localhost:8080' });
 * const result = await client.postData(signedData);
 * ```
 */
export class DataL1Client {
  private client: HttpClient;

  constructor(config: NetworkConfig) {
    if (!config.dataL1Url) {
      throw new Error('dataL1Url is required for DataL1Client');
    }
    this.client = new HttpClient(config.dataL1Url, config.timeout);
  }

  async estimateFee<T>(data: Signed<T>, options?: RequestOptions): Promise<EstimateFeeResponse> {
    return this.client.post<EstimateFeeResponse>('/data/estimate-fee', data, options);
  }

  async postData<T>(data: Signed<T>, options?: RequestOptions): Promise<PostDataResponse> {
    return this.client.post<PostDataResponse>('/data', data, options);
  }

  async checkHealth(options?: RequestOptions): Promise<boolean> {
    try {
      await this.client.get('/cluster/info', options);
      return true;
    } catch {
      return false;
    }
  }
}
