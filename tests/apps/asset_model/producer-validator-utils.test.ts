/**
 * TDD Tests for Producer-Validator Framework - Core Utilities
 * 
 * Tests for message signing, agreement computation, and proof building utilities.
 * Based on specification: docs/design/producer-validator-spec.md
 * Groups 9.1-9.6: Utility functions for producer-validator agreements
 * 
 * These tests should FAIL initially since the implementation doesn't exist yet.
 * Implementation should make these tests pass.
 */

// Types that should be exported but don't exist yet
export interface ProducerIdentity {
  address: string;
  metadata?: Record<string, string>;
}

export interface ValidatorIdentity {
  address: string;
  name: string;
  metadata?: Record<string, string>;
}

export interface AgreementScope {
  fiberIds?: string[];
  allowedOperations?: string[];
}

export interface ProducerValidatorAgreement {
  agreementId: string;
  producer: ProducerIdentity;
  validator: ValidatorIdentity;
  scope: AgreementScope;
  policyJson: string;
  expiresAtOrdinal?: number;
  nonce: number;
  createdAt?: Date;
  // Signatures added during signing process
  producerSignature?: string;
  validatorSignature?: string;
}

export interface RegisterAgreementMessage {
  agreement: ProducerValidatorAgreement;
  producerSignature: string;
  validatorSignature: string;
}

export interface DataProof {
  agreementId: string;
  producerAddress: string;
  producerSignature: string;
  timestamp: string;
}

export interface ValidationProof {
  agreementId: string;
  dataProofHash: string;
  validatorAddress: string;
  validatedAt: string;
  result: 'ACCEPTED' | 'REJECTED';
  reason?: string;
}

export interface RevokeAgreementMessage {
  agreementId: string;
  revokerAddress: string;
  revocationOrdinal: number;
  nonce: number;
  revokerSignature: string;
}

// Mock implementations that should exist in the actual implementation
const agreementSignatureMessage = (_agreement: ProducerValidatorAgreement): string => {
  throw new Error('agreementSignatureMessage not implemented yet - TDD failing test');
};

const computeAgreementId = (_agreement: ProducerValidatorAgreement): string => {
  throw new Error('computeAgreementId not implemented yet - TDD failing test');
};

const revocationSignatureMessage = (_agreementId: string, _revocationOrdinal: number, _nonce: number): string => {
  throw new Error('revocationSignatureMessage not implemented yet - TDD failing test');
};

const buildAgreement = (
  _producer: ProducerIdentity,
  _validator: ValidatorIdentity,
  _scope: AgreementScope,
  _policyJson: string,
  _expiresAtOrdinal?: number
): ProducerValidatorAgreement => {
  throw new Error('buildAgreement not implemented yet - TDD failing test');
};

const buildRegisterAgreementMessage = (
  _agreement: ProducerValidatorAgreement,
  _producerSignature: string,
  _validatorSignature: string
): RegisterAgreementMessage => {
  throw new Error('buildRegisterAgreementMessage not implemented yet - TDD failing test');
};

const buildDataProof = (
  _agreementId: string,
  _producerAddress: string,
  _payload: any,
  _producerSignature: string
): DataProof => {
  throw new Error('buildDataProof not implemented yet - TDD failing test');
};

const attachDataProof = (_payload: any, _dataProof: DataProof): any => {
  throw new Error('attachDataProof not implemented yet - TDD failing test');
};

describe('Producer-Validator Framework - Core Utilities', () => {

  describe('Group 9.1: agreementSignatureMessage (unit tests)', () => {
    test('generates deterministic signature message for same inputs', () => {
      const agreement: ProducerValidatorAgreement = {
        agreementId: 'test-agreement-id',
        producer: { address: 'DAG1producer123' },
        validator: { address: 'DAG1validator456', name: 'Test Validator' },
        scope: { allowedOperations: ['create', 'update'] },
        policyJson: '{"allow": true}',
        nonce: 12345
      };

      const message1 = agreementSignatureMessage(agreement);
      const message2 = agreementSignatureMessage(agreement);

      expect(message1).toBe(message2);
      expect(message1.length).toBeGreaterThan(0);
    });

    test('changes when agreementId changes', () => {
      const agreement1: ProducerValidatorAgreement = {
        agreementId: 'agreement-1',
        producer: { address: 'DAG1producer123' },
        validator: { address: 'DAG1validator456', name: 'Test Validator' },
        scope: {},
        policyJson: '{}',
        nonce: 12345
      };

      const agreement2: ProducerValidatorAgreement = {
        ...agreement1,
        agreementId: 'agreement-2'
      };

      const message1 = agreementSignatureMessage(agreement1);
      const message2 = agreementSignatureMessage(agreement2);

      expect(message1).not.toBe(message2);
    });

    test('changes when producer address changes', () => {
      const agreement1: ProducerValidatorAgreement = {
        agreementId: 'test-agreement',
        producer: { address: 'DAG1producer123' },
        validator: { address: 'DAG1validator456', name: 'Test Validator' },
        scope: {},
        policyJson: '{}',
        nonce: 12345
      };

      const agreement2: ProducerValidatorAgreement = {
        ...agreement1,
        producer: { address: 'DAG1producer789' }
      };

      const message1 = agreementSignatureMessage(agreement1);
      const message2 = agreementSignatureMessage(agreement2);

      expect(message1).not.toBe(message2);
    });

    test('changes when policy JSON changes', () => {
      const agreement1: ProducerValidatorAgreement = {
        agreementId: 'test-agreement',
        producer: { address: 'DAG1producer123' },
        validator: { address: 'DAG1validator456', name: 'Test Validator' },
        scope: {},
        policyJson: '{"allow": true}',
        nonce: 12345
      };

      const agreement2: ProducerValidatorAgreement = {
        ...agreement1,
        policyJson: '{"allow": false}'
      };

      const message1 = agreementSignatureMessage(agreement1);
      const message2 = agreementSignatureMessage(agreement2);

      expect(message1).not.toBe(message2);
    });

    test('includes "AGREEMENT" prefix in message', () => {
      const agreement: ProducerValidatorAgreement = {
        agreementId: 'test-agreement',
        producer: { address: 'DAG1producer123' },
        validator: { address: 'DAG1validator456', name: 'Test Validator' },
        scope: {},
        policyJson: '{}',
        nonce: 12345
      };

      const message = agreementSignatureMessage(agreement);

      expect(message).toContain('AGREEMENT');
    });
  });

  describe('Group 9.2: computeAgreementId (unit tests)', () => {
    test('generates deterministic ID for same inputs', () => {
      const agreement: ProducerValidatorAgreement = {
        agreementId: '', // Will be computed
        producer: { address: 'DAG1producer123' },
        validator: { address: 'DAG1validator456', name: 'Test Validator' },
        scope: { allowedOperations: ['create'] },
        policyJson: '{"allow": true}',
        nonce: 12345
      };

      const id1 = computeAgreementId(agreement);
      const id2 = computeAgreementId(agreement);

      expect(id1).toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
    });

    test('changes when producer address changes', () => {
      const agreement1: ProducerValidatorAgreement = {
        agreementId: '',
        producer: { address: 'DAG1producer123' },
        validator: { address: 'DAG1validator456', name: 'Test Validator' },
        scope: {},
        policyJson: '{}',
        nonce: 12345
      };

      const agreement2: ProducerValidatorAgreement = {
        ...agreement1,
        producer: { address: 'DAG1producer789' }
      };

      const id1 = computeAgreementId(agreement1);
      const id2 = computeAgreementId(agreement2);

      expect(id1).not.toBe(id2);
    });

    test('changes when nonce changes', () => {
      const agreement1: ProducerValidatorAgreement = {
        agreementId: '',
        producer: { address: 'DAG1producer123' },
        validator: { address: 'DAG1validator456', name: 'Test Validator' },
        scope: {},
        policyJson: '{}',
        nonce: 12345
      };

      const agreement2: ProducerValidatorAgreement = {
        ...agreement1,
        nonce: 67890
      };

      const id1 = computeAgreementId(agreement1);
      const id2 = computeAgreementId(agreement2);

      expect(id1).not.toBe(id2);
    });

    test('changes when scope changes', () => {
      const agreement1: ProducerValidatorAgreement = {
        agreementId: '',
        producer: { address: 'DAG1producer123' },
        validator: { address: 'DAG1validator456', name: 'Test Validator' },
        scope: { allowedOperations: ['create'] },
        policyJson: '{}',
        nonce: 12345
      };

      const agreement2: ProducerValidatorAgreement = {
        ...agreement1,
        scope: { allowedOperations: ['create', 'update'] }
      };

      const id1 = computeAgreementId(agreement1);
      const id2 = computeAgreementId(agreement2);

      expect(id1).not.toBe(id2);
    });

    test('returns SHA-256 hash format', () => {
      const agreement: ProducerValidatorAgreement = {
        agreementId: '',
        producer: { address: 'DAG1producer123' },
        validator: { address: 'DAG1validator456', name: 'Test Validator' },
        scope: {},
        policyJson: '{}',
        nonce: 12345
      };

      const id = computeAgreementId(agreement);

      // SHA-256 hash should be 64 characters (32 bytes as hex)
      expect(id).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Group 9.3: revocationSignatureMessage (unit tests)', () => {
    test('generates deterministic message for same inputs', () => {
      const agreementId = 'test-agreement-id';
      const revocationOrdinal = 100;
      const nonce = 12345;

      const message1 = revocationSignatureMessage(agreementId, revocationOrdinal, nonce);
      const message2 = revocationSignatureMessage(agreementId, revocationOrdinal, nonce);

      expect(message1).toBe(message2);
      expect(message1.length).toBeGreaterThan(0);
    });

    test('changes when agreementId changes', () => {
      const message1 = revocationSignatureMessage('agreement-1', 100, 12345);
      const message2 = revocationSignatureMessage('agreement-2', 100, 12345);

      expect(message1).not.toBe(message2);
    });

    test('changes when revocationOrdinal changes', () => {
      const message1 = revocationSignatureMessage('test-agreement', 100, 12345);
      const message2 = revocationSignatureMessage('test-agreement', 101, 12345);

      expect(message1).not.toBe(message2);
    });

    test('changes when nonce changes', () => {
      const message1 = revocationSignatureMessage('test-agreement', 100, 12345);
      const message2 = revocationSignatureMessage('test-agreement', 100, 67890);

      expect(message1).not.toBe(message2);
    });

    test('includes "REVOKE" prefix (different from agreement signing)', () => {
      const message = revocationSignatureMessage('test-agreement', 100, 12345);

      expect(message).toContain('REVOKE');
      expect(message).not.toContain('AGREEMENT');
    });
  });

  describe('Group 9.4: buildAgreement (unit tests)', () => {
    const producer: ProducerIdentity = { address: 'DAG1producer123' };
    const validator: ValidatorIdentity = { address: 'DAG1validator456', name: 'Test Validator' };
    const scope: AgreementScope = { allowedOperations: ['create', 'update'] };
    const policyJson = '{"allow": true}';

    test('fills in nonce (non-zero)', () => {
      const agreement = buildAgreement(producer, validator, scope, policyJson);

      expect(agreement.nonce).toBeDefined();
      expect(agreement.nonce).not.toBe(0);
      expect(typeof agreement.nonce).toBe('number');
    });

    test('computes agreementId matching computeAgreementId()', () => {
      const agreement = buildAgreement(producer, validator, scope, policyJson);

      const computedId = computeAgreementId(agreement);
      expect(agreement.agreementId).toBe(computedId);
    });

    test('throws on invalid producer DAG address', () => {
      const invalidProducer = { address: 'invalid-address' };

      expect(() => {
        buildAgreement(invalidProducer, validator, scope, policyJson);
      }).toThrow(/invalid producer address/i);
    });

    test('throws on invalid validator DAG address', () => {
      const invalidValidator = { address: 'invalid-address', name: 'Test' };

      expect(() => {
        buildAgreement(producer, invalidValidator, scope, policyJson);
      }).toThrow(/invalid validator address/i);
    });

    test('throws on invalid policyJson (non-JSON string)', () => {
      expect(() => {
        buildAgreement(producer, validator, scope, 'invalid-json');
      }).toThrow(/invalid json/i);
    });

    test('returns object without producerSignature/validatorSignature keys', () => {
      const agreement = buildAgreement(producer, validator, scope, policyJson);

      expect(agreement.producerSignature).toBeUndefined();
      expect(agreement.validatorSignature).toBeUndefined();
    });

    test('scope.fiberIds defaults to empty array if not provided', () => {
      const scopeWithoutFiberIds: AgreementScope = { allowedOperations: ['create'] };
      const agreement = buildAgreement(producer, validator, scopeWithoutFiberIds, policyJson);

      expect(agreement.scope.fiberIds).toEqual([]);
    });

    test('scope.allowedOperations defaults to empty array if not provided', () => {
      const scopeWithoutOperations: AgreementScope = { fiberIds: ['fiber1'] };
      const agreement = buildAgreement(producer, validator, scopeWithoutOperations, policyJson);

      expect(agreement.scope.allowedOperations).toEqual([]);
    });
  });

  describe('Group 9.5: buildRegisterAgreementMessage (unit tests)', () => {
    const mockAgreement: ProducerValidatorAgreement = {
      agreementId: 'test-agreement',
      producer: { address: 'DAG1producer123' },
      validator: { address: 'DAG1validator456', name: 'Test Validator' },
      scope: {},
      policyJson: '{}',
      nonce: 12345
    };

    test('returns RegisterAgreementMessage wrapping the agreement', () => {
      const producerSignature = 'producer-sig-123';
      const validatorSignature = 'validator-sig-456';

      const message = buildRegisterAgreementMessage(mockAgreement, producerSignature, validatorSignature);

      expect(message.agreement).toEqual(mockAgreement);
      expect(message.producerSignature).toBe(producerSignature);
      expect(message.validatorSignature).toBe(validatorSignature);
    });

    test('throws if producerSignature is empty', () => {
      expect(() => {
        buildRegisterAgreementMessage(mockAgreement, '', 'validator-sig');
      }).toThrow(/producer signature/i);
    });

    test('throws if validatorSignature is empty', () => {
      expect(() => {
        buildRegisterAgreementMessage(mockAgreement, 'producer-sig', '');
      }).toThrow(/validator signature/i);
    });
  });

  describe('Group 9.6: buildDataProof + attachDataProof (unit tests)', () => {
    const agreementId = 'test-agreement';
    const producerAddress = 'DAG1producer123';
    const producerSignature = 'producer-data-sig-123';
    const payload = { eventName: 'create', data: { value: 'test' } };

    test('buildDataProof: proof.agreementId matches input', () => {
      const proof = buildDataProof(agreementId, producerAddress, payload, producerSignature);

      expect(proof.agreementId).toBe(agreementId);
    });

    test('buildDataProof: proof.producerAddress matches input', () => {
      const proof = buildDataProof(agreementId, producerAddress, payload, producerSignature);

      expect(proof.producerAddress).toBe(producerAddress);
    });

    test('buildDataProof: proof.producerSignature matches input', () => {
      const proof = buildDataProof(agreementId, producerAddress, payload, producerSignature);

      expect(proof.producerSignature).toBe(producerSignature);
    });

    test('attachDataProof: adds "__proof" key to payload', () => {
      const proof = buildDataProof(agreementId, producerAddress, payload, producerSignature);
      const result = attachDataProof(payload, proof);

      expect(result).toHaveProperty('__proof');
      expect(result.__proof).toEqual(proof);
    });

    test('attachDataProof: does not mutate original payload', () => {
      const originalPayload = { ...payload };
      const proof = buildDataProof(agreementId, producerAddress, payload, producerSignature);
      
      attachDataProof(payload, proof);

      expect(payload).toEqual(originalPayload);
    });

    test('attachDataProof: result has all original payload keys', () => {
      const proof = buildDataProof(agreementId, producerAddress, payload, producerSignature);
      const result = attachDataProof(payload, proof);

      Object.keys(payload).forEach(key => {
        expect(result).toHaveProperty(key);
        expect(result[key]).toEqual((payload as any)[key]);
      });
    });

    test('proof is computed over payload WITHOUT __proof key (if rebuilding from raw)', () => {
      const proof1 = buildDataProof(agreementId, producerAddress, payload, producerSignature);
      const payloadWithProof = attachDataProof(payload, proof1);
      
      // Rebuild proof from payload that already has __proof - should ignore __proof when computing
      const proof2 = buildDataProof(agreementId, producerAddress, payloadWithProof, producerSignature);

      expect(proof2.agreementId).toBe(proof1.agreementId);
      expect(proof2.producerAddress).toBe(proof1.producerAddress);
    });
  });
});