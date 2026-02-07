/**
 * Base HTTP client for network operations
 *
 * @packageDocumentation
 */
import { RequestOptions } from './types.js';
/**
 * Simple HTTP client using native fetch
 */
export declare class HttpClient {
    private baseUrl;
    private defaultTimeout;
    constructor(baseUrl: string, timeout?: number);
    /**
     * Make a GET request
     */
    get<T>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * Make a POST request
     */
    post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    private request;
}
