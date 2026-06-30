import {
  ErrorCode,
  OttoChainError,
  NetworkError,
  ValidationError,
  SigningError,
  TransactionError,
  isErrorCode,
  wrapError,
} from '../src/errors';

describe('OttoChain Errors', () => {
  describe('ErrorCode enum', () => {
    it('should have expected error codes', () => {
      expect(ErrorCode.UNKNOWN).toBe('UNKNOWN');
      expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ErrorCode.NETWORK_TIMEOUT).toBe('NETWORK_TIMEOUT');
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.INVALID_PRIVATE_KEY).toBe('INVALID_PRIVATE_KEY');
      expect(ErrorCode.INVALID_PUBLIC_KEY).toBe('INVALID_PUBLIC_KEY');
      expect(ErrorCode.INVALID_ADDRESS).toBe('INVALID_ADDRESS');
      expect(ErrorCode.SIGNING_ERROR).toBe('SIGNING_ERROR');
      expect(ErrorCode.VERIFICATION_ERROR).toBe('VERIFICATION_ERROR');
      expect(ErrorCode.TRANSACTION_REJECTED).toBe('TRANSACTION_REJECTED');
      expect(ErrorCode.TRANSACTION_NOT_FOUND).toBe('TRANSACTION_NOT_FOUND');
      expect(ErrorCode.INVALID_TRANSACTION).toBe('INVALID_TRANSACTION');
    });
  });

  describe('OttoChainError', () => {
    it('should create base error with code and message', () => {
      const error = new OttoChainError(ErrorCode.UNKNOWN, 'Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('OttoChainError');
      expect(error.code).toBe(ErrorCode.UNKNOWN);
      expect(error instanceof Error).toBe(true);
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new OttoChainError(ErrorCode.UNKNOWN, 'Wrapped error', cause);
      expect(error.cause).toBe(cause);
    });

    it('should format error with code and message in toString', () => {
      const error = new OttoChainError(ErrorCode.UNKNOWN, 'Test error');
      expect(error.toString()).toContain('OttoChainError');
      expect(error.toString()).toContain('UNKNOWN');
      expect(error.toString()).toContain('Test error');
    });

    it('should include cause in toString', () => {
      const cause = new Error('Root cause');
      const error = new OttoChainError(ErrorCode.UNKNOWN, 'Wrapped', cause);
      expect(error.toString()).toContain('Caused by');
      expect(error.toString()).toContain('Root cause');
    });

    it('should convert to JSON', () => {
      const error = new OttoChainError(ErrorCode.UNKNOWN, 'Test error');
      const json = error.toJSON();
      expect(json.name).toBe('OttoChainError');
      expect(json.code).toBe(ErrorCode.UNKNOWN);
      expect(json.message).toBe('Test error');
    });

    it('should include cause message in JSON', () => {
      const cause = new Error('Root cause');
      const error = new OttoChainError(ErrorCode.UNKNOWN, 'Wrapped', cause);
      const json = error.toJSON();
      expect(json.cause).toBe('Root cause');
    });
  });

  describe('NetworkError', () => {
    it('should create network error with message only', () => {
      const error = new NetworkError('Network failed');
      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.message).toBe('Network failed');
    });

    it('should include status code', () => {
      const error = new NetworkError('Not found', 404);
      expect(error.statusCode).toBe(404);
    });

    it('should include response body', () => {
      const error = new NetworkError('Server error', 500, '{"error": "Internal"}');
      expect(error.responseBody).toBe('{"error": "Internal"}');
    });

    it('should include cause', () => {
      const cause = new Error('fetch failed');
      const error = new NetworkError('Failed', 500, undefined, cause);
      expect(error.cause).toBe(cause);
    });

    it('should create timeout error', () => {
      const error = NetworkError.timeout(5000);
      expect(error.code).toBe(ErrorCode.NETWORK_TIMEOUT);
      expect(error.message).toContain('5000');
    });

    it('should convert to JSON with status and body', () => {
      const error = new NetworkError('Error', 404, 'Not found');
      const json = error.toJSON();
      expect(json.statusCode).toBe(404);
      expect(json.responseBody).toBe('Not found');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with message', () => {
      const error = new ValidationError('Invalid input');
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should include field name', () => {
      const error = new ValidationError('Invalid amount', { field: 'amount' });
      expect(error.field).toBe('amount');
    });

    it('should include invalid value', () => {
      const error = new ValidationError('Invalid', { field: 'amount', value: -100 });
      expect(error.value).toBe(-100);
    });

    it('should include details', () => {
      const error = new ValidationError('Invalid', {
        field: 'amount',
        details: { min: 0, max: 100 },
      });
      expect(error.details).toEqual({ min: 0, max: 100 });
    });

    it('should include cause', () => {
      const cause = new Error('underlying');
      const error = new ValidationError('Wrapped', { cause });
      expect(error.cause).toBe(cause);
    });

    it('should convert to JSON with field info', () => {
      const error = new ValidationError('Invalid', { field: 'test', value: 123 });
      const json = error.toJSON();
      expect(json.field).toBe('test');
      expect(json.value).toBe(123);
    });
  });

  describe('SigningError', () => {
    it('should create signing error', () => {
      const error = new SigningError('Signing failed');
      expect(error.name).toBe('SigningError');
      expect(error.code).toBe(ErrorCode.SIGNING_ERROR);
    });

    it('should include operation', () => {
      const error = new SigningError('Failed', { operation: 'sign' });
      expect(error.operation).toBe('sign');
    });

    it('should include cause', () => {
      const cause = new Error('crypto failed');
      const error = new SigningError('Failed', { cause });
      expect(error.cause).toBe(cause);
    });

    it('should convert to JSON with operation', () => {
      const error = new SigningError('Failed', { operation: 'verify' });
      const json = error.toJSON();
      expect(json.operation).toBe('verify');
    });
  });

  describe('TransactionError', () => {
    it('should create transaction error', () => {
      const error = new TransactionError(ErrorCode.TRANSACTION_REJECTED, 'Transaction rejected');
      expect(error.name).toBe('TransactionError');
      expect(error.code).toBe(ErrorCode.TRANSACTION_REJECTED);
    });

    it('should include transaction hash', () => {
      const error = new TransactionError(ErrorCode.TRANSACTION_REJECTED, 'Rejected', { transactionHash: 'abc123' });
      expect(error.transactionHash).toBe('abc123');
    });

    it('should include rejection reason', () => {
      const error = new TransactionError(ErrorCode.TRANSACTION_REJECTED, 'Rejected', {
        rejectionReason: 'Insufficient funds',
      });
      expect(error.rejectionReason).toBe('Insufficient funds');
    });

    it('should create rejected error via static method', () => {
      const error = TransactionError.rejected('Insufficient balance', 'hash123');
      expect(error.code).toBe(ErrorCode.TRANSACTION_REJECTED);
      expect(error.transactionHash).toBe('hash123');
      expect(error.rejectionReason).toBe('Insufficient balance');
    });

    it('should create not found error via static method', () => {
      const error = TransactionError.notFound('hash456');
      expect(error.code).toBe(ErrorCode.TRANSACTION_NOT_FOUND);
      expect(error.transactionHash).toBe('hash456');
    });

    it('should create invalid transaction error via static method', () => {
      const cause = new Error('bad format');
      const error = TransactionError.invalid('Invalid format', cause);
      expect(error.code).toBe(ErrorCode.INVALID_TRANSACTION);
      expect(error.cause).toBe(cause);
    });

    it('should convert to JSON with transaction info', () => {
      const error = new TransactionError(ErrorCode.TRANSACTION_REJECTED, 'Rejected', {
        transactionHash: 'abc',
        rejectionReason: 'reason',
      });
      const json = error.toJSON();
      expect(json.transactionHash).toBe('abc');
      expect(json.rejectionReason).toBe('reason');
    });
  });

  describe('isErrorCode', () => {
    it('should return true for matching error code', () => {
      const error = new NetworkError('test', 500);
      expect(isErrorCode(error, ErrorCode.NETWORK_ERROR)).toBe(true);
    });

    it('should return false for non-matching error code', () => {
      const error = new NetworkError('test', 500);
      expect(isErrorCode(error, ErrorCode.VALIDATION_ERROR)).toBe(false);
    });

    it('should return false for non-OttoChainError', () => {
      const error = new Error('test');
      expect(isErrorCode(error, ErrorCode.UNKNOWN)).toBe(false);
    });

    it('should return false for non-Error', () => {
      expect(isErrorCode('not an error', ErrorCode.UNKNOWN)).toBe(false);
    });
  });

  describe('wrapError', () => {
    it('should return OttoChainError as-is', () => {
      const original = new NetworkError('Already wrapped');
      const wrapped = wrapError(original);
      expect(wrapped).toBe(original);
    });

    it('should wrap regular Error', () => {
      const original = new Error('Original');
      const wrapped = wrapError(original);
      expect(wrapped).toBeInstanceOf(OttoChainError);
      expect(wrapped.message).toBe('Original');
      expect(wrapped.cause).toBe(original);
      expect(wrapped.code).toBe(ErrorCode.UNKNOWN);
    });

    it('should use default message for Error without message', () => {
      const original = new Error('');
      const wrapped = wrapError(original, 'Default message');
      expect(wrapped.message).toBe('Default message');
    });

    it('should wrap string errors', () => {
      const wrapped = wrapError('String error');
      expect(wrapped).toBeInstanceOf(OttoChainError);
      expect(wrapped.message).toBe('String error');
    });

    it('should wrap unknown errors', () => {
      const wrapped = wrapError({ weird: 'object' });
      expect(wrapped).toBeInstanceOf(OttoChainError);
    });

    it('should use default message when provided', () => {
      const wrapped = wrapError(null, 'Context message');
      expect(wrapped.message).toBe('null');
    });
  });
});
