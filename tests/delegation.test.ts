/**
 * Tests for delegation functionality
 */

import {
  createDelegation,
  signDelegation,
  isDelegationValid,
  revokeDelegation,
  signRevocation,
  timeWindow,
  actionFilter,
  amountLimit,
  combineScopes,
  createRelayedTransaction,
  DelegationApproach,
  FeePaymentMethod,
  GasConfig,
} from '../src/index.js';
import { generateKeyPair } from '../src/metakit/index.js';

describe('Delegation System', () => {
  let userKeyPair: any;
  let relayerKeyPair: any;

  beforeAll(async () => {
    userKeyPair = generateKeyPair();
    relayerKeyPair = generateKeyPair();
  });

  describe('Basic Delegation Creation', () => {
    it('should create a valid delegation', async () => {
      const delegation = createDelegation({
        principalAddress: userKeyPair.address,
        delegateAddress: relayerKeyPair.address,
        scope: combineScopes(
          actionFilter(['TransferTokens']),
          amountLimit(100)
        ),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours
      });

      expect(delegation.delegationId).toBeDefined();
      expect(delegation.principalAddress).toBe(userKeyPair.address);
      expect(delegation.delegateAddress).toBe(relayerKeyPair.address);
      expect(delegation.approach).toBe(DelegationApproach.DELEGATION_APPROACH_SESSION_KEY);
      expect(delegation.scope?.allowedOperations).toContain('TransferTokens');
    });

    it('should sign a delegation', async () => {
      const delegation = createDelegation({
        principalAddress: userKeyPair.address,
        delegateAddress: relayerKeyPair.address,
        scope: actionFilter(['TransferTokens']),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date(Date.now() + 86400000),
      });

      const signedDelegation = await signDelegation(delegation, userKeyPair.privateKey);

      expect(signedDelegation.principalSignature).toBeDefined();
      expect(signedDelegation.principalSignature).not.toBe('');
    });

    it('should validate a properly formed delegation', async () => {
      const delegation = createDelegation({
        principalAddress: userKeyPair.address,
        delegateAddress: relayerKeyPair.address,
        scope: actionFilter(['TransferTokens']),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date(Date.now() + 86400000),
      });

      const signedDelegation = await signDelegation(delegation, userKeyPair.privateKey);
      const validation = isDelegationValid(signedDelegation);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject expired delegation', async () => {
      const delegation = createDelegation({
        principalAddress: userKeyPair.address,
        delegateAddress: relayerKeyPair.address,
        scope: actionFilter(['TransferTokens']),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date(Date.now() - 1000), // Already expired
      });

      const signedDelegation = await signDelegation(delegation, userKeyPair.privateKey);
      const validation = isDelegationValid(signedDelegation);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Delegation has expired');
    });

    it('should reject delegation without signature', () => {
      const delegation = createDelegation({
        principalAddress: userKeyPair.address,
        delegateAddress: relayerKeyPair.address,
        scope: actionFilter(['TransferTokens']),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date(Date.now() + 86400000),
      });

      const validation = isDelegationValid(delegation);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing principal signature');
    });
  });

  describe('Scope Helpers', () => {
    it('should create time window scope', () => {
      const start = new Date();
      const end = new Date(Date.now() + 86400000);
      const scope = timeWindow(start, end);

      expect(scope.policyRules).toBeDefined();
    });

    it('should create action filter scope', () => {
      const scope = actionFilter(['TransferTokens', 'UpdateProfile']);

      expect(scope.allowedOperations).toEqual(['TransferTokens', 'UpdateProfile']);
    });

    it('should create amount limit scope', () => {
      const scope = amountLimit(500);

      expect(scope.policyRules).toBeDefined();
    });

    it('should combine multiple scopes', () => {
      const combined = combineScopes(
        actionFilter(['TransferTokens']),
        amountLimit(100),
        { fiberIds: ['test-fiber'] }
      );

      expect(combined.allowedOperations).toContain('TransferTokens');
      expect(combined.fiberIds).toContain('test-fiber');
      expect(combined.policyRules).toBeDefined();
    });
  });

  describe('Delegation Revocation', () => {
    it('should create revocation message', () => {
      const revocation = revokeDelegation('test-delegation-id', 'Test reason');

      expect(revocation.delegationId).toBe('test-delegation-id');
      expect(revocation.reason).toBe('Test reason');
      expect(revocation.revokedAt).toBeInstanceOf(Date);
      expect(revocation.nonce).toBeDefined();
    });
  });

  describe('Relayed Transactions', () => {
    it('should create relayed transaction with session key proof', () => {
      const gasConfig: GasConfig = {
        gasLimit: 21000,
        gasPrice: 1000,
        paymentMethod: FeePaymentMethod.FEE_PAYMENT_METHOD_RELAYER_PAYS,
      };

      const sessionKeyProof = {
        sessionKey: {
          delegationId: 'test-delegation',
          sessionPublicKey: 'test-pub-key',
          sessionExpiresAt: new Date(),
          authorizationSignature: 'test-sig',
        },
        transactionSignature: 'test-tx-sig',
      };

      const transaction = createRelayedTransaction(
        { type: 'TransferTokens', amount: 100 },
        { type: 'sessionKey', proof: sessionKeyProof },
        gasConfig,
        relayerKeyPair.address
      );

      expect(transaction.relayerAddress).toBe(relayerKeyPair.address);
      expect(transaction.gasConfig).toEqual(gasConfig);
      expect(transaction.transaction).toBeDefined();
      expect(transaction.delegationProof).toHaveProperty('$case', 'sessionKeyProof');
    });
  });

  describe('Edge Cases', () => {
    it('should generate unique delegation IDs', async () => {
      const delegation1 = createDelegation({
        principalAddress: userKeyPair.address,
        delegateAddress: relayerKeyPair.address,
        scope: actionFilter(['TransferTokens']),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date(Date.now() + 86400000),
      });

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));

      const delegation2 = createDelegation({
        principalAddress: userKeyPair.address,
        delegateAddress: relayerKeyPair.address,
        scope: actionFilter(['TransferTokens']),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date(Date.now() + 86400000),
      });

      expect(delegation1.delegationId).not.toBe(delegation2.delegationId);
    });

    it('should handle delegation without metadata', async () => {
      const delegation = createDelegation({
        principalAddress: userKeyPair.address,
        delegateAddress: relayerKeyPair.address,
        scope: actionFilter(['TransferTokens']),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date(Date.now() + 86400000),
        // No metadata provided
      });

      expect(delegation.metadata).toBeUndefined();

      const signedDelegation = await signDelegation(delegation, userKeyPair.privateKey);
      const validation = isDelegationValid(signedDelegation);

      expect(validation.valid).toBe(true);
    });

    it('should handle delegation with metadata', async () => {
      const metadata = {
        purpose: 'test-delegation',
        version: '1.0',
        tags: ['testing', 'sdk'],
      };

      const delegation = createDelegation({
        principalAddress: userKeyPair.address,
        delegateAddress: relayerKeyPair.address,
        scope: actionFilter(['TransferTokens']),
        approach: DelegationApproach.DELEGATION_APPROACH_SESSION_KEY,
        expiresAt: new Date(Date.now() + 86400000),
        metadata,
      });

      expect(delegation.metadata).toBeDefined();
    });
  });

  describe('New SDK Methods', () => {
    it('should sign a revocation', async () => {
      const revocation = revokeDelegation('test-delegation-id', 'Test reason');
      const signedRevocation = await signRevocation(revocation, userKeyPair.privateKey);

      expect(signedRevocation.revocationSignature).toBeDefined();
      expect(signedRevocation.revocationSignature).not.toBe('');
      expect(signedRevocation.delegationId).toBe('test-delegation-id');
      expect(signedRevocation.reason).toBe('Test reason');
    });

    it('should handle revocation without reason', async () => {
      const revocation = revokeDelegation('test-delegation-id');
      const signedRevocation = await signRevocation(revocation, userKeyPair.privateKey);

      expect(signedRevocation.revocationSignature).toBeDefined();
      expect(signedRevocation.reason).toBeUndefined();
    });

    // Note: Bridge integration tests would require a running bridge service
    // These are placeholder tests for the API structure
    it('should have correct API structure for submitDelegated', () => {
      // Import the function to verify it exists
      const { submitDelegated } = require('../src/delegation.js');
      expect(typeof submitDelegated).toBe('function');
      expect(submitDelegated.length).toBe(3); // transaction, delegation, bridgeUrl
    });

    it('should have correct API structure for getDelegationStatus', () => {
      const { getDelegationStatus } = require('../src/delegation.js');
      expect(typeof getDelegationStatus).toBe('function');
      expect(getDelegationStatus.length).toBe(2); // delegationId, bridgeUrl
    });

    it('should have correct API structure for listDelegations', () => {
      const { listDelegations } = require('../src/delegation.js');
      expect(typeof listDelegations).toBe('function');
      expect(listDelegations.length).toBe(1); // principalAddress (options has default value)
    });

    it('should have correct API structure for submitRevocation', () => {
      const { submitRevocation } = require('../src/delegation.js');
      expect(typeof submitRevocation).toBe('function');
      expect(submitRevocation.length).toBe(2); // revocation, bridgeUrl
    });
  });
});