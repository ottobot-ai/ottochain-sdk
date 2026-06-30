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
export enum ErrorCode {
  /** Unknown or unclassified error */
  UNKNOWN = 'UNKNOWN',
  /** Network/HTTP connection failure */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Request timeout */
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  /** Input validation failed */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** Invalid private key format */
  INVALID_PRIVATE_KEY = 'INVALID_PRIVATE_KEY',
  /** Invalid public key format */
  INVALID_PUBLIC_KEY = 'INVALID_PUBLIC_KEY',
  /** Invalid DAG address format */
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  /** Signature creation failed */
  SIGNING_ERROR = 'SIGNING_ERROR',
  /** Signature verification failed */
  VERIFICATION_ERROR = 'VERIFICATION_ERROR',
  /** Transaction rejected by network */
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  /** Transaction not found */
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  /** Invalid transaction format */
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
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
export class OttoChainError extends Error {
  /** Error code for programmatic handling */
  readonly code: ErrorCode;

  /** Original error that caused this error */
  readonly cause?: Error;

  constructor(code: ErrorCode, message: string, cause?: Error) {
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
  override toString(): string {
    let result = `${this.name} [${this.code}]: ${this.message}`;
    if (this.cause) {
      result += `\nCaused by: ${this.cause.message}`;
    }
    return result;
  }

  /**
   * Convert error to a plain object for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      cause: this.cause?.message,
      stack: this.stack,
    };
  }
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
export class NetworkError extends OttoChainError {
  /** HTTP status code if applicable */
  readonly statusCode?: number;

  /** Response body if available */
  readonly responseBody?: string;

  constructor(message: string, statusCode?: number, responseBody?: string, cause?: Error) {
    const code = statusCode === undefined ? ErrorCode.NETWORK_ERROR : ErrorCode.NETWORK_ERROR;
    super(code, message, cause);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }

  /**
   * Create a timeout error
   */
  static timeout(timeoutMs: number): NetworkError {
    const error = new NetworkError(`Request timed out after ${timeoutMs}ms`);
    (error as { code: ErrorCode }).code = ErrorCode.NETWORK_TIMEOUT;
    return error;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      responseBody: this.responseBody,
    };
  }
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
export class ValidationError extends OttoChainError {
  /** Field that failed validation */
  readonly field?: string;

  /** Value that failed validation (sanitized) */
  readonly value?: unknown;

  /** Validation details/constraints */
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      field?: string;
      value?: unknown;
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, options?.cause);
    this.name = 'ValidationError';
    this.field = options?.field;
    this.value = options?.value;
    this.details = options?.details;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      field: this.field,
      value: this.value,
      details: this.details,
    };
  }
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
export class SigningError extends OttoChainError {
  /** The operation that failed */
  readonly operation?: string;

  constructor(message: string, options?: { operation?: string; cause?: Error }) {
    super(ErrorCode.SIGNING_ERROR, message, options?.cause);
    this.name = 'SigningError';
    this.operation = options?.operation;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      operation: this.operation,
    };
  }
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
export class TransactionError extends OttoChainError {
  /** Transaction hash if available */
  readonly transactionHash?: string;

  /** Reason for rejection if available */
  readonly rejectionReason?: string;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      transactionHash?: string;
      rejectionReason?: string;
      cause?: Error;
    },
  ) {
    super(code, message, options?.cause);
    this.name = 'TransactionError';
    this.transactionHash = options?.transactionHash;
    this.rejectionReason = options?.rejectionReason;
  }

  /**
   * Create a transaction rejected error
   */
  static rejected(reason: string, transactionHash?: string): TransactionError {
    return new TransactionError(ErrorCode.TRANSACTION_REJECTED, `Transaction rejected: ${reason}`, {
      transactionHash,
      rejectionReason: reason,
    });
  }

  /**
   * Create a transaction not found error
   */
  static notFound(transactionHash: string): TransactionError {
    return new TransactionError(ErrorCode.TRANSACTION_NOT_FOUND, `Transaction not found: ${transactionHash}`, {
      transactionHash,
    });
  }

  /**
   * Create an invalid transaction error
   */
  static invalid(message: string, cause?: Error): TransactionError {
    return new TransactionError(ErrorCode.INVALID_TRANSACTION, message, { cause });
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      transactionHash: this.transactionHash,
      rejectionReason: this.rejectionReason,
    };
  }
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
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return error instanceof OttoChainError && error.code === code;
}

/**
 * Wrap an unknown error in an OttoChainError
 *
 * @param error - Error to wrap
 * @param defaultMessage - Default message if error has no message
 * @returns OttoChainError wrapping the original error
 */
export function wrapError(error: unknown, defaultMessage = 'An error occurred'): OttoChainError {
  if (error instanceof OttoChainError) {
    return error;
  }

  if (error instanceof Error) {
    return new OttoChainError(ErrorCode.UNKNOWN, error.message || defaultMessage, error);
  }

  return new OttoChainError(ErrorCode.UNKNOWN, String(error) || defaultMessage);
}
