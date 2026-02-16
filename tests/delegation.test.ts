/**
 * Tests for OttoChain SDK Delegation Management
 */

import { 
  DelegationClient, 
  DelegationHelpers,
  DelegationScope,
  DELEGATION_CONSTANTS,
  DelegationError,
  DelegationScopeError,
} from '../src/delegation/index.js';

// Mock configuration
const mockConfig = {
  bridgeUrl: 'https://test-bridge.ottochain.xyz',
  timeout: 5000,
  retries: 1,
  enableValidation: false, // Disable for unit tests
  enableRevocationMonitoring: false,
};

// Test addresses for future integration tests
// const mockAddresses = {
//   user: 'dag_user_test_address_123',
//   agent: 'dag_agent_test_address_456',
// };

describe('DelegationClient', () => {
  let client: DelegationClient;

  beforeEach(() => {
    client = new DelegationClient(mockConfig);
  });

  describe('constructor', () => {
    it('should create client with default configuration', () => {
      const defaultClient = new DelegationClient({
        bridgeUrl: 'https://bridge.test.com',
      });

      expect(defaultClient).toBeInstanceOf(DelegationClient);
    });

    it('should merge custom configuration with defaults', () => {
      const customClient = new DelegationClient({
        bridgeUrl: 'https://custom.bridge.com',
        timeout: 10000,
        retries: 5,
        enableValidation: true,
      });

      expect(customClient).toBeInstanceOf(DelegationClient);
    });
  });

  describe('generateIds', () => {
    it('should generate unique delegation IDs', () => {
      const client1 = new DelegationClient(mockConfig);
      const client2 = new DelegationClient(mockConfig);
      
      // Access private methods through any for testing
      const id1 = (client1 as any).generateDelegationId();
      const id2 = (client2 as any).generateDelegationId();
      
      expect(id1).toMatch(/^del_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^del_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate unique session key IDs', () => {
      const id1 = (client as any).generateSessionKeyId();
      const id2 = (client as any).generateSessionKeyId();
      
      expect(id1).toMatch(/^sk_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^sk_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('signature creation', () => {
    it('should create consistent signatures for same data', () => {
      const testData = { test: 'data', nonce: 123 };
      const privateKey = 'test_private_key';
      
      const sig1 = (client as any).createSignature(testData, privateKey);
      const sig2 = (client as any).createSignature(testData, privateKey);
      
      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^sig_[A-Za-z0-9+/]+$/);
    });

    it('should create different signatures for different data', () => {
      const data1 = { test: 'data1' };
      const data2 = { test: 'data2' };
      const privateKey = 'test_private_key';
      
      const sig1 = (client as any).createSignature(data1, privateKey);
      const sig2 = (client as any).createSignature(data2, privateKey);
      
      expect(sig1).not.toBe(sig2);
    });
  });
});

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

    it('should create market scope without reputation requirement', () => {
      const scope = DelegationHelpers.createMarketScope('25', '100');
      
      expect(scope.allowedOperations).toEqual([
        'create_market',
        'place_bet',
        'claim_winnings'
      ]);
      expect(scope.minReputationScore).toBeUndefined();
    });
  });

  describe('createGovernanceScope', () => {
    it('should create governance operations scope', () => {
      const scope = DelegationHelpers.createGovernanceScope(80);
      
      expect(scope.allowedOperations).toEqual([
        'vote',
        'delegate_vote',
        'create_proposal'
      ]);
      expect(scope.minReputationScore).toBe(80);
    });

    it('should create governance scope without reputation requirement', () => {
      const scope = DelegationHelpers.createGovernanceScope();
      
      expect(scope.allowedOperations).toEqual([
        'vote',
        'delegate_vote',
        'create_proposal'
      ]);
      expect(scope.minReputationScore).toBeUndefined();
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

    it('should reject scope with max transaction > max total', () => {
      const scope: DelegationScope = {
        allowedOperations: ['transfer'],
        allowedContracts: [],
        maxTransactionAmount: '1000',
        maxTotalAmount: '500',
      };

      const result = DelegationHelpers.validateScope(scope);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Max transaction amount cannot exceed max total amount');
    });

    it('should reject scope with negative reputation score', () => {
      const scope: DelegationScope = {
        allowedOperations: ['vote'],
        allowedContracts: [],
        minReputationScore: -10,
      };

      const result = DelegationHelpers.validateScope(scope);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum reputation score cannot be negative');
    });

    it('should accumulate multiple validation errors', () => {
      const scope: DelegationScope = {
        allowedOperations: [],
        allowedContracts: [],
        maxTransactionAmount: '1000',
        maxTotalAmount: '500',
        minReputationScore: -5,
      };

      const result = DelegationHelpers.validateScope(scope);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });
});

describe('Constants', () => {
  describe('DELEGATION_CONSTANTS', () => {
    it('should have correct duration constants', () => {
      expect(DELEGATION_CONSTANTS.MAX_DELEGATION_DURATION_MS).toBe(24 * 60 * 60 * 1000);
      expect(DELEGATION_CONSTANTS.DEFAULT_DELEGATION_DURATION_MS).toBe(60 * 60 * 1000);
      expect(DELEGATION_CONSTANTS.MAX_SESSION_KEY_LIFETIME_MS).toBe(24 * 60 * 60 * 1000);
    });

    it('should have operation type constants', () => {
      expect(DELEGATION_CONSTANTS.OPERATIONS.TRANSFER).toBe('transfer');
      expect(DELEGATION_CONSTANTS.OPERATIONS.CREATE_MARKET).toBe('create_market');
      expect(DELEGATION_CONSTANTS.OPERATIONS.VOTE).toBe('vote');
    });

    it('should have validation error messages', () => {
      expect(DELEGATION_CONSTANTS.VALIDATION_ERRORS.DELEGATION_NOT_FOUND).toBe('Delegation not found');
      expect(DELEGATION_CONSTANTS.VALIDATION_ERRORS.DELEGATION_EXPIRED).toBe('Delegation has expired');
      expect(DELEGATION_CONSTANTS.VALIDATION_ERRORS.SCOPE_VIOLATION).toBe('Operation not allowed by delegation scope');
    });
  });
});

describe('Error Classes', () => {
  describe('DelegationError', () => {
    it('should create delegation error with code and details', () => {
      const error = new DelegationError('Test error', 'DELEGATION_EXPIRED', { test: 'data' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DelegationError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('DELEGATION_EXPIRED');
      expect(error.details).toEqual({ test: 'data' });
      expect(error.name).toBe('DelegationError');
    });
  });

  describe('DelegationScopeError', () => {
    it('should create validation error as delegation error subclass', () => {
      const error = new DelegationScopeError('Validation failed', { field: 'test' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DelegationError);
      expect(error).toBeInstanceOf(DelegationScopeError);
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('SCOPE_VIOLATION');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('DelegationScopeError');
    });
  });
});

// Mock fetch for integration tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('API Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const client = new DelegationClient({
        ...mockConfig,
        retries: 1,
      });

      await expect(
        client.getDelegations({ limit: 10, offset: 0 })
      ).rejects.toThrow('Network error');
      
      expect(mockFetch).toHaveBeenCalledTimes(1); // 1 attempt + 1 retry = 2, but retries: 1 means 1 total
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const client = new DelegationClient({
        ...mockConfig,
        retries: 1,
      });

      await expect(
        client.getDelegations({ limit: 10, offset: 0 })
      ).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should retry on failure and eventually succeed', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Temporary network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            delegations: [],
            totalCount: 0,
            hasMore: false,
          }),
        });

      const client = new DelegationClient({
        ...mockConfig,
        retries: 2,
      });

      const result = await client.getDelegations({ limit: 10, offset: 0 });
      
      expect(result.delegations).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});