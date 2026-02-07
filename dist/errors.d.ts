/**
 * Custom Error Classes for OttoChain SDK
 *
 * Provides structured error handling with error codes and causes.
 *
 * @packageDocumentation
 */
/**
 * Error codes for OttoChain SDK errors
 */
export declare enum ErrorCode {
    /** Unknown or unclassified error */
    UNKNOWN = "UNKNOWN",
    /** Network/HTTP connection failure */
    NETWORK_ERROR = "NETWORK_ERROR",
    /** Request timeout */
    NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
    /** Input validation failed */
    VALIDATION_ERROR = "VALIDATION_ERROR",
    /** Invalid private key format */
    INVALID_PRIVATE_KEY = "INVALID_PRIVATE_KEY",
    /** Invalid public key format */
    INVALID_PUBLIC_KEY = "INVALID_PUBLIC_KEY",
    /** Invalid DAG address format */
    INVALID_ADDRESS = "INVALID_ADDRESS",
    /** Signature creation failed */
    SIGNING_ERROR = "SIGNING_ERROR",
    /** Signature verification failed */
    VERIFICATION_ERROR = "VERIFICATION_ERROR",
    /** Transaction rejected by network */
    TRANSACTION_REJECTED = "TRANSACTION_REJECTED",
    /** Transaction not found */
    TRANSACTION_NOT_FOUND = "TRANSACTION_NOT_FOUND",
    /** Invalid transaction format */
    INVALID_TRANSACTION = "INVALID_TRANSACTION"
}
/**
 * Base error class for all OttoChain SDK errors
 *
 * Provides consistent error structure with:
 * - Error code for programmatic handling
 * - Human-readable message
 * - Optional cause for error chaining
 *
 * @example
 * ```typescript
 * try {
 *   await signTransaction(data, invalidKey);
 * } catch (error) {
 *   if (error instanceof OttoChainError) {
 *     console.log(error.code);    // 'INVALID_PRIVATE_KEY'
 *     console.log(error.message); // 'Invalid private key format'
 *   }
 * }
 * ```
 */
export declare class OttoChainError extends Error {
    /** Error code for programmatic handling */
    readonly code: ErrorCode;
    /** Original error that caused this error */
    readonly cause?: Error;
    constructor(code: ErrorCode, message: string, cause?: Error);
    /**
     * Create a string representation of the error
     */
    toString(): string;
    /**
     * Convert error to a plain object for logging/serialization
     */
    toJSON(): Record<string, unknown>;
}
/**
 * Error thrown when network operations fail
 *
 * Covers HTTP failures, connection errors, and timeouts.
 *
 * @example
 * ```typescript
 * try {
 *   await client.postTransaction(signed);
 * } catch (error) {
 *   if (error instanceof NetworkError) {
 *     console.log(error.statusCode); // 503
 *     console.log(error.responseBody); // '{"error": "Service unavailable"}'
 *   }
 * }
 * ```
 */
export declare class NetworkError extends OttoChainError {
    /** HTTP status code if applicable */
    readonly statusCode?: number;
    /** Response body if available */
    readonly responseBody?: string;
    constructor(message: string, statusCode?: number, responseBody?: string, cause?: Error);
    /**
     * Create a timeout error
     */
    static timeout(timeoutMs: number): NetworkError;
    toJSON(): Record<string, unknown>;
}
/**
 * Error thrown when input validation fails
 *
 * Used when function parameters don't meet expected format or constraints.
 *
 * @example
 * ```typescript
 * try {
 *   const keyPair = keyPairFromPrivateKey('invalid');
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.log(error.field); // 'privateKey'
 *     console.log(error.value); // 'invalid'
 *   }
 * }
 * ```
 */
export declare class ValidationError extends OttoChainError {
    /** Field that failed validation */
    readonly field?: string;
    /** Value that failed validation (sanitized) */
    readonly value?: unknown;
    /** Validation details/constraints */
    readonly details?: Record<string, unknown>;
    constructor(message: string, options?: {
        field?: string;
        value?: unknown;
        details?: Record<string, unknown>;
        cause?: Error;
    });
    toJSON(): Record<string, unknown>;
}
/**
 * Error thrown when cryptographic signing operations fail
 *
 * Covers key derivation, signature creation, and related crypto operations.
 *
 * @example
 * ```typescript
 * try {
 *   const signature = await signHash(hash, privateKey);
 * } catch (error) {
 *   if (error instanceof SigningError) {
 *     console.log(error.operation); // 'sign'
 *   }
 * }
 * ```
 */
export declare class SigningError extends OttoChainError {
    /** The operation that failed */
    readonly operation?: string;
    constructor(message: string, options?: {
        operation?: string;
        cause?: Error;
    });
    toJSON(): Record<string, unknown>;
}
/**
 * Error thrown when transaction operations fail
 *
 * Used when transactions are rejected, not found, or invalid.
 *
 * @example
 * ```typescript
 * try {
 *   await client.postTransaction(signed);
 * } catch (error) {
 *   if (error instanceof TransactionError) {
 *     console.log(error.transactionHash); // 'abc123...'
 *     console.log(error.rejectionReason); // 'Insufficient balance'
 *   }
 * }
 * ```
 */
export declare class TransactionError extends OttoChainError {
    /** Transaction hash if available */
    readonly transactionHash?: string;
    /** Reason for rejection if available */
    readonly rejectionReason?: string;
    constructor(code: ErrorCode, message: string, options?: {
        transactionHash?: string;
        rejectionReason?: string;
        cause?: Error;
    });
    /**
     * Create a transaction rejected error
     */
    static rejected(reason: string, transactionHash?: string): TransactionError;
    /**
     * Create a transaction not found error
     */
    static notFound(transactionHash: string): TransactionError;
    /**
     * Create an invalid transaction error
     */
    static invalid(message: string, cause?: Error): TransactionError;
    toJSON(): Record<string, unknown>;
}
/**
 * Check if an error is an OttoChain error with a specific code
 *
 * @param error - Error to check
 * @param code - Error code to match
 * @returns True if error matches the code
 *
 * @example
 * ```typescript
 * if (isErrorCode(error, ErrorCode.NETWORK_TIMEOUT)) {
 *   // Retry the request
 * }
 * ```
 */
export declare function isErrorCode(error: unknown, code: ErrorCode): boolean;
/**
 * Wrap an unknown error in an OttoChainError
 *
 * @param error - Error to wrap
 * @param defaultMessage - Default message if error has no message
 * @returns OttoChainError wrapping the original error
 */
export declare function wrapError(error: unknown, defaultMessage?: string): OttoChainError;
