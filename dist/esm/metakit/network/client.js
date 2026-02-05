/**
 * Base HTTP client for network operations
 *
 * @packageDocumentation
 */
import { NetworkError } from './types.js';
const DEFAULT_TIMEOUT = 30000;
/**
 * Simple HTTP client using native fetch
 */
export class HttpClient {
    constructor(baseUrl, timeout = DEFAULT_TIMEOUT) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.defaultTimeout = timeout;
    }
    /**
     * Make a GET request
     */
    async get(path, options = {}) {
        return this.request('GET', path, undefined, options);
    }
    /**
     * Make a POST request
     */
    async post(path, body, options = {}) {
        return this.request('POST', path, body, options);
    }
    async request(method, path, body, options = {}) {
        const url = `${this.baseUrl}${path}`;
        const timeout = options.timeout ?? this.defaultTimeout;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const headers = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...options.headers,
            };
            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const text = await response.text();
            if (!response.ok) {
                throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`, response.status, text);
            }
            if (!text) {
                return undefined;
            }
            try {
                return JSON.parse(text);
            }
            catch {
                return text;
            }
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof NetworkError) {
                throw error;
            }
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new NetworkError(`Request timeout after ${timeout}ms`);
                }
                throw new NetworkError(error.message);
            }
            throw new NetworkError('Unknown network error');
        }
    }
}
