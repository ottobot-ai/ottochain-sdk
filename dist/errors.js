"use strict";
/**
 * Custom Error Classes for OttoChain SDK
 *
 * Provides structured error handling with error codes and causes.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapError = exports.isErrorCode = exports.TransactionError = exports.SigningError = exports.ValidationError = exports.NetworkError = exports.OttoChainError = exports.ErrorCode = void 0;
/**
 * Error codes for OttoChain SDK errors
 */
var ErrorCode;
(function (ErrorCode) {
    /** Unknown or unclassified error */
    ErrorCode["UNKNOWN"] = "UNKNOWN";
    /** Network/HTTP connection failure */
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    /** Request timeout */
    ErrorCode["NETWORK_TIMEOUT"] = "NETWORK_TIMEOUT";
    /** Input validation failed */
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    /** Invalid private key format */
    ErrorCode["INVALID_PRIVATE_KEY"] = "INVALID_PRIVATE_KEY";
    /** Invalid public key format */
    ErrorCode["INVALID_PUBLIC_KEY"] = "INVALID_PUBLIC_KEY";
    /** Invalid DAG address format */
    ErrorCode["INVALID_ADDRESS"] = "INVALID_ADDRESS";
    /** Signature creation failed */
    ErrorCode["SIGNING_ERROR"] = "SIGNING_ERROR";
    /** Signature verification failed */
    ErrorCode["VERIFICATION_ERROR"] = "VERIFICATION_ERROR";
    /** Transaction rejected by network */
    ErrorCode["TRANSACTION_REJECTED"] = "TRANSACTION_REJECTED";
    /** Transaction not found */
    ErrorCode["TRANSACTION_NOT_FOUND"] = "TRANSACTION_NOT_FOUND";
    /** Invalid transaction format */
    ErrorCode["INVALID_TRANSACTION"] = "INVALID_TRANSACTION";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
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
class OttoChainError extends Error {
    constructor(code, message, cause) {
        super(message);
        this.name = 'OttoChainError';
        this.code = code;
        this.cause = cause;
        // Maintains proper stack trace for where error was thrown (V8 engines)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Create a string representation of the error
     */
    toString() {
        let result = `${this.name} [${this.code}]: ${this.message}`;
        if (this.cause) {
            result += `\nCaused by: ${this.cause.message}`;
        }
        return result;
    }
    /**
     * Convert error to a plain object for logging/serialization
     */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            cause: this.cause?.message,
            stack: this.stack,
        };
    }
}
exports.OttoChainError = OttoChainError;
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
class NetworkError extends OttoChainError {
    constructor(message, statusCode, responseBody, cause) {
        const code = statusCode === undefined ? ErrorCode.NETWORK_ERROR : ErrorCode.NETWORK_ERROR;
        super(code, message, cause);
        this.name = 'NetworkError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }
    /**
     * Create a timeout error
     */
    static timeout(timeoutMs) {
        const error = new NetworkError(`Request timed out after ${timeoutMs}ms`);
        error.code = ErrorCode.NETWORK_TIMEOUT;
        return error;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            statusCode: this.statusCode,
            responseBody: this.responseBody,
        };
    }
}
exports.NetworkError = NetworkError;
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
class ValidationError extends OttoChainError {
    constructor(message, options) {
        super(ErrorCode.VALIDATION_ERROR, message, options?.cause);
        this.name = 'ValidationError';
        this.field = options?.field;
        this.value = options?.value;
        this.details = options?.details;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            field: this.field,
            value: this.value,
            details: this.details,
        };
    }
}
exports.ValidationError = ValidationError;
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
class SigningError extends OttoChainError {
    constructor(message, options) {
        super(ErrorCode.SIGNING_ERROR, message, options?.cause);
        this.name = 'SigningError';
        this.operation = options?.operation;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            operation: this.operation,
        };
    }
}
exports.SigningError = SigningError;
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
class TransactionError extends OttoChainError {
    constructor(code, message, options) {
        super(code, message, options?.cause);
        this.name = 'TransactionError';
        this.transactionHash = options?.transactionHash;
        this.rejectionReason = options?.rejectionReason;
    }
    /**
     * Create a transaction rejected error
     */
    static rejected(reason, transactionHash) {
        return new TransactionError(ErrorCode.TRANSACTION_REJECTED, `Transaction rejected: ${reason}`, {
            transactionHash,
            rejectionReason: reason,
        });
    }
    /**
     * Create a transaction not found error
     */
    static notFound(transactionHash) {
        return new TransactionError(ErrorCode.TRANSACTION_NOT_FOUND, `Transaction not found: ${transactionHash}`, {
            transactionHash,
        });
    }
    /**
     * Create an invalid transaction error
     */
    static invalid(message, cause) {
        return new TransactionError(ErrorCode.INVALID_TRANSACTION, message, { cause });
    }
    toJSON() {
        return {
            ...super.toJSON(),
            transactionHash: this.transactionHash,
            rejectionReason: this.rejectionReason,
        };
    }
}
exports.TransactionError = TransactionError;
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
function isErrorCode(error, code) {
    return error instanceof OttoChainError && error.code === code;
}
exports.isErrorCode = isErrorCode;
/**
 * Wrap an unknown error in an OttoChainError
 *
 * @param error - Error to wrap
 * @param defaultMessage - Default message if error has no message
 * @returns OttoChainError wrapping the original error
 */
function wrapError(error, defaultMessage = 'An error occurred') {
    if (error instanceof OttoChainError) {
        return error;
    }
    if (error instanceof Error) {
        return new OttoChainError(ErrorCode.UNKNOWN, error.message || defaultMessage, error);
    }
    return new OttoChainError(ErrorCode.UNKNOWN, String(error) || defaultMessage);
}
exports.wrapError = wrapError;
