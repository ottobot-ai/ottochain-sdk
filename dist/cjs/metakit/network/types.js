"use strict";
/**
 * Network types for L1 client operations
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = void 0;
/**
 * Network error with status code and response details
 */
class NetworkError extends Error {
    constructor(message, statusCode, responseBody) {
        super(message);
        this.name = 'NetworkError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }
}
exports.NetworkError = NetworkError;
