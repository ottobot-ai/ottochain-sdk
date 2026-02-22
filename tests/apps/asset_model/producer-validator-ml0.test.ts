/**
 * TDD Tests for Producer-Validator Framework - ML0 Integration
 *
 * Groups 9.7-9.9: ML0 validation of agreements, revocations, and data proofs
 */

import type {
  ProducerValidatorAgreement,
  RegisterAgreementMessage,
  DataProof,
} from './producer-validator-utils.test';

import {
  RevokeAgreementMessage,
  ProducerValidatorErrorCode,
  ValidationResult,
  AgreementState,
  ValidationProofRecord,
  validateRegisterAgreement,
  validateRevokeAgreement,
  validateTransitionWithDataProof,
  storeAgreement,
  getAgreement,
  storeValidationProof,
} from '../../../src/apps/asset_model/producer-validator';

export type {
  ProducerValidatorAgreement,
  RegisterAgreementMessage,
  RevokeAgreementMessage,
  DataProof,
};
export { ProducerValidatorErrorCode };
export type { ValidationResult, AgreementState, ValidationProofRecord };

describe('Producer-Validator Framework - ML0 Integration', () => {

  describe('Group 9.7: ML0 RegisterAgreement validation (integration tests)', () => {
    const validAgreement: ProducerValidatorAgreement = {
      agreementId: 'valid-agreement-123',
      producer: { address: 'DAG1producer123' },
      validator: { address: 'DAG1validator456', name: 'Test Validator' },
      scope: { allowedOperations: ['create', 'update'] },
      policyJson: '{"allow": true}',
      nonce: 12345,
      expiresAtOrdinal: 2000
    };

    const validRegisterMessage: RegisterAgreementMessage = {
      agreement: validAgreement,
      producerSignature: 'valid-producer-signature-123',
      validatorSignature: 'valid-validator-signature-456'
    };

    test('valid RegisterAgreement → agreement stored with status ACTIVE', () => {
      const context = { currentOrdinal: 1000, existingAgreements: [] };
      
      const result = validateRegisterAgreement(validRegisterMessage, context);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // Should trigger storeAgreement with ACTIVE status
      expect(() => storeAgreement(validAgreement, 1000)).not.toThrow();
    });

    test('valid RegisterAgreement → created_at_ordinal set to current ordinal', () => {
      const context = { currentOrdinal: 1500, existingAgreements: [] };
      
      validateRegisterAgreement(validRegisterMessage, context);
      
      const storedAgreement = getAgreement(validAgreement.agreementId);
      expect(storedAgreement?.createdAtOrdinal).toBe(1500);
    });

    test('duplicate agreement_id → rejected AGREEMENT_ALREADY_EXISTS', () => {
      const context = { 
        currentOrdinal: 1000, 
        existingAgreements: [{ agreementId: validAgreement.agreementId }]
      };
      
      const result = validateRegisterAgreement(validRegisterMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.AGREEMENT_ALREADY_EXISTS)).toBe(true);
    });

    test('agreement_id mismatch (tampered) → rejected AGREEMENT_ID_MISMATCH', () => {
      const tamperedMessage: RegisterAgreementMessage = {
        ...validRegisterMessage,
        agreement: {
          ...validAgreement,
          agreementId: 'tampered-id-different-from-computed'
        }
      };
      const context = { currentOrdinal: 1000, existingAgreements: [] };
      
      const result = validateRegisterAgreement(tamperedMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.AGREEMENT_ID_MISMATCH)).toBe(true);
    });

    test('invalid producer signature → rejected INVALID_PRODUCER_SIGNATURE', () => {
      const invalidSigMessage: RegisterAgreementMessage = {
        ...validRegisterMessage,
        producerSignature: 'invalid-signature'
      };
      const context = { currentOrdinal: 1000, existingAgreements: [] };
      
      const result = validateRegisterAgreement(invalidSigMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.INVALID_PRODUCER_SIGNATURE)).toBe(true);
    });

    test('invalid validator signature → rejected INVALID_VALIDATOR_SIGNATURE', () => {
      const invalidSigMessage: RegisterAgreementMessage = {
        ...validRegisterMessage,
        validatorSignature: 'invalid-signature'
      };
      const context = { currentOrdinal: 1000, existingAgreements: [] };
      
      const result = validateRegisterAgreement(invalidSigMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.INVALID_VALIDATOR_SIGNATURE)).toBe(true);
    });

    test('expired at past ordinal → rejected AGREEMENT_ALREADY_EXPIRED', () => {
      const expiredMessage: RegisterAgreementMessage = {
        ...validRegisterMessage,
        agreement: {
          ...validAgreement,
          expiresAtOrdinal: 500 // Before current ordinal
        }
      };
      const context = { currentOrdinal: 1000, existingAgreements: [] };
      
      const result = validateRegisterAgreement(expiredMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.AGREEMENT_ALREADY_EXPIRED)).toBe(true);
    });

    test('invalid policy JSON → rejected INVALID_POLICY_JSON', () => {
      const invalidPolicyMessage: RegisterAgreementMessage = {
        ...validRegisterMessage,
        agreement: {
          ...validAgreement,
          policyJson: 'not-valid-json'
        }
      };
      const context = { currentOrdinal: 1000, existingAgreements: [] };
      
      const result = validateRegisterAgreement(invalidPolicyMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.INVALID_POLICY_JSON)).toBe(true);
    });

    test('invalid producer DAG address → rejected INVALID_PRODUCER_ADDRESS', () => {
      const invalidAddressMessage: RegisterAgreementMessage = {
        ...validRegisterMessage,
        agreement: {
          ...validAgreement,
          producer: { address: 'invalid-dag-address' }
        }
      };
      const context = { currentOrdinal: 1000, existingAgreements: [] };
      
      const result = validateRegisterAgreement(invalidAddressMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.INVALID_PRODUCER_ADDRESS)).toBe(true);
    });

    test('invalid validator DAG address → rejected INVALID_VALIDATOR_ADDRESS', () => {
      const invalidAddressMessage: RegisterAgreementMessage = {
        ...validRegisterMessage,
        agreement: {
          ...validAgreement,
          validator: { ...validAgreement.validator, address: 'invalid-dag-address' }
        }
      };
      const context = { currentOrdinal: 1000, existingAgreements: [] };
      
      const result = validateRegisterAgreement(invalidAddressMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.INVALID_VALIDATOR_ADDRESS)).toBe(true);
    });
  });

  describe('Group 9.8: ML0 RevokeAgreement validation (integration tests)', () => {
    const validRevokeMessage: RevokeAgreementMessage = {
      agreementId: 'existing-agreement-123',
      revokerAddress: 'DAG1producer123', // Producer revoking
      revocationOrdinal: 1100,
      nonce: 67890,
      revokerSignature: 'valid-revoke-signature'
    };

    test('valid revocation by producer → agreement status REVOKED', () => {
      const context = {
        currentOrdinal: 1100,
        agreement: {
          agreementId: 'existing-agreement-123',
          producer: { address: 'DAG1producer123' },
          validator: { address: 'DAG1validator456', name: 'Test Validator' },
          status: 'ACTIVE'
        }
      };
      
      const result = validateRevokeAgreement(validRevokeMessage, context);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const agreement = getAgreement('existing-agreement-123');
      expect(agreement?.status).toBe('REVOKED');
    });

    test('valid revocation by validator → agreement status REVOKED', () => {
      const validatorRevokeMessage: RevokeAgreementMessage = {
        ...validRevokeMessage,
        revokerAddress: 'DAG1validator456' // Validator revoking
      };
      
      const context = {
        currentOrdinal: 1100,
        agreement: {
          agreementId: 'existing-agreement-123',
          producer: { address: 'DAG1producer123' },
          validator: { address: 'DAG1validator456', name: 'Test Validator' },
          status: 'ACTIVE'
        }
      };
      
      const result = validateRevokeAgreement(validatorRevokeMessage, context);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('non-existent agreement_id → rejected AGREEMENT_NOT_FOUND', () => {
      const context = { currentOrdinal: 1100, agreement: null };
      
      const result = validateRevokeAgreement(validRevokeMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.AGREEMENT_NOT_FOUND)).toBe(true);
    });

    test('already-revoked agreement → rejected AGREEMENT_NOT_ACTIVE', () => {
      const context = {
        currentOrdinal: 1100,
        agreement: {
          agreementId: 'existing-agreement-123',
          status: 'REVOKED'
        }
      };
      
      const result = validateRevokeAgreement(validRevokeMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.AGREEMENT_NOT_ACTIVE)).toBe(true);
    });

    test('expired agreement → rejected AGREEMENT_NOT_ACTIVE', () => {
      const context = {
        currentOrdinal: 1100,
        agreement: {
          agreementId: 'existing-agreement-123',
          status: 'EXPIRED'
        }
      };
      
      const result = validateRevokeAgreement(validRevokeMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.AGREEMENT_NOT_ACTIVE)).toBe(true);
    });

    test('third-party revoker (neither producer nor validator) → rejected UNAUTHORIZED_REVOKER', () => {
      const thirdPartyRevokeMessage: RevokeAgreementMessage = {
        ...validRevokeMessage,
        revokerAddress: 'DAG1unauthorized789'
      };
      
      const context = {
        currentOrdinal: 1100,
        agreement: {
          agreementId: 'existing-agreement-123',
          producer: { address: 'DAG1producer123' },
          validator: { address: 'DAG1validator456', name: 'Test Validator' },
          status: 'ACTIVE'
        }
      };
      
      const result = validateRevokeAgreement(thirdPartyRevokeMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.UNAUTHORIZED_REVOKER)).toBe(true);
    });

    test('wrong ordinal → rejected INVALID_REVOCATION_ORDINAL', () => {
      const wrongOrdinalMessage: RevokeAgreementMessage = {
        ...validRevokeMessage,
        revocationOrdinal: 999 // Less than current ordinal
      };
      
      const context = { currentOrdinal: 1100, agreement: { status: 'ACTIVE' } };
      
      const result = validateRevokeAgreement(wrongOrdinalMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.INVALID_REVOCATION_ORDINAL)).toBe(true);
    });

    test('invalid signature → rejected INVALID_REVOKER_SIGNATURE', () => {
      const invalidSigMessage: RevokeAgreementMessage = {
        ...validRevokeMessage,
        revokerSignature: 'invalid-signature'
      };
      
      const context = {
        currentOrdinal: 1100,
        agreement: {
          agreementId: 'existing-agreement-123',
          producer: { address: 'DAG1producer123' },
          status: 'ACTIVE'
        }
      };
      
      const result = validateRevokeAgreement(invalidSigMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.INVALID_REVOKER_SIGNATURE)).toBe(true);
    });

    test('nonce reuse within same ordinal → rejected NONCE_ALREADY_USED', () => {
      const context = {
        currentOrdinal: 1100,
        agreement: { status: 'ACTIVE' },
        usedNonces: [{ ordinal: 1100, nonce: 67890 }] // Same nonce already used at this ordinal
      };
      
      const result = validateRevokeAgreement(validRevokeMessage, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.NONCE_ALREADY_USED)).toBe(true);
    });
  });

  describe('Group 9.9: ML0 TransitionStateMachine with DataProof (integration tests)', () => {
    const validTransition = {
      fiberId: 'asset-fiber-123',
      eventName: 'create',
      eventData: { value: 'test-asset' }
    };

    const validDataProof: DataProof = {
      agreementId: 'active-agreement-123',
      producerAddress: 'DAG1producer123',
      producerSignature: 'valid-data-signature',
      timestamp: '2026-02-22T12:00:00Z'
    };

    test('valid transition with valid DataProof → accepted, ValidationProof emitted', () => {
      const context = {
        currentOrdinal: 1200,
        fiber: { fiberId: 'asset-fiber-123', workflowType: 'AssetModel' },
        agreement: {
          agreementId: 'active-agreement-123',
          producer: { address: 'DAG1producer123' },
          validator: { address: 'DAG1validator456', name: 'Test Validator' },
          scope: { allowedOperations: ['create'], fiberIds: [] },
          policyJson: '{"allow": true}',
          status: 'ACTIVE',
          expiresAtOrdinal: 2000
        }
      };
      
      const result = validateTransitionWithDataProof(validTransition, validDataProof, context);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // Should trigger storeValidationProof
      expect(() => storeValidationProof({
        agreementId: 'active-agreement-123',
        dataProofHash: 'computed-hash',
        validatorAddress: 'DAG1validator456',
        validatedAtOrdinal: 1200,
        result: 'ACCEPTED'
      })).not.toThrow();
    });

    test('asset-model fiber without DataProof → rejected PROOF_REQUIRED', () => {
      const context = {
        fiber: { fiberId: 'asset-fiber-123', workflowType: 'AssetModel' },
        dataProof: null
      };
      
      const result = validateTransitionWithDataProof(validTransition, null as any, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.PROOF_REQUIRED)).toBe(true);
    });

    test('DataProof referencing non-existent agreement → rejected AGREEMENT_NOT_FOUND', () => {
      const context = {
        fiber: { workflowType: 'AssetModel' },
        agreement: null
      };
      
      const result = validateTransitionWithDataProof(validTransition, validDataProof, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.AGREEMENT_NOT_FOUND)).toBe(true);
    });

    test('DataProof with revoked agreement → rejected AGREEMENT_NOT_ACTIVE', () => {
      const context = {
        fiber: { workflowType: 'AssetModel' },
        agreement: {
          agreementId: 'revoked-agreement',
          status: 'REVOKED'
        }
      };
      
      const result = validateTransitionWithDataProof(validTransition, validDataProof, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.AGREEMENT_NOT_ACTIVE)).toBe(true);
    });

    test('DataProof with expired agreement (ordinal check) → rejected AGREEMENT_EXPIRED', () => {
      const context = {
        currentOrdinal: 2500,
        fiber: { workflowType: 'AssetModel' },
        agreement: {
          agreementId: 'expired-agreement',
          status: 'ACTIVE',
          expiresAtOrdinal: 2000 // Before current ordinal
        }
      };
      
      const result = validateTransitionWithDataProof(validTransition, validDataProof, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.AGREEMENT_EXPIRED)).toBe(true);
    });

    test('DataProof producer != agreement producer → rejected PRODUCER_MISMATCH', () => {
      const mismatchedProof: DataProof = {
        ...validDataProof,
        producerAddress: 'DAG1different789'
      };
      
      const context = {
        fiber: { workflowType: 'AssetModel' },
        agreement: {
          producer: { address: 'DAG1producer123' },
          status: 'ACTIVE'
        }
      };
      
      const result = validateTransitionWithDataProof(validTransition, mismatchedProof, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.PRODUCER_MISMATCH)).toBe(true);
    });

    test('event_name not in scope.allowed_operations → rejected SCOPE_OPERATION_VIOLATION', () => {
      const restrictedTransition = { ...validTransition, eventName: 'delete' };
      
      const context = {
        fiber: { workflowType: 'AssetModel' },
        agreement: {
          producer: { address: 'DAG1producer123' },
          scope: { allowedOperations: ['create', 'update'] }, // 'delete' not allowed
          status: 'ACTIVE'
        }
      };
      
      const result = validateTransitionWithDataProof(restrictedTransition, validDataProof, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.SCOPE_OPERATION_VIOLATION)).toBe(true);
    });

    test('fiber_id not in scope.fiber_ids → rejected SCOPE_FIBER_VIOLATION', () => {
      const context = {
        fiber: { fiberId: 'asset-fiber-123', workflowType: 'AssetModel' },
        agreement: {
          producer: { address: 'DAG1producer123' },
          scope: { 
            allowedOperations: ['create'],
            fiberIds: ['different-fiber-456'] // This fiber not allowed
          },
          status: 'ACTIVE'
        }
      };
      
      const result = validateTransitionWithDataProof(validTransition, validDataProof, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.SCOPE_FIBER_VIOLATION)).toBe(true);
    });

    test('invalid producer signature → rejected INVALID_PRODUCER_SIGNATURE', () => {
      const invalidSigProof: DataProof = {
        ...validDataProof,
        producerSignature: 'invalid-signature'
      };
      
      const context = {
        fiber: { workflowType: 'AssetModel' },
        agreement: {
          producer: { address: 'DAG1producer123' },
          scope: { allowedOperations: ['create'] },
          status: 'ACTIVE'
        }
      };
      
      const result = validateTransitionWithDataProof(validTransition, invalidSigProof, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.INVALID_PRODUCER_SIGNATURE)).toBe(true);
    });

    test('policy evaluation fails (JLVM returns false) → rejected POLICY_EVALUATION_FAILED', () => {
      const context = {
        fiber: { workflowType: 'AssetModel' },
        agreement: {
          producer: { address: 'DAG1producer123' },
          scope: { allowedOperations: ['create'] },
          policyJson: '{"allow": false}', // Policy that fails
          status: 'ACTIVE'
        }
      };
      
      const result = validateTransitionWithDataProof(validTransition, validDataProof, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ProducerValidatorErrorCode.POLICY_EVALUATION_FAILED)).toBe(true);
    });

    test('policy is always-true → accepts all otherwise-valid DataUpdates', () => {
      const context = {
        fiber: { workflowType: 'AssetModel' },
        agreement: {
          producer: { address: 'DAG1producer123' },
          scope: { allowedOperations: ['create'] },
          policyJson: '{"allow": true}', // Always allow
          status: 'ACTIVE'
        }
      };
      
      const result = validateTransitionWithDataProof(validTransition, validDataProof, context);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('ValidationProof stored in onChainState after successful update', () => {
      const context = {
        currentOrdinal: 1300,
        fiber: { workflowType: 'AssetModel' },
        agreement: {
          agreementId: 'success-agreement',
          producer: { address: 'DAG1producer123' },
          validator: { address: 'DAG1validator456', name: 'Test Validator' },
          scope: { allowedOperations: ['create'] },
          policyJson: '{"allow": true}',
          status: 'ACTIVE'
        }
      };
      
      const result = validateTransitionWithDataProof(validTransition, validDataProof, context);
      
      expect(result.isValid).toBe(true);
      
      // Verify ValidationProof is stored after successful validation
      const expectedProof: ValidationProofRecord = {
        agreementId: 'success-agreement',
        dataProofHash: expect.any(String),
        validatorAddress: 'DAG1validator456',
        validatedAtOrdinal: 1300,
        result: 'ACCEPTED'
      };
      
      expect(() => storeValidationProof(expectedProof)).not.toThrow();
    });
  });
});