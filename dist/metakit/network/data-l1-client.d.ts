/**
 * Data L1 client for submitting data transactions to metagraphs
 *
 * @packageDocumentation
 */
import type { NetworkConfig, EstimateFeeResponse, PostDataResponse, RequestOptions } from './types.js';
import type { Signed } from '../types.js';
/**
 * Client for interacting with Data L1 nodes (metagraphs)
 *
 * @example
 * ```typescript
 * const client = new DataL1Client({ dataL1Url: 'http://localhost:8080' });
 *
 * // Estimate fee for data submission
 * const feeInfo = await client.estimateFee(signedData);
 *
 * // Submit data
 * const result = await client.postData(signedData);
 * ```
 */
export declare class DataL1Client {
    private client;
    /**
     * Create a new DataL1Client
     *
     * @param config - Network configuration with dataL1Url
     * @throws Error if dataL1Url is not provided
     */
    constructor(config: NetworkConfig);
    /**
     * Estimate the fee for submitting data
     *
     * Some metagraphs charge fees for data submissions.
     * Call this before postData to know the required fee.
     *
     * @param data - Signed data object to estimate fee for
     * @param options - Request options
     * @returns Fee estimate with amount and destination address
     */
    estimateFee<T>(data: Signed<T>, options?: RequestOptions): Promise<EstimateFeeResponse>;
    /**
     * Submit signed data to the Data L1 node
     *
     * @param data - Signed data object to submit
     * @param options - Request options
     * @returns Response containing the data hash
     */
    postData<T>(data: Signed<T>, options?: RequestOptions): Promise<PostDataResponse>;
    /**
     * Check the health/availability of the Data L1 node
     *
     * @param options - Request options
     * @returns True if the node is healthy
     */
    checkHealth(options?: RequestOptions): Promise<boolean>;
}
