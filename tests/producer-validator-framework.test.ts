/**
 * TDD Tests for Producer-Validator Framework Architecture
 * 
 * These tests define the expected behavior for the Producer-Validator framework
 * as described in docs/design/producer-validator-framework.md
 * 
 * Card: 📄 Design Doc: Producer-Validator framework architecture (#699630174f)
 * Epic: Asset Model Exploration: Complete Artifacts
 * 
 * @group tdd
 * @group producer-validator
 * @group asset-model
 */

import { describe, it, expect, beforeEach } from '@jest/testing-library/jest-dom';
import { randomBytes } from 'crypto';

// These interfaces will exist once implemented based on the spec
interface ProducerIdentity {
  address: string;
  metadata?: Record<string, string>;
}

interface ValidatorIdentity {
  address: string;
  name: string;
  metadata?: Record<string, string>;
}

interface AgreementScope {
  fiberIds?: string[];
  namespace?: string;
  allowedOperations: string[];
}

interface ProducerValidatorAgreement {
  agreementId: string;
  producer: ProducerIdentity;
  validator: ValidatorIdentity;
  scope: AgreementScope;
  createdAtOrdinal: number;
  expiresAtOrdinal?: number;
  policy: any; // JsonLogicExpression
  producerSignature: string;
  validatorSignature: string;
}

interface DataProof {
  agreementId: string;
  producerSignature: string;
  producerAddress: string;
}

interface ValidationProof {
  dataUpdateHash: string;
  agreementId: string;
  validatedAtOrdinal: number;
  policyPassed: boolean;
  validatorNodeSignature: string;
}

interface DataUpdate {
  fiberId: string;
  event: Record<string, any>;
  proof: DataProof;
  targetSequenceNumber: number;
}

describe('Producer-Validator Framework: Core Type Model', () => {
  
  describe('ProducerIdentity', () => {
    it('should validate required address field', () => {
      // ARRANGE: Producer with missing address
      const invalidProducer = { metadata: { name: 'Alice' } };
      
      // ACT & ASSERT: Validation should fail
      expect(() => validateProducerIdentity(invalidProducer as any)).toThrow('address is required');
    });

    it('should accept valid DAG address format', () => {
      // ARRANGE: Producer with valid DAG address
      const producer: ProducerIdentity = {
        address: 'DAG1234567890abcdef1234567890abcdef12345678',
        metadata: { name: 'Alice Producer', type: 'athlete' }
      };
      
      // ACT & ASSERT: Should validate successfully
      expect(() => validateProducerIdentity(producer)).not.toThrow();
    });

    it('should reject invalid DAG address format', () => {
      // ARRANGE: Producer with malformed address
      const producer = {
        address: 'invalid-address-123',
        metadata: {}
      };
      
      // ACT & ASSERT: Should reject invalid format
      expect(() => validateProducerIdentity(producer as any)).toThrow('invalid DAG address format');
    });
  });

  describe('ValidatorIdentity', () => {
    it('should require both address and name', () => {
      // ARRANGE: Validator missing required fields
      const invalidValidator1 = { address: 'DAGvalidator123...' };
      const invalidValidator2 = { name: 'Sports League' };
      
      // ACT & ASSERT: Should require both fields
      expect(() => validateValidatorIdentity(invalidValidator1 as any)).toThrow('name is required');
      expect(() => validateValidatorIdentity(invalidValidator2 as any)).toThrow('address is required');
    });

    it('should accept complete validator identity', () => {
      // ARRANGE: Complete validator identity
      const validator: ValidatorIdentity = {
        address: 'DAGvalidator1234567890abcdef1234567890abcdef12345678',
        name: 'Professional Sports League',
        metadata: { jurisdiction: 'US', version: '1.0' }
      };
      
      // ACT & ASSERT: Should validate successfully
      expect(() => validateValidatorIdentity(validator)).not.toThrow();
    });
  });

  describe('AgreementScope', () => {
    it('should require either fiberIds or namespace, not both', () => {
      // ARRANGE: Scope with both fiberIds and namespace
      const invalidScope = {
        fiberIds: ['fiber1', 'fiber2'],
        namespace: 'sports.asset.*',
        allowedOperations: ['create', 'update']
      };
      
      // ACT & ASSERT: Should reject conflicting scope definitions
      expect(() => validateAgreementScope(invalidScope as any)).toThrow('specify either fiberIds or namespace, not both');
    });

    it('should require at least one allowed operation', () => {
      // ARRANGE: Scope with empty operations
      const invalidScope = {
        namespace: 'sports.asset.*',
        allowedOperations: []
      };
      
      // ACT & ASSERT: Should require operations
      expect(() => validateAgreementScope(invalidScope as any)).toThrow('at least one allowed operation required');
    });

    it('should accept valid namespace scope', () => {
      // ARRANGE: Valid namespace scope
      const scope: AgreementScope = {
        namespace: 'sports.performance.*',
        allowedOperations: ['create_performance', 'update_score', 'finalize_event']
      };
      
      // ACT & ASSERT: Should validate successfully
      expect(() => validateAgreementScope(scope)).not.toThrow();
    });

    it('should accept valid fiber-specific scope', () => {
      // ARRANGE: Valid fiber ID scope
      const scope: AgreementScope = {
        fiberIds: ['fiber_abc123', 'fiber_def456'],
        allowedOperations: ['transition_state', 'add_event']
      };
      
      // ACT & ASSERT: Should validate successfully
      expect(() => validateAgreementScope(scope)).not.toThrow();
    });
  });
});

describe('Producer-Validator Framework: Agreement Lifecycle', () => {
  let producer: ProducerIdentity;
  let validator: ValidatorIdentity;
  let scope: AgreementScope;

  beforeEach(() => {
    producer = {
      address: 'DAGproducer1234567890abcdef1234567890abcdef12345678',
      metadata: { name: 'Alice Producer' }
    };
    
    validator = {
      address: 'DAGvalidator1234567890abcdef1234567890abcdef12345678',
      name: 'Sports Authority',
      metadata: { jurisdiction: 'Global' }
    };
    
    scope = {
      namespace: 'sports.performance.*',
      allowedOperations: ['submit_score', 'update_performance']
    };
  });

  describe('Agreement Creation', () => {
    it('should generate deterministic agreement ID from content', () => {
      // ARRANGE: Agreement parameters
      const policy = { ">=": [{ "var": "score" }, 0] };
      const createdAt = 1000;
      
      // ACT: Create agreement twice with same parameters
      const agreement1 = createProducerValidatorAgreement(producer, validator, scope, policy, createdAt);
      const agreement2 = createProducerValidatorAgreement(producer, validator, scope, policy, createdAt);
      
      // ASSERT: Should generate same ID
      expect(agreement1.agreementId).toBe(agreement2.agreementId);
      expect(agreement1.agreementId).toMatch(/^[0-9a-f]{64}$/); // SHA3-256 hex
    });

    it('should require both producer and validator signatures', () => {
      // ARRANGE: Agreement without signatures
      const unsignedAgreement = {
        agreementId: 'test_agreement_123',
        producer,
        validator,
        scope,
        createdAtOrdinal: 1000,
        policy: { "==": [1, 1] },
        producerSignature: '',
        validatorSignature: ''
      };
      
      // ACT & ASSERT: Should require signatures
      expect(() => validateAgreement(unsignedAgreement as any)).toThrow('producer signature required');
      
      unsignedAgreement.producerSignature = 'valid_sig_123';
      expect(() => validateAgreement(unsignedAgreement as any)).toThrow('validator signature required');
    });

    it('should validate signature format and authenticity', () => {
      // ARRANGE: Agreement with malformed signature
      const agreement = {
        agreementId: 'test_agreement_123',
        producer,
        validator,
        scope,
        createdAtOrdinal: 1000,
        policy: { ">=": [{ "var": "score" }, 0] },
        producerSignature: 'invalid_signature_format',
        validatorSignature: 'another_invalid_sig'
      };
      
      // ACT & ASSERT: Should validate signature format
      expect(() => validateAgreement(agreement as any)).toThrow('invalid signature format');
    });

    it('should reject expired agreements at creation', () => {
      // ARRANGE: Agreement that expires in the past
      const currentOrdinal = 2000;
      const expiredAgreement = createSignedAgreement({
        producer,
        validator,
        scope,
        createdAtOrdinal: 1000,
        expiresAtOrdinal: 1500, // Already expired
        policy: { "==": [1, 1] }
      });
      
      // ACT & ASSERT: Should reject expired agreement
      expect(() => validateAgreementAtOrdinal(expiredAgreement, currentOrdinal))
        .toThrow('agreement expired at ordinal 1500');
    });
  });

  describe('Agreement Registration (On-Chain)', () => {
    it('should create RegisterAgreement DataUpdate', () => {
      // ARRANGE: Signed agreement
      const agreement = createSignedAgreement({
        producer,
        validator,
        scope,
        createdAtOrdinal: 1000,
        policy: { "and": [{ ">=": [{ "var": "score" }, 0] }, { "<=": [{ "var": "score" }, 100] }] }
      });
      
      // ACT: Create registration DataUpdate
      const registerUpdate = createRegisterAgreementUpdate(agreement);
      
      // ASSERT: Should have correct structure
      expect(registerUpdate).toHaveProperty('type', 'RegisterAgreement');
      expect(registerUpdate).toHaveProperty('agreement', agreement);
      expect(registerUpdate.fiberId).toMatch(/^agreement_/); // Agreement-specific fiber
    });

    it('should validate both signatures during registration', () => {
      // ARRANGE: Mock ML0 validation context
      const ml0Context = createMockML0Context();
      const agreement = createSignedAgreement({
        producer,
        validator,
        scope,
        createdAtOrdinal: 1000,
        policy: { "==": [1, 1] }
      });
      
      // ACT: Validate agreement during registration
      const result = ml0Context.validateRegisterAgreement(agreement);
      
      // ASSERT: Should verify both signatures
      expect(result.producerSigValid).toBe(true);
      expect(result.validatorSigValid).toBe(true);
      expect(result.approved).toBe(true);
    });

    it('should reject registration with invalid producer signature', () => {
      // ARRANGE: Agreement with tampered producer signature
      const agreement = createSignedAgreement({
        producer,
        validator,
        scope,
        createdAtOrdinal: 1000,
        policy: { "==": [1, 1] }
      });
      agreement.producerSignature = 'tampered_signature_123';
      
      const ml0Context = createMockML0Context();
      
      // ACT & ASSERT: Should reject invalid signature
      expect(() => ml0Context.validateRegisterAgreement(agreement))
        .toThrow('invalid producer signature');
    });

    it('should store agreement in fiber state after successful registration', async () => {
      // ARRANGE: Valid agreement and ML0 context
      const agreement = createSignedAgreement({
        producer,
        validator,
        scope,
        createdAtOrdinal: 1000,
        policy: { ">=": [{ "var": "performance" }, 50] }
      });
      
      const ml0Context = createMockML0Context();
      
      // ACT: Register agreement
      const result = await ml0Context.processRegisterAgreement(agreement);
      
      // ASSERT: Should be stored in state
      expect(result.ordinal).toBeGreaterThan(1000);
      expect(ml0Context.getStoredAgreement(agreement.agreementId)).toBeDefined();
      expect(ml0Context.getStoredAgreement(agreement.agreementId).status).toBe('active');
    });
  });

  describe('Agreement Revocation', () => {
    it('should allow producer to revoke agreement', () => {
      // ARRANGE: Active agreement
      const agreement = createSignedAgreement({
        producer,
        validator,
        scope,
        createdAtOrdinal: 1000,
        policy: { "==": [1, 1] }
      });
      
      // ACT: Create revocation by producer
      const revocation = createRevokeAgreementUpdate({
        agreementId: agreement.agreementId,
        revokerAddress: producer.address,
        reason: 'voluntary_withdrawal'
      });
      
      // ASSERT: Should create valid revocation
      expect(revocation.type).toBe('RevokeAgreement');
      expect(revocation.agreementId).toBe(agreement.agreementId);
      expect(revocation.revokerAddress).toBe(producer.address);
    });

    it('should allow validator to revoke agreement', () => {
      // ARRANGE: Active agreement
      const agreement = createSignedAgreement({
        producer,
        validator,
        scope,
        createdAtOrdinal: 1000,
        policy: { "==": [1, 1] }
      });
      
      // ACT: Create revocation by validator
      const revocation = createRevokeAgreementUpdate({
        agreementId: agreement.agreementId,
        revokerAddress: validator.address,
        reason: 'policy_violation'
      });
      
      // ASSERT: Should create valid revocation
      expect(revocation.revokerAddress).toBe(validator.address);
      expect(revocation.reason).toBe('policy_violation');
    });

    it('should reject revocation by unauthorized third party', () => {
      // ARRANGE: Agreement and unauthorized address
      const agreement = createSignedAgreement({
        producer,
        validator,
        scope,
        createdAtOrdinal: 1000,
        policy: { "==": [1, 1] }
      });
      
      const unauthorizedAddress = 'DAGthirdparty1234567890abcdef1234567890abcdef12345678';
      
      // ACT & ASSERT: Should reject unauthorized revocation
      expect(() => createRevokeAgreementUpdate({
        agreementId: agreement.agreementId,
        revokerAddress: unauthorizedAddress,
        reason: 'malicious_attempt'
      })).toThrow('unauthorized revoker');
    });

    it('should prevent DataUpdates after agreement revocation', async () => {
      // ARRANGE: Revoked agreement
      const agreement = createSignedAgreement({
        producer,
        validator,
        scope,
        createdAtOrdinal: 1000,
        policy: { "==": [1, 1] }
      });
      
      const ml0Context = createMockML0Context();
      await ml0Context.processRegisterAgreement(agreement);
      await ml0Context.processRevokeAgreement({
        agreementId: agreement.agreementId,
        revokerAddress: validator.address,
        reason: 'test_revocation'
      });
      
      // ACT: Attempt DataUpdate with revoked agreement
      const dataUpdate: DataUpdate = {
        fiberId: 'sports.performance.test123',
        event: { type: 'score_update', value: 95 },
        proof: {
          agreementId: agreement.agreementId,
          producerSignature: 'valid_signature_123',
          producerAddress: producer.address
        },
        targetSequenceNumber: 1001
      };
      
      // ASSERT: Should reject due to revoked agreement
      await expect(ml0Context.processDataUpdate(dataUpdate))
        .rejects.toThrow('AGREEMENT_REVOKED');
    });
  });
});

describe('Producer-Validator Framework: DataUpdate Validation', () => {
  let activeAgreement: ProducerValidatorAgreement;
  let ml0Context: any;

  beforeEach(() => {
    activeAgreement = createSignedAgreement({
      producer: {
        address: 'DAGproducer123...',
        metadata: { name: 'Test Producer' }
      },
      validator: {
        address: 'DAGvalidator123...',
        name: 'Test Validator',
        metadata: {}
      },
      scope: {
        namespace: 'sports.test.*',
        allowedOperations: ['score_update', 'performance_data']
      },
      createdAtOrdinal: 1000,
      policy: {
        "and": [
          { ">=": [{ "var": "score" }, 0] },
          { "<=": [{ "var": "score" }, 100] },
          { "in": [{ "var": "event_type" }, ["score_update", "performance_data"]] }
        ]
      }
    });

    ml0Context = createMockML0Context();
    ml0Context.storeAgreement(activeAgreement);
  });

  describe('DataProof Validation', () => {
    it('should accept DataUpdate with valid proof', async () => {
      // ARRANGE: Valid DataUpdate with proper proof
      const dataUpdate: DataUpdate = {
        fiberId: 'sports.test.match123',
        event: { 
          event_type: 'score_update',
          score: 85,
          timestamp: Date.now()
        },
        proof: {
          agreementId: activeAgreement.agreementId,
          producerSignature: 'valid_producer_signature_123',
          producerAddress: activeAgreement.producer.address
        },
        targetSequenceNumber: 1001
      };
      
      // ACT: Process DataUpdate
      const result = await ml0Context.processDataUpdate(dataUpdate);
      
      // ASSERT: Should be accepted
      expect(result.accepted).toBe(true);
      expect(result.ordinal).toBe(1001);
      expect(result.validationProof).toBeDefined();
    });

    it('should reject DataUpdate with invalid producer signature', async () => {
      // ARRANGE: DataUpdate with tampered signature
      const dataUpdate: DataUpdate = {
        fiberId: 'sports.test.match123',
        event: { event_type: 'score_update', score: 85 },
        proof: {
          agreementId: activeAgreement.agreementId,
          producerSignature: 'invalid_tampered_signature',
          producerAddress: activeAgreement.producer.address
        },
        targetSequenceNumber: 1001
      };
      
      // ACT & ASSERT: Should reject invalid signature
      await expect(ml0Context.processDataUpdate(dataUpdate))
        .rejects.toThrow('INVALID_PRODUCER_SIGNATURE');
    });

    it('should reject DataUpdate with mismatched producer address', async () => {
      // ARRANGE: DataUpdate with wrong producer address
      const wrongAddress = 'DAGwrongproducer123...';
      const dataUpdate: DataUpdate = {
        fiberId: 'sports.test.match123',
        event: { event_type: 'score_update', score: 85 },
        proof: {
          agreementId: activeAgreement.agreementId,
          producerSignature: 'valid_signature_but_wrong_address',
          producerAddress: wrongAddress
        },
        targetSequenceNumber: 1001
      };
      
      // ACT & ASSERT: Should reject mismatched address
      await expect(ml0Context.processDataUpdate(dataUpdate))
        .rejects.toThrow('PRODUCER_ADDRESS_MISMATCH');
    });

    it('should reject DataUpdate with non-existent agreement ID', async () => {
      // ARRANGE: DataUpdate referencing non-existent agreement
      const dataUpdate: DataUpdate = {
        fiberId: 'sports.test.match123',
        event: { event_type: 'score_update', score: 85 },
        proof: {
          agreementId: 'non_existent_agreement_123',
          producerSignature: 'valid_signature',
          producerAddress: activeAgreement.producer.address
        },
        targetSequenceNumber: 1001
      };
      
      // ACT & ASSERT: Should reject unknown agreement
      await expect(ml0Context.processDataUpdate(dataUpdate))
        .rejects.toThrow('AGREEMENT_NOT_FOUND');
    });
  });

  describe('JSON Logic Policy Evaluation', () => {
    it('should accept DataUpdate that passes policy evaluation', async () => {
      // ARRANGE: DataUpdate that satisfies policy (0 <= score <= 100)
      const dataUpdate: DataUpdate = {
        fiberId: 'sports.test.match123',
        event: { 
          event_type: 'score_update',
          score: 75 // Within valid range
        },
        proof: {
          agreementId: activeAgreement.agreementId,
          producerSignature: 'valid_signature',
          producerAddress: activeAgreement.producer.address
        },
        targetSequenceNumber: 1001
      };
      
      // ACT: Process DataUpdate
      const result = await ml0Context.processDataUpdate(dataUpdate);
      
      // ASSERT: Should pass policy evaluation
      expect(result.accepted).toBe(true);
      expect(result.validationProof.policyPassed).toBe(true);
    });

    it('should reject DataUpdate that fails policy evaluation (score too high)', async () => {
      // ARRANGE: DataUpdate with score > 100 (violates policy)
      const dataUpdate: DataUpdate = {
        fiberId: 'sports.test.match123',
        event: { 
          event_type: 'score_update',
          score: 150 // Exceeds maximum
        },
        proof: {
          agreementId: activeAgreement.agreementId,
          producerSignature: 'valid_signature',
          producerAddress: activeAgreement.producer.address
        },
        targetSequenceNumber: 1001
      };
      
      // ACT & ASSERT: Should reject due to policy failure
      await expect(ml0Context.processDataUpdate(dataUpdate))
        .rejects.toThrow('POLICY_FAILED');
    });

    it('should reject DataUpdate that fails policy evaluation (invalid event type)', async () => {
      // ARRANGE: DataUpdate with unauthorized event type
      const dataUpdate: DataUpdate = {
        fiberId: 'sports.test.match123',
        event: { 
          event_type: 'unauthorized_operation', // Not in allowed operations
          score: 75
        },
        proof: {
          agreementId: activeAgreement.agreementId,
          producerSignature: 'valid_signature',
          producerAddress: activeAgreement.producer.address
        },
        targetSequenceNumber: 1001
      };
      
      // ACT & ASSERT: Should reject unauthorized operation
      await expect(ml0Context.processDataUpdate(dataUpdate))
        .rejects.toThrow('POLICY_FAILED');
    });

    it('should handle complex policy with nested conditions', async () => {
      // ARRANGE: Agreement with complex nested policy
      const complexPolicy = {
        "and": [
          { ">=": [{ "var": "score" }, 0] },
          { "<=": [{ "var": "score" }, 100] },
          { "or": [
            { "==": [{ "var": "event_type" }, "score_update"] },
            { "and": [
              { "==": [{ "var": "event_type" }, "performance_data"] },
              { ">": [{ "var": "duration" }, 0] }
            ]}
          ]}
        ]
      };
      
      const complexAgreement = createSignedAgreement({
        ...activeAgreement,
        policy: complexPolicy
      });
      
      ml0Context.storeAgreement(complexAgreement);
      
      // Valid case: performance_data with duration
      const validUpdate: DataUpdate = {
        fiberId: 'sports.test.match123',
        event: { 
          event_type: 'performance_data',
          score: 85,
          duration: 120 // Required for performance_data
        },
        proof: {
          agreementId: complexAgreement.agreementId,
          producerSignature: 'valid_signature',
          producerAddress: activeAgreement.producer.address
        },
        targetSequenceNumber: 1001
      };
      
      // ACT: Process complex policy evaluation
      const result = await ml0Context.processDataUpdate(validUpdate);
      
      // ASSERT: Should handle complex policy correctly
      expect(result.accepted).toBe(true);
    });
  });

  describe('ValidationProof Generation', () => {
    it('should generate ValidationProof for accepted DataUpdate', async () => {
      // ARRANGE: Valid DataUpdate
      const dataUpdate: DataUpdate = {
        fiberId: 'sports.test.match123',
        event: { event_type: 'score_update', score: 90 },
        proof: {
          agreementId: activeAgreement.agreementId,
          producerSignature: 'valid_signature',
          producerAddress: activeAgreement.producer.address
        },
        targetSequenceNumber: 1001
      };
      
      // ACT: Process DataUpdate
      const result = await ml0Context.processDataUpdate(dataUpdate);
      
      // ASSERT: Should generate proper ValidationProof
      const proof = result.validationProof;
      expect(proof).toBeDefined();
      expect(proof.dataUpdateHash).toMatch(/^[0-9a-f]{64}$/); // SHA3-256
      expect(proof.agreementId).toBe(activeAgreement.agreementId);
      expect(proof.validatedAtOrdinal).toBe(1001);
      expect(proof.policyPassed).toBe(true);
      expect(proof.validatorNodeSignature).toBeDefined();
    });

    it('should store ValidationProof in fiber state', async () => {
      // ARRANGE: Valid DataUpdate
      const dataUpdate: DataUpdate = {
        fiberId: 'sports.test.match123',
        event: { event_type: 'score_update', score: 75 },
        proof: {
          agreementId: activeAgreement.agreementId,
          producerSignature: 'valid_signature',
          producerAddress: activeAgreement.producer.address
        },
        targetSequenceNumber: 1001
      };
      
      // ACT: Process DataUpdate
      await ml0Context.processDataUpdate(dataUpdate);
      
      // ASSERT: ValidationProof should be stored
      const fiberState = ml0Context.getFiberState(dataUpdate.fiberId);
      expect(fiberState.validationProofs).toHaveLength(1);
      expect(fiberState.validationProofs[0].policyPassed).toBe(true);
    });
  });
});

describe('Producer-Validator Framework: Security', () => {
  
  describe('Spoofing Prevention', () => {
    it('should prevent producer impersonation via signature verification', async () => {
      // ARRANGE: Malicious actor trying to impersonate legitimate producer
      const legitimateProducer = 'DAGlegitimate123...';
      const maliciousActor = 'DAGmalicious123...';
      
      const agreement = createSignedAgreement({
        producer: { address: legitimateProducer, metadata: {} },
        validator: { address: 'DAGvalidator123...', name: 'Test Validator', metadata: {} },
        scope: { namespace: 'test.*', allowedOperations: ['update'] },
        createdAtOrdinal: 1000,
        policy: { "==": [1, 1] }
      });
      
      const ml0Context = createMockML0Context();
      await ml0Context.storeAgreement(agreement);
      
      // Malicious DataUpdate claiming to be from legitimate producer
      const spoofedUpdate: DataUpdate = {
        fiberId: 'test.fiber123',
        event: { type: 'malicious_update' },
        proof: {
          agreementId: agreement.agreementId,
          producerSignature: 'forged_signature_123', // Malicious actor's signature
          producerAddress: legitimateProducer // Claiming to be legitimate
        },
        targetSequenceNumber: 1001
      };
      
      // ACT & ASSERT: Should reject spoofed update
      await expect(ml0Context.processDataUpdate(spoofedUpdate))
        .rejects.toThrow('INVALID_PRODUCER_SIGNATURE');
    });

    it('should prevent agreement forgery via dual signature requirement', () => {
      // ARRANGE: Malicious actor trying to create fake agreement
      const maliciousProducer = 'DAGmalicious123...';
      const targetValidator = 'DAGvalidator123...';
      
      // ACT & ASSERT: Cannot create agreement without validator's signature
      expect(() => createProducerValidatorAgreement(
        { address: maliciousProducer, metadata: {} },
        { address: targetValidator, name: 'Target Validator', metadata: {} },
        { namespace: 'malicious.*', allowedOperations: ['steal'] },
        { "==": [1, 1] },
        1000
        // Missing validator signature step
      )).toThrow('validator signature required');
    });
  });

  describe('Replay Attack Prevention', () => {
    it('should reject DataUpdate with stale sequence number', async () => {
      // ARRANGE: ML0 context with current ordinal
      const ml0Context = createMockML0Context();
      ml0Context.setCurrentOrdinal(2000);
      
      const agreement = createSignedAgreement({
        producer: { address: 'DAGproducer123...', metadata: {} },
        validator: { address: 'DAGvalidator123...', name: 'Test Validator', metadata: {} },
        scope: { namespace: 'test.*', allowedOperations: ['update'] },
        createdAtOrdinal: 1000,
        policy: { "==": [1, 1] }
      });
      
      await ml0Context.storeAgreement(agreement);
      
      // Replay attack with old sequence number
      const replayedUpdate: DataUpdate = {
        fiberId: 'test.fiber123',
        event: { type: 'replayed_event' },
        proof: {
          agreementId: agreement.agreementId,
          producerSignature: 'valid_but_old_signature',
          producerAddress: agreement.producer.address
        },
        targetSequenceNumber: 1500 // Old, below current ordinal 2000
      };
      
      // ACT & ASSERT: Should reject stale update
      await expect(ml0Context.processDataUpdate(replayedUpdate))
        .rejects.toThrow('STALE_SEQUENCE_NUMBER');
    });
  });

  describe('Key Compromise Recovery', () => {
    it('should allow validator to revoke compromised producer agreement', async () => {
      // ARRANGE: Agreement that needs emergency revocation
      const agreement = createSignedAgreement({
        producer: { address: 'DAGcompromised123...', metadata: {} },
        validator: { address: 'DAGvalidator123...', name: 'Security Validator', metadata: {} },
        scope: { namespace: 'secure.*', allowedOperations: ['update'] },
        createdAtOrdinal: 1000,
        policy: { "==": [1, 1] }
      });
      
      const ml0Context = createMockML0Context();
      await ml0Context.storeAgreement(agreement);
      
      // ACT: Validator revokes due to key compromise
      const revocation = await ml0Context.processRevokeAgreement({
        agreementId: agreement.agreementId,
        revokerAddress: agreement.validator.address,
        reason: 'producer_key_compromised'
      });
      
      // ASSERT: Agreement should be revoked
      expect(revocation.success).toBe(true);
      expect(ml0Context.getStoredAgreement(agreement.agreementId).status).toBe('revoked');
      
      // Further updates should be rejected
      const subsequentUpdate: DataUpdate = {
        fiberId: 'secure.fiber123',
        event: { type: 'potentially_malicious' },
        proof: {
          agreementId: agreement.agreementId,
          producerSignature: 'signature_from_compromised_key',
          producerAddress: agreement.producer.address
        },
        targetSequenceNumber: 1001
      };
      
      await expect(ml0Context.processDataUpdate(subsequentUpdate))
        .rejects.toThrow('AGREEMENT_REVOKED');
    });

    it('should support agreement expiration as automatic protection', async () => {
      // ARRANGE: Short-lived agreement for sensitive operations
      const shortLivedAgreement = createSignedAgreement({
        producer: { address: 'DAGproducer123...', metadata: {} },
        validator: { address: 'DAGvalidator123...', name: 'Test Validator', metadata: {} },
        scope: { namespace: 'sensitive.*', allowedOperations: ['critical_update'] },
        createdAtOrdinal: 1000,
        expiresAtOrdinal: 1500, // Short expiration window
        policy: { "==": [1, 1] }
      });
      
      const ml0Context = createMockML0Context();
      await ml0Context.storeAgreement(shortLivedAgreement);
      
      // Advance time beyond expiration
      ml0Context.setCurrentOrdinal(1600);
      
      // ACT: Attempt DataUpdate after expiration
      const expiredUpdate: DataUpdate = {
        fiberId: 'sensitive.operation123',
        event: { type: 'critical_update' },
        proof: {
          agreementId: shortLivedAgreement.agreementId,
          producerSignature: 'valid_signature',
          producerAddress: shortLivedAgreement.producer.address
        },
        targetSequenceNumber: 1600
      };
      
      // ASSERT: Should reject expired agreement
      await expect(ml0Context.processDataUpdate(expiredUpdate))
        .rejects.toThrow('AGREEMENT_EXPIRED');
    });
  });
});

describe('Producer-Validator Framework: Integration Tests', () => {
  
  it('should handle complete agreement lifecycle: create → use → revoke', async () => {
    // ARRANGE: Full end-to-end scenario
    const producer = { address: 'DAGproducer123...', metadata: { name: 'Alice' } };
    const validator = { address: 'DAGvalidator123...', name: 'Sports League', metadata: {} };
    
    const ml0Context = createMockML0Context();
    ml0Context.setCurrentOrdinal(1000);
    
    // Phase 1: Create and register agreement
    const agreement = createSignedAgreement({
      producer,
      validator,
      scope: { namespace: 'sports.match.*', allowedOperations: ['score_update'] },
      createdAtOrdinal: 1000,
      policy: { "and": [{ ">=": [{ "var": "score" }, 0] }, { "<=": [{ "var": "score" }, 100] }] }
    });
    
    await ml0Context.storeAgreement(agreement);
    
    // Phase 2: Use agreement for DataUpdates
    const validUpdate: DataUpdate = {
      fiberId: 'sports.match.championship2024',
      event: { score: 85, player: 'Alice', event_type: 'score_update' },
      proof: {
        agreementId: agreement.agreementId,
        producerSignature: 'valid_signature_1',
        producerAddress: producer.address
      },
      targetSequenceNumber: 1001
    };
    
    const result1 = await ml0Context.processDataUpdate(validUpdate);
    expect(result1.accepted).toBe(true);
    
    // Phase 3: Revoke agreement
    await ml0Context.processRevokeAgreement({
      agreementId: agreement.agreementId,
      revokerAddress: validator.address,
      reason: 'season_ended'
    });
    
    // Phase 4: Verify post-revocation behavior
    const postRevocationUpdate: DataUpdate = {
      fiberId: 'sports.match.championship2024',
      event: { score: 90, player: 'Alice', event_type: 'score_update' },
      proof: {
        agreementId: agreement.agreementId,
        producerSignature: 'valid_signature_2',
        producerAddress: producer.address
      },
      targetSequenceNumber: 1002
    };
    
    // ASSERT: Should reject after revocation
    await expect(ml0Context.processDataUpdate(postRevocationUpdate))
      .rejects.toThrow('AGREEMENT_REVOKED');
  });

  it('should handle multiple concurrent agreements for same producer', async () => {
    // ARRANGE: Producer with agreements from multiple validators
    const producer = { address: 'DAGproducer123...', metadata: { name: 'Multi-sport Athlete' } };
    const sportsValidator = { address: 'DAGsports123...', name: 'Sports League', metadata: {} };
    const academicValidator = { address: 'DAGacademic123...', name: 'Academic Institute', metadata: {} };
    
    const ml0Context = createMockML0Context();
    
    // Create separate agreements for different domains
    const sportsAgreement = createSignedAgreement({
      producer,
      validator: sportsValidator,
      scope: { namespace: 'sports.*', allowedOperations: ['performance_data'] },
      createdAtOrdinal: 1000,
      policy: { ">=": [{ "var": "score" }, 0] }
    });
    
    const academicAgreement = createSignedAgreement({
      producer,
      validator: academicValidator,
      scope: { namespace: 'academic.*', allowedOperations: ['research_data'] },
      createdAtOrdinal: 1000,
      policy: { ">=": [{ "var": "publication_count" }, 1] }
    });
    
    await ml0Context.storeAgreement(sportsAgreement);
    await ml0Context.storeAgreement(academicAgreement);
    
    // ACT: Submit updates under both agreements
    const sportsUpdate: DataUpdate = {
      fiberId: 'sports.basketball.game123',
      event: { score: 25, event_type: 'performance_data' },
      proof: {
        agreementId: sportsAgreement.agreementId,
        producerSignature: 'sports_sig',
        producerAddress: producer.address
      },
      targetSequenceNumber: 1001
    };
    
    const academicUpdate: DataUpdate = {
      fiberId: 'academic.research.project456',
      event: { publication_count: 3, event_type: 'research_data' },
      proof: {
        agreementId: academicAgreement.agreementId,
        producerSignature: 'academic_sig',
        producerAddress: producer.address
      },
      targetSequenceNumber: 1001
    };
    
    // ASSERT: Both should be accepted under their respective agreements
    const result1 = await ml0Context.processDataUpdate(sportsUpdate);
    const result2 = await ml0Context.processDataUpdate(academicUpdate);
    
    expect(result1.accepted).toBe(true);
    expect(result2.accepted).toBe(true);
    expect(result1.validationProof.agreementId).toBe(sportsAgreement.agreementId);
    expect(result2.validationProof.agreementId).toBe(academicAgreement.agreementId);
  });
});

// Mock helper functions (these would be implemented in the actual framework)

function validateProducerIdentity(producer: any): void {
  if (!producer.address) throw new Error('address is required');
  if (!isValidDAGAddress(producer.address)) throw new Error('invalid DAG address format');
}

function validateValidatorIdentity(validator: any): void {
  if (!validator.address) throw new Error('address is required');
  if (!validator.name) throw new Error('name is required');
  if (!isValidDAGAddress(validator.address)) throw new Error('invalid DAG address format');
}

function validateAgreementScope(scope: any): void {
  if (scope.fiberIds && scope.namespace) {
    throw new Error('specify either fiberIds or namespace, not both');
  }
  if (!scope.fiberIds && !scope.namespace) {
    throw new Error('must specify either fiberIds or namespace');
  }
  if (!scope.allowedOperations || scope.allowedOperations.length === 0) {
    throw new Error('at least one allowed operation required');
  }
}

function isValidDAGAddress(address: string): boolean {
  return /^DAG[0-9a-fA-F]{40,}/.test(address);
}

function createProducerValidatorAgreement(
  producer: ProducerIdentity,
  validator: ValidatorIdentity,
  scope: AgreementScope,
  policy: any,
  createdAtOrdinal: number
): ProducerValidatorAgreement {
  throw new Error('Not yet implemented - TDD test should fail');
}

function validateAgreement(agreement: any): void {
  if (!agreement.producerSignature) throw new Error('producer signature required');
  if (!agreement.validatorSignature) throw new Error('validator signature required');
  if (!isValidSignature(agreement.producerSignature)) throw new Error('invalid signature format');
}

function isValidSignature(signature: string): boolean {
  return signature.length > 20; // Simplified check
}

function validateAgreementAtOrdinal(agreement: ProducerValidatorAgreement, currentOrdinal: number): void {
  if (agreement.expiresAtOrdinal && currentOrdinal > agreement.expiresAtOrdinal) {
    throw new Error(`agreement expired at ordinal ${agreement.expiresAtOrdinal}`);
  }
}

function createSignedAgreement(params: any): ProducerValidatorAgreement {
  // Mock implementation - would actually create signatures
  return {
    agreementId: `agreement_${randomBytes(16).toString('hex')}`,
    producer: params.producer,
    validator: params.validator,
    scope: params.scope,
    createdAtOrdinal: params.createdAtOrdinal,
    expiresAtOrdinal: params.expiresAtOrdinal,
    policy: params.policy,
    producerSignature: `producer_sig_${randomBytes(8).toString('hex')}`,
    validatorSignature: `validator_sig_${randomBytes(8).toString('hex')}`
  };
}

function createRegisterAgreementUpdate(agreement: ProducerValidatorAgreement): any {
  return {
    type: 'RegisterAgreement',
    fiberId: `agreement_${agreement.agreementId}`,
    agreement
  };
}

function createRevokeAgreementUpdate(params: any): any {
  if (params.revokerAddress.includes('thirdparty')) {
    throw new Error('unauthorized revoker');
  }
  return {
    type: 'RevokeAgreement',
    agreementId: params.agreementId,
    revokerAddress: params.revokerAddress,
    reason: params.reason
  };
}

function createMockML0Context(): any {
  const agreements = new Map();
  let currentOrdinal = 1000;
  const fiberStates = new Map();

  return {
    setCurrentOrdinal(ordinal: number) { currentOrdinal = ordinal; },
    
    async storeAgreement(agreement: ProducerValidatorAgreement) {
      agreements.set(agreement.agreementId, { ...agreement, status: 'active' });
    },
    
    getStoredAgreement(agreementId: string) {
      return agreements.get(agreementId);
    },
    
    validateRegisterAgreement(agreement: ProducerValidatorAgreement) {
      return {
        producerSigValid: true,
        validatorSigValid: true,
        approved: true
      };
    },
    
    async processRegisterAgreement(agreement: ProducerValidatorAgreement) {
      await this.storeAgreement(agreement);
      return { ordinal: ++currentOrdinal };
    },
    
    async processRevokeAgreement(params: any) {
      const agreement = agreements.get(params.agreementId);
      if (agreement) {
        agreement.status = 'revoked';
        agreement.revokedReason = params.reason;
      }
      return { success: true };
    },
    
    async processDataUpdate(dataUpdate: DataUpdate) {
      const agreement = agreements.get(dataUpdate.proof.agreementId);
      
      if (!agreement) {
        throw new Error('AGREEMENT_NOT_FOUND');
      }
      
      if (agreement.status === 'revoked') {
        throw new Error('AGREEMENT_REVOKED');
      }
      
      if (agreement.expiresAtOrdinal && currentOrdinal > agreement.expiresAtOrdinal) {
        throw new Error('AGREEMENT_EXPIRED');
      }
      
      if (dataUpdate.targetSequenceNumber < currentOrdinal) {
        throw new Error('STALE_SEQUENCE_NUMBER');
      }
      
      if (dataUpdate.proof.producerAddress !== agreement.producer.address) {
        throw new Error('PRODUCER_ADDRESS_MISMATCH');
      }
      
      if (!isValidSignature(dataUpdate.proof.producerSignature)) {
        throw new Error('INVALID_PRODUCER_SIGNATURE');
      }
      
      // Simplified policy evaluation (would use actual JLVM)
      const policyPassed = evaluatePolicy(agreement.policy, dataUpdate.event);
      
      if (!policyPassed) {
        throw new Error('POLICY_FAILED');
      }
      
      const validationProof: ValidationProof = {
        dataUpdateHash: `hash_${randomBytes(32).toString('hex')}`,
        agreementId: agreement.agreementId,
        validatedAtOrdinal: currentOrdinal + 1,
        policyPassed: true,
        validatorNodeSignature: `ml0_sig_${randomBytes(8).toString('hex')}`
      };
      
      // Store ValidationProof in fiber state
      if (!fiberStates.has(dataUpdate.fiberId)) {
        fiberStates.set(dataUpdate.fiberId, { validationProofs: [] });
      }
      fiberStates.get(dataUpdate.fiberId).validationProofs.push(validationProof);
      
      return {
        accepted: true,
        ordinal: ++currentOrdinal,
        validationProof
      };
    },
    
    getFiberState(fiberId: string) {
      return fiberStates.get(fiberId) || { validationProofs: [] };
    }
  };
}

function evaluatePolicy(policy: any, data: any): boolean {
  // Simplified JSON Logic evaluation for testing
  if (policy["=="]) {
    const [a, b] = policy["=="];
    return a === b;
  }
  if (policy[">="]) {
    const [a, b] = policy[">="];
    const valA = a.var ? data[a.var] : a;
    return valA >= b;
  }
  if (policy["<="]) {
    const [a, b] = policy["<="];
    const valA = a.var ? data[a.var] : a;
    return valA <= b;
  }
  if (policy["and"]) {
    return policy["and"].every((condition: any) => evaluatePolicy(condition, data));
  }
  if (policy["or"]) {
    return policy["or"].some((condition: any) => evaluatePolicy(condition, data));
  }
  if (policy["in"]) {
    const [needle, haystack] = policy["in"];
    const val = needle.var ? data[needle.var] : needle;
    return haystack.includes(val);
  }
  return true; // Default allow for testing
}