/**
 * Network types for L1 client operations
 *
 * @packageDocumentation
 */
/**
 * Network error with status code and response details
 */
export class NetworkError extends Error {
    constructor(message, statusCode, response) {
        super(message);
        this.name = 'NetworkError';
        this.statusCode = statusCode;
        this.response = response;
    }
}
