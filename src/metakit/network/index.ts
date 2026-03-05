/**
 * Network compat layer for OttoChain SDK
 *
 * Provides HttpClient, NetworkError, CurrencyL1Client, DataL1Client, and NetworkConfig.
 * These are maintained locally (rather than imported from @constellation-network/metagraph-sdk/network)
 * to avoid pulling the full crypto stack into environments that only need HTTP transport.
 *
 * @packageDocumentation
 */

import type { TransactionReference, CurrencyTransaction, Signed } from '@constellation-network/metagraph-sdk';

// ─────────────────────────────────────────────────────────────────────────────
// Network error
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
 * Network error with HTTP status code and response body.
 * Compatible with @constellation-network/metagraph-sdk/network NetworkError API.
 */
export class NetworkError extends Error {
  /** HTTP status code */
  statusCode?: number;
  /** Raw response body */
  response?: string;

  constructor(message: string, statusCode?: number, response?: string) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.response = response;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HttpClient — minimal fetch-based HTTP client
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT = 30_000;

/**
 * Simple HTTP client using native fetch.
 * Mirrors the API of HttpClient from @constellation-network/metagraph-sdk/network.
 */
export class HttpClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string, timeout: number = DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultTimeout = timeout;
  }

  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    options: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const timeout = options.timeout ?? this.defaultTimeout;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const text = await response.text();

      if (!response.ok) {
        throw new NetworkError(
          `HTTP ${response.status} ${response.statusText}: ${url}`,
          response.status,
          text
        );
      }

      return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
    } catch (err) {
      if (err instanceof NetworkError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('abort') || msg.includes('signal')) {
        throw new NetworkError(`Request timed out after ${timeout}ms: ${url}`);
      }
      throw new NetworkError(msg);
    } finally {
      clearTimeout(timer);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NetworkConfig — OttoChain-specific configuration type
// ─────────────────────────────────────────────────────────────────────────────

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
