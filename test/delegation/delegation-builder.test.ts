/**
 * TDD Tests for DelegationBuilder Utility Class
 * 
 * These failing tests define the expected behavior for the DelegationBuilder utility
 * which provides helper methods for creating delegation structures, scopes, and validation.
 * 
 * Card: 📦 SDK: Methods for creating and signing delegations (#699621c0d648e9fa7c3f1420)
 * Spec: docs/delegation.md - DelegationBuilder section
 * 
 * @group tdd
 * @group delegation
 * @group delegation-builder
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { randomBytes } from 'crypto';

describe('DelegationBuilder Utility Class: TDD Tests', () => {
  let DelegationBuilder: any;
  let DelegationApproach: any;

  beforeEach(() => {
    // These imports will fail until the DelegationBuilder is implemented
    try {
      const builder = require('../../src/delegation/builder');
      DelegationBuilder = builder.DelegationBuilder;
      DelegationApproach = builder.DelegationApproach;
    } catch (error) {
      // Expected to fail in TDD Red phase
      console.log('Expected import failure during TDD Red phase:', error.message);
    }
  });

  describe('createDelegation', () => {
    it('should create delegation structure with required fields', () => {
      // ARRANGE: Delegation options
      const options = {
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: {
          allowedOperations: ['CreateFiber'],
          maxGasPerTx: 100000
        },
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date(Date.now() + 3600000)
      };

      // ACT: Create delegation structure
      const delegation = DelegationBuilder.createDelegation(options);

      // ASSERT: Should return delegation with all required fields
      expect(delegation).toMatchObject({
        delegationId: expect.stringMatching(/^del_[a-zA-Z0-9]+$/),
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: options.scope,
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
        version: '1.0',
        isActive: true
      });
    });

    it('should generate unique delegation IDs', () => {
      // ARRANGE: Same options for multiple delegations
      const options = {
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: { allowedOperations: ['CreateFiber'] },
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      };

      // ACT: Create multiple delegations
      const delegation1 = DelegationBuilder.createDelegation(options);
      const delegation2 = DelegationBuilder.createDelegation(options);
      const delegation3 = DelegationBuilder.createDelegation(options);

      // ASSERT: Should have unique IDs
      expect(delegation1.delegationId).not.toBe(delegation2.delegationId);
      expect(delegation2.delegationId).not.toBe(delegation3.delegationId);
      expect(delegation1.delegationId).not.toBe(delegation3.delegationId);
    });

    it('should set default expiration if not provided', () => {
      // ARRANGE: Options without expiration
      const options = {
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: { allowedOperations: ['CreateFiber'] },
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      };

      // ACT: Create delegation
      const delegation = DelegationBuilder.createDelegation(options);

      // ASSERT: Should have default expiration (1 hour from now)
      expect(delegation.expiresAt).toBeInstanceOf(Date);
      const expectedExpiry = new Date(Date.now() + 3600000); // 1 hour
      expect(delegation.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -4); // Within 10 seconds
    });

    it('should validate required parameters', () => {
      // ARRANGE: Missing required parameters
      const incompleteOptions = {
        principalAddress: 'DAG123abc...'
        // Missing delegateAddress, scope, approach
      };

      // ACT & ASSERT: Should throw validation error
      expect(() => DelegationBuilder.createDelegation(incompleteOptions))
        .toThrow('Missing required parameter: delegateAddress');
    });
  });

  describe('createSessionKey', () => {
    it('should create session key structure', () => {
      // ARRANGE: Session key options
      const options = {
        delegationId: 'del_abc123',
        sessionPublicKey: '0x1234abcd...',
        sessionExpiresAt: new Date(Date.now() + 1800000), // 30 minutes
        permissions: {
          maxTransactionsPerHour: 10,
          allowedFiberIds: ['fiber-123', 'fiber-456']
        }
      };

      // ACT: Create session key
      const sessionKey = DelegationBuilder.createSessionKey(options);

      // ASSERT: Should return session key structure
      expect(sessionKey).toMatchObject({
        sessionId: expect.stringMatching(/^ses_[a-zA-Z0-9]+$/),
        delegationId: 'del_abc123',
        sessionPublicKey: '0x1234abcd...',
        sessionExpiresAt: expect.any(Date),
        permissions: options.permissions,
        createdAt: expect.any(Date),
        usageCount: 0,
        isActive: true
      });
    });

    it('should validate session key expiration', () => {
      // ARRANGE: Options with past expiration
      const options = {
        delegationId: 'del_abc123',
        sessionPublicKey: '0x1234abcd...',
        sessionExpiresAt: new Date(Date.now() - 3600000) // 1 hour ago
      };

      // ACT & ASSERT: Should throw validation error
      expect(() => DelegationBuilder.createSessionKey(options))
        .toThrow('Session expiration must be in the future');
    });

    it('should set default permissions', () => {
      // ARRANGE: Options without permissions
      const options = {
        delegationId: 'del_abc123',
        sessionPublicKey: '0x1234abcd...'
      };

      // ACT: Create session key
      const sessionKey = DelegationBuilder.createSessionKey(options);

      // ASSERT: Should have default permissions
      expect(sessionKey.permissions).toMatchObject({
        maxTransactionsPerHour: 100,
        maxGasPerTx: 500000,
        allowedFiberIds: []
      });
    });
  });

  describe('createSignedIntent', () => {
    it('should create signed intent structure', () => {
      // ARRANGE: Signed intent options
      const options = {
        delegationId: 'del_abc123',
        transaction: {
          type: 'TransitionFiber',
          fiberId: 'market-fiber-123',
          newState: 'CLOSED'
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
      const signedIntent = DelegationBuilder.createSignedIntent(options);

      // ASSERT: Should return signed intent structure
      expect(signedIntent).toMatchObject({
        intentId: expect.stringMatching(/^int_[a-zA-Z0-9]+$/),
        delegationId: 'del_abc123',
        transaction: options.transaction,
        intentExpiresAt: expect.any(Date),
        executionConditions: options.executionConditions,
        intentNonce: expect.any(String),
        createdAt: expect.any(Date),
        executionStatus: 'pending'
      });
    });

    it('should validate JSON Logic conditions', () => {
      // ARRANGE: Options with invalid JSON Logic
      const options = {
        delegationId: 'del_abc123',
        transaction: { type: 'CreateFiber' },
        executionConditions: {
          'invalid_operator': ['bad', 'condition']
        }
      };

      // ACT & ASSERT: Should throw validation error
      expect(() => DelegationBuilder.createSignedIntent(options))
        .toThrow('Invalid JSON Logic condition: invalid_operator');
    });

    it('should generate unique intent nonces', () => {
      // ARRANGE: Same options for multiple intents
      const options = {
        delegationId: 'del_abc123',
        transaction: { type: 'CreateFiber' },
        executionConditions: { '===': [1, 1] }
      };

      // ACT: Create multiple intents
      const intent1 = DelegationBuilder.createSignedIntent(options);
      const intent2 = DelegationBuilder.createSignedIntent(options);

      // ASSERT: Should have unique nonces
      expect(intent1.intentNonce).not.toBe(intent2.intentNonce);
    });
  });

  describe('createScope', () => {
    it('should create delegation scope with operations', () => {
      // ARRANGE: Scope options
      const options = {
        allowedOperations: ['CreateFiber', 'TransitionFiber', 'DeleteFiber'],
        maxGasPerTx: 150000,
        maxTotalGas: 1000000,
        fiberIds: ['fiber-123', 'fiber-456']
      };

      // ACT: Create scope
      const scope = DelegationBuilder.createScope(options);

      // ASSERT: Should return scope with all constraints
      expect(scope).toMatchObject({
        allowedOperations: ['CreateFiber', 'TransitionFiber', 'DeleteFiber'],
        maxGasPerTx: 150000,
        maxTotalGas: 1000000,
        fiberIds: ['fiber-123', 'fiber-456'],
        type: 'delegationScope',
        version: '1.0'
      });
    });

    it('should validate operation names', () => {
      // ARRANGE: Options with invalid operations
      const options = {
        allowedOperations: ['ValidOperation', 'InvalidOperation']
      };

      // ACT & ASSERT: Should throw validation error
      expect(() => DelegationBuilder.createScope(options))
        .toThrow('Invalid operation: InvalidOperation');
    });

    it('should provide wildcard operation support', () => {
      // ARRANGE: Scope with wildcard operations
      const options = {
        allowedOperations: ['Fiber.*', 'Market.Create*']
      };

      // ACT: Create scope
      const scope = DelegationBuilder.createScope(options);

      // ASSERT: Should include wildcard patterns
      expect(scope.allowedOperations).toEqual(['Fiber.*', 'Market.Create*']);
      expect(scope.wildcardSupported).toBe(true);
    });

    it('should set reasonable defaults', () => {
      // ARRANGE: Minimal scope options
      const options = {
        allowedOperations: ['CreateFiber']
      };

      // ACT: Create scope
      const scope = DelegationBuilder.createScope(options);

      // ASSERT: Should have default values
      expect(scope).toMatchObject({
        allowedOperations: ['CreateFiber'],
        maxGasPerTx: 500000,
        maxTotalGas: 5000000,
        fiberIds: [],
        timeRestrictions: null
      });
    });
  });

  describe('generateKeyPair', () => {
    it('should generate cryptographic key pair', () => {
      // ACT: Generate key pair
      const keyPair = DelegationBuilder.generateKeyPair();

      // ASSERT: Should return valid key pair
      expect(keyPair).toMatchObject({
        publicKey: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
        privateKey: expect.stringMatching(/^[a-fA-F0-9]{64}$/),
        keyType: 'secp256k1'
      });
    });

    it('should generate unique key pairs', () => {
      // ACT: Generate multiple key pairs
      const keyPair1 = DelegationBuilder.generateKeyPair();
      const keyPair2 = DelegationBuilder.generateKeyPair();
      const keyPair3 = DelegationBuilder.generateKeyPair();

      // ASSERT: Should be unique
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
      expect(keyPair2.privateKey).not.toBe(keyPair3.privateKey);
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
    });

    it('should support different key types', () => {
      // ACT: Generate key pairs with different types
      const secp256k1KeyPair = DelegationBuilder.generateKeyPair('secp256k1');
      const ed25519KeyPair = DelegationBuilder.generateKeyPair('ed25519');

      // ASSERT: Should return correct key types
      expect(secp256k1KeyPair.keyType).toBe('secp256k1');
      expect(ed25519KeyPair.keyType).toBe('ed25519');
      
      // Key formats should be different
      expect(secp256k1KeyPair.publicKey.length).toBe(66); // 0x + 64 chars
      expect(ed25519KeyPair.publicKey.length).toBe(66);   // Same format but different curve
    });

    it('should validate generated keys', () => {
      // ACT: Generate key pair
      const keyPair = DelegationBuilder.generateKeyPair();

      // ASSERT: Public key should be derivable from private key
      const derivedPublicKey = DelegationBuilder.derivePublicKey(keyPair.privateKey);
      expect(derivedPublicKey).toBe(keyPair.publicKey);
    });
  });

  describe('validateDelegation', () => {
    it('should validate complete delegation structure', () => {
      // ARRANGE: Valid delegation
      const validDelegation = {
        delegationId: 'del_abc123',
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        principalSignature: '0xabcd1234...',
        scope: {
          allowedOperations: ['CreateFiber'],
          maxGasPerTx: 100000
        },
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        version: '1.0',
        isActive: true
      };

      // ACT: Validate delegation
      const errors = DelegationBuilder.validateDelegation(validDelegation);

      // ASSERT: Should have no errors
      expect(errors).toEqual([]);
    });

    it('should detect missing required fields', () => {
      // ARRANGE: Incomplete delegation
      const incompleteDelegation = {
        delegationId: 'del_abc123',
        principalAddress: 'DAG123abc...'
        // Missing delegateAddress, scope, approach, etc.
      };

      // ACT: Validate delegation
      const errors = DelegationBuilder.validateDelegation(incompleteDelegation);

      // ASSERT: Should return validation errors
      expect(errors).toContain(
        expect.objectContaining({
          field: 'delegateAddress',
          message: 'Missing required field: delegateAddress'
        })
      );
      expect(errors).toContain(
        expect.objectContaining({
          field: 'scope',
          message: 'Missing required field: scope'
        })
      );
    });

    it('should validate address formats', () => {
      // ARRANGE: Delegation with invalid addresses
      const delegationWithInvalidAddresses = {
        delegationId: 'del_abc123',
        principalAddress: 'invalid-address',
        delegateAddress: 'also-invalid',
        scope: { allowedOperations: ['CreateFiber'] },
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      };

      // ACT: Validate delegation
      const errors = DelegationBuilder.validateDelegation(delegationWithInvalidAddresses);

      // ASSERT: Should return address format errors
      expect(errors).toContain(
        expect.objectContaining({
          field: 'principalAddress',
          message: 'Invalid address format'
        })
      );
      expect(errors).toContain(
        expect.objectContaining({
          field: 'delegateAddress',
          message: 'Invalid address format'
        })
      );
    });

    it('should validate expiration dates', () => {
      // ARRANGE: Delegation with past expiration
      const expiredDelegation = {
        delegationId: 'del_expired',
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: { allowedOperations: ['CreateFiber'] },
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date(Date.now() - 3600000) // 1 hour ago
      };

      // ACT: Validate delegation
      const errors = DelegationBuilder.validateDelegation(expiredDelegation);

      // ASSERT: Should return expiration error
      expect(errors).toContain(
        expect.objectContaining({
          field: 'expiresAt',
          message: 'Delegation has expired'
        })
      );
    });

    it('should validate scope constraints', () => {
      // ARRANGE: Delegation with invalid scope
      const delegationWithInvalidScope = {
        delegationId: 'del_abc123',
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: {
          allowedOperations: ['InvalidOperation'],
          maxGasPerTx: -100 // Invalid negative value
        },
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      };

      // ACT: Validate delegation
      const errors = DelegationBuilder.validateDelegation(delegationWithInvalidScope);

      // ASSERT: Should return scope validation errors
      expect(errors).toContain(
        expect.objectContaining({
          field: 'scope.allowedOperations',
          message: 'Invalid operation: InvalidOperation'
        })
      );
      expect(errors).toContain(
        expect.objectContaining({
          field: 'scope.maxGasPerTx',
          message: 'Gas limit must be positive'
        })
      );
    });

    it('should validate signature format', () => {
      // ARRANGE: Delegation with invalid signature
      const delegationWithInvalidSignature = {
        delegationId: 'del_abc123',
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        principalSignature: 'not-a-hex-signature',
        scope: { allowedOperations: ['CreateFiber'] },
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY
      };

      // ACT: Validate delegation
      const errors = DelegationBuilder.validateDelegation(delegationWithInvalidSignature);

      // ASSERT: Should return signature format error
      expect(errors).toContain(
        expect.objectContaining({
          field: 'principalSignature',
          message: 'Invalid signature format'
        })
      );
    });
  });

  describe('Utility Methods', () => {
    it('should check if operation is allowed by scope', () => {
      // ARRANGE: Scope and operation
      const scope = {
        allowedOperations: ['CreateFiber', 'TransitionFiber']
      };
      
      // ACT & ASSERT: Should correctly identify allowed/disallowed operations
      expect(DelegationBuilder.isOperationAllowed('CreateFiber', scope)).toBe(true);
      expect(DelegationBuilder.isOperationAllowed('TransitionFiber', scope)).toBe(true);
      expect(DelegationBuilder.isOperationAllowed('DeleteFiber', scope)).toBe(false);
    });

    it('should handle wildcard operations', () => {
      // ARRANGE: Scope with wildcards
      const wildcardScope = {
        allowedOperations: ['Fiber.*', 'Market.Create*']
      };
      
      // ACT & ASSERT: Should match wildcard patterns
      expect(DelegationBuilder.isOperationAllowed('Fiber.Create', wildcardScope)).toBe(true);
      expect(DelegationBuilder.isOperationAllowed('Fiber.Update', wildcardScope)).toBe(true);
      expect(DelegationBuilder.isOperationAllowed('Market.CreateEscrow', wildcardScope)).toBe(true);
      expect(DelegationBuilder.isOperationAllowed('Market.UpdateEscrow', wildcardScope)).toBe(false);
      expect(DelegationBuilder.isOperationAllowed('Contract.Create', wildcardScope)).toBe(false);
    });

    it('should calculate remaining gas allowance', () => {
      // ARRANGE: Scope with gas limits and usage
      const scope = {
        maxGasPerTx: 100000,
        maxTotalGas: 1000000
      };
      const currentUsage = 750000;

      // ACT: Calculate remaining gas
      const remainingGas = DelegationBuilder.getRemainingGasAllowance(scope, currentUsage);

      // ASSERT: Should return correct remaining amount
      expect(remainingGas).toMatchObject({
        remainingTotal: 250000,
        maxPerTx: 100000,
        canExecute: true
      });
    });

    it('should check time-based constraints', () => {
      // ARRANGE: Scope with time restrictions
      const now = new Date();
      const timeRestrictedScope = {
        allowedOperations: ['CreateFiber'],
        timeRestrictions: {
          allowedHours: [9, 10, 11, 12, 13, 14, 15, 16, 17], // Business hours
          timezone: 'UTC',
          allowWeekends: false
        }
      };

      // Mock current time to be during business hours on weekday
      const businessHourTime = new Date('2024-01-15T14:00:00Z'); // Monday 2PM UTC

      // ACT: Check time constraint
      const isAllowedNow = DelegationBuilder.isTimeAllowed(timeRestrictedScope, businessHourTime);

      // ASSERT: Should be allowed during business hours
      expect(isAllowedNow).toBe(true);

      // Test weekend restriction
      const weekendTime = new Date('2024-01-14T14:00:00Z'); // Sunday 2PM UTC
      const isAllowedWeekend = DelegationBuilder.isTimeAllowed(timeRestrictedScope, weekendTime);
      expect(isAllowedWeekend).toBe(false);
    });

    it('should serialize and deserialize delegations', () => {
      // ARRANGE: Complex delegation object
      const originalDelegation = {
        delegationId: 'del_serialize_test',
        principalAddress: 'DAG123abc...',
        delegateAddress: 'DAG789def...',
        scope: {
          allowedOperations: ['CreateFiber', 'TransitionFiber'],
          maxGasPerTx: 150000,
          timeRestrictions: {
            allowedHours: [9, 10, 11, 12, 13, 14, 15, 16, 17]
          }
        },
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date('2024-12-31T23:59:59Z'),
        createdAt: new Date('2024-01-01T00:00:00Z')
      };

      // ACT: Serialize and deserialize
      const serialized = DelegationBuilder.serialize(originalDelegation);
      const deserialized = DelegationBuilder.deserialize(serialized);

      // ASSERT: Should maintain data integrity
      expect(deserialized).toEqual(originalDelegation);
      expect(deserialized.expiresAt).toBeInstanceOf(Date);
      expect(deserialized.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Integration with JSON Logic', () => {
    it('should validate JSON Logic expressions', () => {
      // ARRANGE: Various JSON Logic expressions
      const validExpressions = [
        { '===': [1, 1] },
        { 'and': [true, { '>': [2, 1] }] },
        { 'in': [{ 'var': 'status' }, ['active', 'pending']] }
      ];

      const invalidExpressions = [
        { 'unknown_operator': [1, 2] },
        { 'and': 'not_an_array' },
        { '===': [1] } // Missing operand
      ];

      // ACT & ASSERT: Should validate correctly
      validExpressions.forEach(expr => {
        expect(() => DelegationBuilder.validateJSONLogic(expr)).not.toThrow();
      });

      invalidExpressions.forEach(expr => {
        expect(() => DelegationBuilder.validateJSONLogic(expr)).toThrow();
      });
    });

    it('should extract variables from JSON Logic expressions', () => {
      // ARRANGE: JSON Logic with variables
      const expression = {
        'and': [
          { '>=': [{ 'var': 'currentTime' }, { 'var': 'startTime' }] },
          { '<=': [{ 'var': 'marketVolume' }, 5000] },
          { '===': [{ 'var': 'userStatus' }, 'active'] }
        ]
      };

      // ACT: Extract variables
      const variables = DelegationBuilder.extractJSONLogicVariables(expression);

      // ASSERT: Should identify all variables
      expect(variables).toEqual(new Set(['currentTime', 'startTime', 'marketVolume', 'userStatus']));
    });
  });
});