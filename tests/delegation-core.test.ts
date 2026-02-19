/**
 * Core Delegation Tests - Testing just the main delegation functionality
 * without the existing validation/revocation clients that have TypeScript issues
 */

import { 
  DelegationHelpers,
  DelegationScope,
  DELEGATION_CONSTANTS,
  DelegationError,
} from '../src/delegation/index.js';

// Test the core delegation helpers and utilities that don't depend on the clients
describe('DelegationHelpers', () => {
  describe('createTransferScope', () => {
    it('should create basic transfer scope', () => {
      const scope = DelegationHelpers.createTransferScope();
      
      expect(scope.allowedOperations).toEqual(['transfer']);
      expect(scope.allowedContracts).toEqual([]);
      expect(scope.maxTransactionAmount).toBeUndefined();
      expect(scope.maxTotalAmount).toBeUndefined();
    });

    it('should create transfer scope with limits', () => {
      const scope = DelegationHelpers.createTransferScope('100', '500', ['contract1']);
      
      expect(scope.allowedOperations).toEqual(['transfer']);
      expect(scope.allowedContracts).toEqual(['contract1']);
      expect(scope.maxTransactionAmount).toBe('100');
      expect(scope.maxTotalAmount).toBe('500');
    });
  });

  describe('createMarketScope', () => {
    it('should create market operations scope', () => {
      const scope = DelegationHelpers.createMarketScope('50', '200', 75);
      
      expect(scope.allowedOperations).toEqual([
        'create_market',
        'place_bet', 
        'claim_winnings'
      ]);
      expect(scope.maxTransactionAmount).toBe('50');
      expect(scope.maxTotalAmount).toBe('200');
      expect(scope.minReputationScore).toBe(75);
    });
  });

  describe('validateScope', () => {
    it('should validate correct scope', () => {
      const scope: DelegationScope = {
        allowedOperations: ['transfer'],
        allowedContracts: [],
        maxTransactionAmount: '100',
        maxTotalAmount: '500',
        minReputationScore: 50,
      };

      const result = DelegationHelpers.validateScope(scope);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject scope with no operations', () => {
      const scope: DelegationScope = {
        allowedOperations: [],
        allowedContracts: [],
      };

      const result = DelegationHelpers.validateScope(scope);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one allowed operation must be specified');
    });
  });
});

describe('Constants', () => {
  it('should have correct duration constants', () => {
    expect(DELEGATION_CONSTANTS.MAX_DELEGATION_DURATION_MS).toBe(24 * 60 * 60 * 1000);
    expect(DELEGATION_CONSTANTS.DEFAULT_DELEGATION_DURATION_MS).toBe(60 * 60 * 1000);
  });

  it('should have operation constants', () => {
    expect(DELEGATION_CONSTANTS.OPERATIONS.TRANSFER).toBe('transfer');
    expect(DELEGATION_CONSTANTS.OPERATIONS.CREATE_MARKET).toBe('create_market');
  });
});

describe('DelegationError', () => {
  it('should create delegation error with code and details', () => {
    const error = new DelegationError('Test error', 'DELEGATION_EXPIRED', { test: 'data' });
    
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('DELEGATION_EXPIRED');
    expect(error.details).toEqual({ test: 'data' });
    expect(error.name).toBe('DelegationError');
  });
});