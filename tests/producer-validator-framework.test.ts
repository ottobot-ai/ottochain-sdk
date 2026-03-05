import {
  ProducerIdentity,
  ValidatorIdentity,
  DataUpdate,
  AttestationBinding,
  ProducerValidatorPair,
  CreateResult,
  ValidateResult,
  RejectResult,
  FrameworkSecurity,
} from '../src/framework/producer-validator/index.js';

describe('Producer-Validator Framework', () => {
  describe('ProducerIdentity', () => {
    it('should create a producer identity with cryptographic key', () => {
      const identity = new ProducerIdentity('producer-123', 'public-key-hex');
      
      expect(identity.id).toBe('producer-123');
      expect(identity.publicKey).toBe('public-key-hex');
      expect(identity.role).toBe('producer');
    });

    it('should generate unique producer attestations', () => {
      const identity = new ProducerIdentity('producer-123', 'public-key-hex');
      const attestation1 = identity.createAttestation('data-123');
      const attestation2 = identity.createAttestation('data-456');
      
      expect(attestation1.id).not.toBe(attestation2.id);
      expect(attestation1.signature).toBeDefined();
      expect(attestation2.signature).toBeDefined();
    });

    it('should reject invalid public keys', () => {
      expect(() => {
        new ProducerIdentity('producer-123', 'invalid-key');
      }).toThrow('Invalid public key format');
    });
  });

  describe('ValidatorIdentity', () => {
    it('should create a validator identity with validation capabilities', () => {
      const identity = new ValidatorIdentity('validator-456', 'validator-public-key');
      
      expect(identity.id).toBe('validator-456');
      expect(identity.publicKey).toBe('validator-public-key');
      expect(identity.role).toBe('validator');
      expect(identity.canValidate).toBe(true);
    });

    it('should create validation attestations', () => {
      const validator = new ValidatorIdentity('validator-456', 'validator-public-key');
      const validationResult = validator.validateData('data-123', 'producer-signature');
      
      expect(validationResult.isValid).toBeDefined();
      expect(validationResult.attestation).toBeDefined();
      expect(validationResult.attestation.validatorId).toBe('validator-456');
    });

    it('should detect invalid producer signatures', () => {
      const validator = new ValidatorIdentity('validator-456', 'validator-public-key');
      const validationResult = validator.validateData('data-123', 'invalid-signature');
      
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.reason).toBe('Invalid producer signature');
    });
  });

  describe('AttestationBinding', () => {
    it('should bind producer and validator identities cryptographically', () => {
      const producer = new ProducerIdentity('producer-123', 'producer-key');
      const validator = new ValidatorIdentity('validator-456', 'validator-key');
      
      const binding = AttestationBinding.create(producer, validator);
      
      expect(binding.producerId).toBe('producer-123');
      expect(binding.validatorId).toBe('validator-456');
      expect(binding.bindingSignature).toBeDefined();
      expect(binding.timestamp).toBeDefined();
    });

    it('should verify binding authenticity', () => {
      const producer = new ProducerIdentity('producer-123', 'producer-key');
      const validator = new ValidatorIdentity('validator-456', 'validator-key');
      const binding = AttestationBinding.create(producer, validator);
      
      const isValid = AttestationBinding.verify(binding, producer.publicKey, validator.publicKey);
      
      expect(isValid).toBe(true);
    });

    it('should detect tampered bindings', () => {
      const producer = new ProducerIdentity('producer-123', 'producer-key');
      const validator = new ValidatorIdentity('validator-456', 'validator-key');
      const binding = AttestationBinding.create(producer, validator);
      
      // Tamper with the binding
      binding.bindingSignature = 'tampered-signature';
      
      const isValid = AttestationBinding.verify(binding, producer.publicKey, validator.publicKey);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Create/Validate/Reject Flow', () => {
    let producer: ProducerIdentity;
    let validator: ValidatorIdentity;
    let pair: ProducerValidatorPair;

    beforeEach(() => {
      producer = new ProducerIdentity('producer-123', 'producer-key');
      validator = new ValidatorIdentity('validator-456', 'validator-key');
      pair = new ProducerValidatorPair(producer, validator);
    });

    it('should execute create flow successfully', () => {
      const dataUpdate = {
        id: 'update-123',
        content: 'sample data',
        timestamp: Date.now()
      };

      const result: CreateResult = pair.create(dataUpdate);
      
      expect(result.success).toBe(true);
      expect(result.dataId).toBe('update-123');
      expect(result.producerAttestation).toBeDefined();
      expect(result.producerAttestation.signature).toBeDefined();
    });

    it('should execute validate flow successfully', () => {
      const dataUpdate = {
        id: 'update-123',
        content: 'sample data',
        timestamp: Date.now()
      };

      const createResult = pair.create(dataUpdate);
      const validateResult: ValidateResult = pair.validate(createResult.dataId, createResult.producerAttestation);
      
      expect(validateResult.success).toBe(true);
      expect(validateResult.dataId).toBe('update-123');
      expect(validateResult.validatorAttestation).toBeDefined();
      expect(validateResult.validatorAttestation.validatorId).toBe('validator-456');
    });

    it('should execute reject flow when validation fails', () => {
      const dataUpdate = {
        id: 'update-456',
        content: 'invalid data',
        timestamp: Date.now()
      };

      // Create with tampered signature
      const createResult = pair.create(dataUpdate);
      createResult.producerAttestation.signature = 'tampered';
      
      const validateResult: ValidateResult = pair.validate(createResult.dataId, createResult.producerAttestation);
      
      expect(validateResult.success).toBe(false);
      expect(validateResult.rejectionReason).toBe('Invalid producer signature');
    });

    it('should handle reject flow with proper attestation', () => {
      const dataUpdate = {
        id: 'update-789',
        content: 'malicious data',
        timestamp: Date.now()
      };

      const createResult = pair.create(dataUpdate);
      const rejectResult: RejectResult = pair.reject(createResult.dataId, 'Data contains malicious content');
      
      expect(rejectResult.success).toBe(true);
      expect(rejectResult.dataId).toBe('update-789');
      expect(rejectResult.rejectionAttestation).toBeDefined();
      expect(rejectResult.rejectionAttestation.reason).toBe('Data contains malicious content');
      expect(rejectResult.rejectionAttestation.validatorId).toBe('validator-456');
    });
  });

  describe('Security Considerations', () => {
    it('should prevent spoofing attacks', () => {
      const producer = new ProducerIdentity('producer-123', 'producer-key');
      const maliciousKey = 'malicious-key';
      
      // Attempt to spoof producer identity
      expect(() => {
        const spoofedProducer = new ProducerIdentity('producer-123', maliciousKey);
        const attestation = spoofedProducer.createAttestation('data-123');
        
        // This should fail when original producer tries to verify
        producer.verifyAttestation(attestation);
      }).toThrow('Identity spoofing detected');
    });

    it('should prevent replay attacks', () => {
      const producer = new ProducerIdentity('producer-123', 'producer-key');
      const attestation = producer.createAttestation('data-123');
      
      // First use should succeed
      const firstUse = FrameworkSecurity.checkReplay(attestation);
      expect(firstUse.isReplay).toBe(false);
      
      // Second use should be detected as replay
      const secondUse = FrameworkSecurity.checkReplay(attestation);
      expect(secondUse.isReplay).toBe(true);
      expect(secondUse.reason).toBe('Attestation already used');
    });

    it('should handle key revocation', () => {
      const producer = new ProducerIdentity('producer-123', 'producer-key');
      const validator = new ValidatorIdentity('validator-456', 'validator-key');
      
      // Normal operation before revocation
      const attestation = producer.createAttestation('data-123');
      expect(validator.verifyProducerAttestation(attestation, producer.publicKey)).toBe(true);
      
      // Revoke producer key
      FrameworkSecurity.revokeKey(producer.publicKey, 'Compromised key detected');
      
      // Attestations should now fail validation
      const newAttestation = producer.createAttestation('data-456');
      expect(validator.verifyProducerAttestation(newAttestation, producer.publicKey)).toBe(false);
    });

    it('should enforce temporal validity windows', () => {
      const producer = new ProducerIdentity('producer-123', 'producer-key');
      
      // Create attestation in the past
      const pastTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      const oldAttestation = producer.createTimedAttestation('data-123', pastTimestamp);
      
      const isValid = FrameworkSecurity.checkTemporalValidity(oldAttestation);
      
      expect(isValid.valid).toBe(false);
      expect(isValid.reason).toBe('Attestation expired (>24h old)');
    });

    it('should validate cryptographic signatures', () => {
      const producer = new ProducerIdentity('producer-123', 'producer-key');
      const validator = new ValidatorIdentity('validator-456', 'validator-key');
      
      const data = 'sensitive data update';
      const attestation = producer.createAttestation(data);
      
      // Valid signature should pass
      expect(FrameworkSecurity.verifyCryptographicSignature(
        attestation, data, producer.publicKey
      )).toBe(true);
      
      // Tampered data should fail
      expect(FrameworkSecurity.verifyCryptographicSignature(
        attestation, 'tampered data', producer.publicKey
      )).toBe(false);
      
      // Wrong key should fail
      expect(FrameworkSecurity.verifyCryptographicSignature(
        attestation, data, validator.publicKey
      )).toBe(false);
    });
  });

  describe('Integration with Existing DataUpdate Roles', () => {
    it('should map DataUpdate producers to ProducerIdentity', () => {
      const dataUpdate = {
        id: 'update-123',
        producerAddress: 'DAG123...abc',
        content: 'data content',
        signature: 'producer-signature'
      };

      const producerIdentity = ProducerIdentity.fromDataUpdate(dataUpdate);
      
      expect(producerIdentity.id).toBe('update-123');
      expect(producerIdentity.address).toBe('DAG123...abc');
      expect(producerIdentity.signature).toBe('producer-signature');
    });

    it('should map DataUpdate validators to ValidatorIdentity', () => {
      const dataUpdate = {
        id: 'update-123',
        validatorAddress: 'DAG456...def',
        validationStatus: 'approved',
        validatorSignature: 'validator-signature'
      };

      const validatorIdentity = ValidatorIdentity.fromDataUpdate(dataUpdate);
      
      expect(validatorIdentity.id).toBe('update-123');
      expect(validatorIdentity.address).toBe('DAG456...def');
      expect(validatorIdentity.validationStatus).toBe('approved');
      expect(validatorIdentity.signature).toBe('validator-signature');
    });

    it('should maintain backward compatibility with existing DataUpdate flow', () => {
      const legacyDataUpdate = {
        id: 'legacy-123',
        producer: 'legacy-producer',
        validator: 'legacy-validator',
        content: 'legacy content'
      };

      const modernPair = ProducerValidatorPair.fromLegacyDataUpdate(legacyDataUpdate);
      
      expect(modernPair.producer.id).toContain('legacy-producer');
      expect(modernPair.validator.id).toContain('legacy-validator');
      expect(modernPair.isCompatibilityMode).toBe(true);
    });
  });
});