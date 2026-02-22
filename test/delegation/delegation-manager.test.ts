/**
 * TDD Tests for DelegationManager Class
 * 
 * These failing tests define the expected behavior for the DelegationManager class
 * which provides central management for delegation lifecycle operations.
 * 
 * Card: 📦 SDK: Methods for creating and signing delegations (#699621c0d648e9fa7c3f1420)
 * Spec: docs/delegation.md - DelegationManager section
 * 
 * @group tdd
 * @group delegation
 * @group delegation-manager
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// Mock network calls
jest.mock('../src/network', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

import { post, get } from '../src/network';
const mockPost = post as jest.MockedFunction<typeof post>;
const mockGet = get as jest.MockedFunction<typeof get>;

describe('DelegationManager Class: TDD Tests', () => {
  let DelegationManager: any;
  let DelegationBuilder: any;
  let DelegationApproach: any;
  let FeePaymentMethod: any;
  let manager: any;
  let mockSigningFunction: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock signing function
    mockSigningFunction = jest.fn().mockResolvedValue({
      signature: '0xabcd1234...',
      publicKey: '0x1234abcd...'
    });

    // These imports will fail until the DelegationManager is implemented
    try {
      const delegation = require('../../src/delegation/manager');
      DelegationManager = delegation.DelegationManager;
      DelegationBuilder = delegation.DelegationBuilder;
      DelegationApproach = delegation.DelegationApproach;
      FeePaymentMethod = delegation.FeePaymentMethod;
      
      // Create manager instance
      manager = new DelegationManager({
        bridgeUrl: 'https://bridge.ottochain.ai',
        defaultGasConfig: {
          gasLimit: 500000,
          paymentMethod: FeePaymentMethod.FEE_PAYMENT_METHOD_RELAYER_PAYS
        },
        timeout: 30000
      });
    } catch (error) {
      // Expected to fail in TDD Red phase
      console.log('Expected import failure during TDD Red phase:', error.message);
    }
  });

  afterEach(() => {
    // Clean up any intervals or timeouts
    jest.clearAllTimers();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with valid configuration', () => {
      // ARRANGE: Configuration object
      const config = {
        bridgeUrl: 'https://bridge.ottochain.ai',
        defaultGasConfig: {
          gasLimit: 500000,
          paymentMethod: FeePaymentMethod.FEE_PAYMENT_METHOD_RELAYER_PAYS
        },
        timeout: 30000
      };

      // ACT: Create DelegationManager
      const delegationManager = new DelegationManager(config);

      // ASSERT: Should initialize correctly
      expect(delegationManager.config).toMatchObject(config);
      expect(delegationManager.activeDelegations).toEqual(new Map());
    });

    it('should use default configuration values', () => {
      // ARRANGE: Minimal configuration
      const minimalConfig = {
        bridgeUrl: 'https://bridge.ottochain.ai'
      };

      // ACT: Create DelegationManager with defaults
      const delegationManager = new DelegationManager(minimalConfig);

      // ASSERT: Should use defaults
      expect(delegationManager.config).toMatchObject({
        bridgeUrl: 'https://bridge.ottochain.ai',
        timeout: 30000,
        defaultGasConfig: expect.objectContaining({
          gasLimit: expect.any(Number)
        })
      });
    });

    it('should validate bridge URL format', () => {
      // ARRANGE: Invalid bridge URL
      const invalidConfig = {
        bridgeUrl: 'not-a-url'
      };

      // ACT & ASSERT: Should throw configuration error
      expect(() => new DelegationManager(invalidConfig))
        .toThrow('Invalid bridge URL format');
    });
  });

  describe('createDelegation', () => {
    it('should create and sign delegation', async () => {
      // ARRANGE: Delegation parameters
      const delegationOptions = {
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: DelegationBuilder.createScope({
          allowedOperations: ['CreateFiber', 'TransitionFiber'],
          maxGasPerTx: 100000
        }),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      };

      // ACT: Create delegation
      const delegation = await manager.createDelegation(delegationOptions, mockSigningFunction);

      // ASSERT: Should call signing function
      expect(mockSigningFunction).toHaveBeenCalledWith(
        expect.stringContaining('delegation')
      );

      // ASSERT: Should return signed delegation
      expect(delegation).toMatchObject({
        delegationId: expect.any(String),
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        principalSignature: '0xabcd1234...',
        publicKey: '0x1234abcd...',
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        scope: expect.any(Object),
        createdAt: expect.any(Date)
      });
    });

    it('should store delegation in active delegations', async () => {
      // ARRANGE: Delegation options
      const delegationOptions = {
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: DelegationBuilder.createScope({
          allowedOperations: ['CreateFiber']
        }),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      };

      // ACT: Create delegation
      const delegation = await manager.createDelegation(delegationOptions, mockSigningFunction);

      // ASSERT: Should be stored in active delegations
      expect(manager.activeDelegations.has(delegation.delegationId)).toBe(true);
      expect(manager.activeDelegations.get(delegation.delegationId)).toEqual(delegation);
    });

    it('should validate delegation scope', async () => {
      // ARRANGE: Invalid scope
      const invalidOptions = {
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: {
          allowedOperations: ['InvalidOperation']
        },
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      };

      // ACT & ASSERT: Should throw validation error
      await expect(manager.createDelegation(invalidOptions, mockSigningFunction))
        .rejects.toThrow('Invalid operation: InvalidOperation');
    });

    it('should handle signing function errors', async () => {
      // ARRANGE: Signing function that throws
      const faultySigningFunction = jest.fn().mockRejectedValue(new Error('Signing failed'));
      
      const delegationOptions = {
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: DelegationBuilder.createScope({
          allowedOperations: ['CreateFiber']
        }),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      };

      // ACT & ASSERT: Should propagate signing error
      await expect(manager.createDelegation(delegationOptions, faultySigningFunction))
        .rejects.toThrow('Signing failed');
    });
  });

  describe('createSessionKey', () => {
    it('should create session key for existing delegation', async () => {
      // ARRANGE: Existing delegation
      const delegation = {
        delegationId: 'del_abc123',
        principalAddress: 'DAG123abc...',
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      };
      
      manager.activeDelegations.set(delegation.delegationId, delegation);

      const sessionKeyPair = {
        publicKey: '0x1234abcd...',
        privateKey: '0xabcd1234...'
      };

      // ACT: Create session key
      const sessionKey = await manager.createSessionKey({
        delegationId: delegation.delegationId,
        sessionKeyPair,
        sessionExpiresAt: new Date(Date.now() + 1800000) // 30 minutes
      }, mockSigningFunction);

      // ASSERT: Should return session key
      expect(sessionKey).toMatchObject({
        delegationId: delegation.delegationId,
        sessionPublicKey: sessionKeyPair.publicKey,
        sessionExpiresAt: expect.any(Date),
        principalSignature: '0xabcd1234...',
        createdAt: expect.any(Date)
      });
    });

    it('should validate delegation exists', async () => {
      // ARRANGE: Non-existent delegation
      const sessionOptions = {
        delegationId: 'del_nonexistent',
        sessionKeyPair: {
          publicKey: '0x1234abcd...',
          privateKey: '0xabcd1234...'
        }
      };

      // ACT & ASSERT: Should throw not found error
      await expect(manager.createSessionKey(sessionOptions, mockSigningFunction))
        .rejects.toThrow('Delegation del_nonexistent not found');
    });

    it('should validate session key approach', async () => {
      // ARRANGE: Delegation with wrong approach
      const delegation = {
        delegationId: 'del_abc123',
        approach: DelegationApproach.DELEGATION_APPROACH_SIGNED_INTENT // Wrong approach
      };
      
      manager.activeDelegations.set(delegation.delegationId, delegation);

      const sessionOptions = {
        delegationId: delegation.delegationId,
        sessionKeyPair: {
          publicKey: '0x1234abcd...',
          privateKey: '0xabcd1234...'
        }
      };

      // ACT & ASSERT: Should throw approach error
      await expect(manager.createSessionKey(sessionOptions, mockSigningFunction))
        .rejects.toThrow('Session keys only supported for DELEGATION_APPROACH_SESSION_KEY');
    });
  });

  describe('createSignedIntent', () => {
    it('should create signed intent for existing delegation', async () => {
      // ARRANGE: Existing delegation with signed intent approach
      const delegation = {
        delegationId: 'del_abc123',
        principalAddress: 'DAG123abc...',
        approach: DelegationApproach.DELEGATION_APPROACH_SIGNED_INTENT
      };
      
      manager.activeDelegations.set(delegation.delegationId, delegation);

      const intentOptions = {
        delegationId: delegation.delegationId,
        transaction: {
          type: 'TransitionFiber',
          fiberId: 'market-fiber-123',
          newState: 'OPEN'
        },
        intentExpiresAt: new Date(Date.now() + 600000), // 10 minutes
        executionConditions: {
          'and': [
            { '>=': [{ 'var': 'currentTime' }, 1640995200] },
            { '<=': [{ 'var': 'marketVolume' }, 5000] }
          ]
        }
      };

      // ACT: Create signed intent
      const signedIntent = await manager.createSignedIntent(intentOptions, mockSigningFunction);

      // ASSERT: Should return signed intent
      expect(signedIntent).toMatchObject({
        delegationId: delegation.delegationId,
        transaction: intentOptions.transaction,
        intentExpiresAt: expect.any(Date),
        executionConditions: intentOptions.executionConditions,
        principalSignature: '0xabcd1234...',
        intentNonce: expect.any(String),
        createdAt: expect.any(Date)
      });
    });

    it('should validate JSON Logic conditions', async () => {
      // ARRANGE: Delegation and invalid conditions
      const delegation = {
        delegationId: 'del_abc123',
        approach: DelegationApproach.DELEGATION_APPROACH_SIGNED_INTENT
      };
      
      manager.activeDelegations.set(delegation.delegationId, delegation);

      const intentOptions = {
        delegationId: delegation.delegationId,
        transaction: { type: 'CreateFiber' },
        executionConditions: {
          'invalid_operator': ['bad', 'condition']
        }
      };

      // ACT & ASSERT: Should throw validation error
      await expect(manager.createSignedIntent(intentOptions, mockSigningFunction))
        .rejects.toThrow('Invalid JSON Logic condition');
    });
  });

  describe('submitDelegation', () => {
    it('should submit delegation to bridge', async () => {
      // ARRANGE: Signed delegation
      const delegation = {
        delegationId: 'del_abc123',
        principalAddress: 'DAG123abc...',
        principalSignature: '0xabcd1234...',
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      };

      // Mock successful bridge response
      mockPost.mockResolvedValue({
        success: true,
        delegationId: delegation.delegationId,
        status: 'active'
      });

      // ACT: Submit delegation
      const result = await manager.submitDelegation(delegation);

      // ASSERT: Should make correct API call
      expect(mockPost).toHaveBeenCalledWith(
        'https://bridge.ottochain.ai/delegation/register',
        delegation
      );

      // ASSERT: Should return result
      expect(result).toMatchObject({
        success: true,
        delegationId: delegation.delegationId,
        status: 'active'
      });
    });

    it('should handle submission errors', async () => {
      // ARRANGE: Delegation and error response
      const delegation = {
        delegationId: 'del_abc123',
        principalSignature: '0xabcd1234...'
      };

      // Mock bridge error
      mockPost.mockResolvedValue({
        success: false,
        error: 'INVALID_SIGNATURE',
        message: 'Signature verification failed'
      });

      // ACT & ASSERT: Should throw bridge error
      await expect(manager.submitDelegation(delegation))
        .rejects.toThrow('Bridge error: INVALID_SIGNATURE - Signature verification failed');
    });
  });

  describe('getDelegationStatus', () => {
    it('should fetch delegation status from bridge', async () => {
      // ARRANGE: Delegation ID and mock status
      const delegationId = 'del_abc123';
      const mockStatus = {
        delegationId,
        active: true,
        usageCount: 3,
        lastUsed: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      mockGet.mockResolvedValue(mockStatus);

      // ACT: Get delegation status
      const status = await manager.getDelegationStatus(delegationId);

      // ASSERT: Should make correct API call
      expect(mockGet).toHaveBeenCalledWith(
        'https://bridge.ottochain.ai/delegation/del_abc123/status'
      );

      // ASSERT: Should return parsed status
      expect(status).toMatchObject({
        delegationId,
        active: true,
        usageCount: 3,
        lastUsed: expect.any(Date),
        expiresAt: expect.any(Date)
      });
    });

    it('should update local delegation cache', async () => {
      // ARRANGE: Local delegation and updated status
      const delegationId = 'del_abc123';
      const localDelegation = {
        delegationId,
        usageCount: 1
      };
      
      manager.activeDelegations.set(delegationId, localDelegation);

      const updatedStatus = {
        delegationId,
        active: true,
        usageCount: 5
      };

      mockGet.mockResolvedValue(updatedStatus);

      // ACT: Get status
      await manager.getDelegationStatus(delegationId);

      // ASSERT: Should update local cache
      const cachedDelegation = manager.activeDelegations.get(delegationId);
      expect(cachedDelegation.usageCount).toBe(5);
    });
  });

  describe('revokeDelegation', () => {
    it('should create and sign revocation', async () => {
      // ARRANGE: Existing delegation
      const delegationId = 'del_abc123';
      const delegation = {
        delegationId,
        principalAddress: 'DAG123abc...'
      };
      
      manager.activeDelegations.set(delegationId, delegation);

      // ACT: Revoke delegation
      const revocation = await manager.revokeDelegation(
        delegationId,
        'No longer needed',
        mockSigningFunction
      );

      // ASSERT: Should call signing function
      expect(mockSigningFunction).toHaveBeenCalledWith(
        expect.stringContaining(delegationId)
      );

      // ASSERT: Should return signed revocation
      expect(revocation).toMatchObject({
        delegationId,
        reason: 'No longer needed',
        principalSignature: '0xabcd1234...',
        revokedAt: expect.any(Date),
        revocationId: expect.any(String)
      });
    });

    it('should remove delegation from active cache', async () => {
      // ARRANGE: Active delegation
      const delegationId = 'del_abc123';
      const delegation = { delegationId };
      
      manager.activeDelegations.set(delegationId, delegation);

      // ACT: Revoke delegation
      await manager.revokeDelegation(delegationId, 'Test revocation', mockSigningFunction);

      // ASSERT: Should remove from cache
      expect(manager.activeDelegations.has(delegationId)).toBe(false);
    });
  });

  describe('getActiveDelegations', () => {
    it('should return list of active delegations', () => {
      // ARRANGE: Multiple active delegations
      const delegation1 = { delegationId: 'del_abc123', active: true };
      const delegation2 = { delegationId: 'del_def456', active: true };
      const delegation3 = { delegationId: 'del_ghi789', active: false };

      manager.activeDelegations.set('del_abc123', delegation1);
      manager.activeDelegations.set('del_def456', delegation2);
      manager.activeDelegations.set('del_ghi789', delegation3);

      // ACT: Get active delegations
      const activeDelegations = manager.getActiveDelegations();

      // ASSERT: Should return only active delegations
      expect(activeDelegations).toHaveLength(2);
      expect(activeDelegations).toContainEqual(delegation1);
      expect(activeDelegations).toContainEqual(delegation2);
      expect(activeDelegations).not.toContainEqual(delegation3);
    });

    it('should return empty array when no active delegations', () => {
      // ARRANGE: Empty delegation cache
      manager.activeDelegations.clear();

      // ACT: Get active delegations
      const activeDelegations = manager.getActiveDelegations();

      // ASSERT: Should return empty array
      expect(activeDelegations).toEqual([]);
    });
  });

  describe('cleanup', () => {
    it('should remove expired delegations', async () => {
      // ARRANGE: Mix of expired and active delegations
      const now = new Date();
      const expired = new Date(now.getTime() - 3600000); // 1 hour ago
      const active = new Date(now.getTime() + 3600000); // 1 hour from now

      const expiredDelegation = {
        delegationId: 'del_expired',
        expiresAt: expired
      };

      const activeDelegation = {
        delegationId: 'del_active',
        expiresAt: active
      };

      manager.activeDelegations.set('del_expired', expiredDelegation);
      manager.activeDelegations.set('del_active', activeDelegation);

      // ACT: Run cleanup
      const cleanupResult = await manager.cleanup();

      // ASSERT: Should remove expired delegation
      expect(manager.activeDelegations.has('del_expired')).toBe(false);
      expect(manager.activeDelegations.has('del_active')).toBe(true);

      // ASSERT: Should return cleanup stats
      expect(cleanupResult).toMatchObject({
        removed: 1,
        remaining: 1,
        errors: 0
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      // ARRANGE: Delegation with cleanup error
      const problematicDelegation = {
        delegationId: 'del_problematic',
        expiresAt: new Date(Date.now() - 3600000),
        onCleanup: () => { throw new Error('Cleanup error'); }
      };

      manager.activeDelegations.set('del_problematic', problematicDelegation);

      // ACT: Run cleanup
      const cleanupResult = await manager.cleanup();

      // ASSERT: Should handle error gracefully
      expect(cleanupResult.errors).toBe(1);
      expect(manager.activeDelegations.has('del_problematic')).toBe(true); // Should not remove if error
    });
  });

  describe('Event Handling', () => {
    it('should emit events for delegation lifecycle', async () => {
      // ARRANGE: Event listeners
      const delegationCreatedSpy = jest.fn();
      const delegationRevokedSpy = jest.fn();

      manager.on('delegationCreated', delegationCreatedSpy);
      manager.on('delegationRevoked', delegationRevokedSpy);

      // ACT: Create and revoke delegation
      const delegation = await manager.createDelegation({
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: DelegationBuilder.createScope({ allowedOperations: ['CreateFiber'] }),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      }, mockSigningFunction);

      await manager.revokeDelegation(delegation.delegationId, 'Test', mockSigningFunction);

      // ASSERT: Should emit events
      expect(delegationCreatedSpy).toHaveBeenCalledWith(delegation);
      expect(delegationRevokedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          delegationId: delegation.delegationId
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete delegation management workflow', async () => {
      // ARRANGE: Complete workflow
      const delegationOptions = {
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: DelegationBuilder.createScope({
          allowedOperations: ['CreateFiber', 'TransitionFiber'],
          maxGasPerTx: 100000
        }),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      };

      // Mock bridge responses
      mockPost.mockResolvedValue({ success: true, delegationId: 'del_abc123' });
      mockGet.mockResolvedValue({ 
        delegationId: 'del_abc123', 
        active: true, 
        usageCount: 0 
      });

      // ACT: Execute complete workflow
      // 1. Create delegation
      const delegation = await manager.createDelegation(delegationOptions, mockSigningFunction);
      
      // 2. Submit to bridge
      await manager.submitDelegation(delegation);
      
      // 3. Create session key
      const sessionKeyPair = DelegationBuilder.generateKeyPair();
      const sessionKey = await manager.createSessionKey({
        delegationId: delegation.delegationId,
        sessionKeyPair
      }, mockSigningFunction);
      
      // 4. Check status
      const status = await manager.getDelegationStatus(delegation.delegationId);
      
      // 5. Revoke delegation
      const revocation = await manager.revokeDelegation(
        delegation.delegationId, 
        'Workflow complete', 
        mockSigningFunction
      );

      // ASSERT: All operations should complete successfully
      expect(delegation.delegationId).toBeTruthy();
      expect(sessionKey.delegationId).toBe(delegation.delegationId);
      expect(status.active).toBe(true);
      expect(revocation.delegationId).toBe(delegation.delegationId);
      expect(manager.activeDelegations.has(delegation.delegationId)).toBe(false);
    });
  });
});