import {
  DagAddressSchema,
  PrivateKeySchema,
  PublicKeySchema,
  KeyPairSchema,
  SignatureProofSchema,
  SignedSchema,
  TransactionReferenceSchema,
  CurrencyTransactionValueSchema,
  CurrencyTransactionSchema,
  TransferParamsSchema,
  AgentIdentityRegistrationSchema,
  PlatformLinkSchema,
  ContractTermsSchema,
  ProposeContractRequestSchema,
  AcceptContractRequestSchema,
  CompleteContractRequestSchema,
  validate,
  validatePrivateKey,
  validatePublicKey,
  validateAddress,
  validateKeyPair,
  safeParse,
  assert,
} from '../src/validation';
import { ValidationError } from '../src/errors';

describe('Validation Schemas', () => {
  describe('DagAddressSchema', () => {
    it('should accept valid DAG addresses', () => {
      const validAddress = 'DAG0abcdefABCDEF123456789012345678901234';
      expect(() => DagAddressSchema.parse(validAddress)).not.toThrow();
    });

    it('should reject addresses without DAG prefix', () => {
      const invalidAddress = 'XYZ0123456789abcdefABCDEF0123456789abcdef';
      expect(() => DagAddressSchema.parse(invalidAddress)).toThrow();
    });

    it('should reject addresses that are too short', () => {
      const shortAddress = 'DAG012345';
      expect(() => DagAddressSchema.parse(shortAddress)).toThrow();
    });
  });

  describe('PrivateKeySchema', () => {
    it('should accept 64-character hex strings', () => {
      const validKey = 'a'.repeat(64);
      expect(() => PrivateKeySchema.parse(validKey)).not.toThrow();
    });

    it('should reject keys that are too short', () => {
      const shortKey = 'a'.repeat(32);
      expect(() => PrivateKeySchema.parse(shortKey)).toThrow();
    });

    it('should reject non-hex characters', () => {
      const invalidKey = 'g'.repeat(64);
      expect(() => PrivateKeySchema.parse(invalidKey)).toThrow();
    });
  });

  describe('PublicKeySchema', () => {
    it('should accept 128-character hex public keys', () => {
      const validKey = 'a'.repeat(128);
      expect(() => PublicKeySchema.parse(validKey)).not.toThrow();
    });

    it('should accept 130-character keys with 04 prefix', () => {
      const validKey = '04' + 'a'.repeat(128);
      expect(() => PublicKeySchema.parse(validKey)).not.toThrow();
    });

    it('should reject keys that are too short', () => {
      const shortKey = 'a'.repeat(64);
      expect(() => PublicKeySchema.parse(shortKey)).toThrow();
    });
  });

  describe('KeyPairSchema', () => {
    const validKeyPair = {
      privateKey: 'a'.repeat(64),
      publicKey: 'a'.repeat(128),
      address: 'DAG0abcdefABCDEF123456789012345678901234',
    };

    it('should accept valid keypair', () => {
      expect(() => KeyPairSchema.parse(validKeyPair)).not.toThrow();
    });

    it('should reject invalid private key', () => {
      const invalid = { ...validKeyPair, privateKey: 'short' };
      expect(() => KeyPairSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid address', () => {
      const invalid = { ...validKeyPair, address: 'invalid' };
      expect(() => KeyPairSchema.parse(invalid)).toThrow();
    });
  });

  describe('SignatureProofSchema', () => {
    it('should accept valid proof', () => {
      const proof = {
        id: 'a'.repeat(128),
        signature: 'b'.repeat(128),
      };
      expect(() => SignatureProofSchema.parse(proof)).not.toThrow();
    });

    it('should reject invalid id', () => {
      const proof = {
        id: 'short',
        signature: 'b'.repeat(128),
      };
      expect(() => SignatureProofSchema.parse(proof)).toThrow();
    });
  });

  describe('SignedSchema', () => {
    it('should accept valid signed object', () => {
      const schema = SignedSchema(KeyPairSchema);
      const signedKeyPair = {
        value: {
          privateKey: 'a'.repeat(64),
          publicKey: 'a'.repeat(128),
          address: 'DAG0abcdefABCDEF123456789012345678901234',
        },
        proofs: [{ id: 'a'.repeat(128), signature: 'b'.repeat(128) }],
      };
      expect(() => schema.parse(signedKeyPair)).not.toThrow();
    });

    it('should reject empty proofs', () => {
      const schema = SignedSchema(KeyPairSchema);
      const invalid = {
        value: {
          privateKey: 'a'.repeat(64),
          publicKey: 'a'.repeat(128),
          address: 'DAG0abcdefABCDEF123456789012345678901234',
        },
        proofs: [],
      };
      expect(() => schema.parse(invalid)).toThrow();
    });
  });

  describe('TransactionReferenceSchema', () => {
    it('should accept valid transaction reference', () => {
      const ref = { ordinal: 0, hash: 'abc123' };
      expect(() => TransactionReferenceSchema.parse(ref)).not.toThrow();
    });

    it('should reject negative ordinal', () => {
      const ref = { ordinal: -1, hash: 'abc' };
      expect(() => TransactionReferenceSchema.parse(ref)).toThrow();
    });

    it('should reject empty hash', () => {
      const ref = { ordinal: 0, hash: '' };
      expect(() => TransactionReferenceSchema.parse(ref)).toThrow();
    });
  });

  describe('CurrencyTransactionValueSchema', () => {
    const validTxValue = {
      source: 'DAG0abcdefABCDEF123456789012345678901234',
      destination: 'DAG1abcdefABCDEF123456789012345678901235',
      amount: 1000000,
      fee: 0,
    };

    it('should accept valid transaction value', () => {
      expect(() => CurrencyTransactionValueSchema.parse(validTxValue)).not.toThrow();
    });

    it('should reject zero amount', () => {
      const invalid = { ...validTxValue, amount: 0 };
      expect(() => CurrencyTransactionValueSchema.parse(invalid)).toThrow();
    });

    it('should reject negative amount', () => {
      const invalid = { ...validTxValue, amount: -100 };
      expect(() => CurrencyTransactionValueSchema.parse(invalid)).toThrow();
    });

    it('should reject negative fee', () => {
      const invalid = { ...validTxValue, fee: -1 };
      expect(() => CurrencyTransactionValueSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid source address', () => {
      const invalid = { ...validTxValue, source: 'invalid' };
      expect(() => CurrencyTransactionValueSchema.parse(invalid)).toThrow();
    });
  });

  describe('CurrencyTransactionSchema', () => {
    const validTx = {
      value: {
        source: 'DAG0abcdefABCDEF123456789012345678901234',
        destination: 'DAG1abcdefABCDEF123456789012345678901235',
        amount: 1000000,
        fee: 0,
      },
      parent: {
        ordinal: 0,
        hash: 'abc123',
      },
    };

    it('should accept valid transaction', () => {
      expect(() => CurrencyTransactionSchema.parse(validTx)).not.toThrow();
    });

    it('should reject missing parent', () => {
      const invalid = { value: validTx.value };
      expect(() => CurrencyTransactionSchema.parse(invalid)).toThrow();
    });
  });

  describe('TransferParamsSchema', () => {
    const validParams = {
      from: 'DAG0abcdefABCDEF123456789012345678901234',
      to: 'DAG1abcdefABCDEF123456789012345678901235',
      amount: 100,
    };

    it('should accept valid transfer params', () => {
      expect(() => TransferParamsSchema.parse(validParams)).not.toThrow();
    });

    it('should accept optional fee', () => {
      const withFee = { ...validParams, fee: 10 };
      expect(() => TransferParamsSchema.parse(withFee)).not.toThrow();
    });

    it('should default fee to 0', () => {
      const result = TransferParamsSchema.parse(validParams);
      expect(result.fee).toBe(0);
    });

    it('should reject non-positive amount', () => {
      const invalid = { ...validParams, amount: 0 };
      expect(() => TransferParamsSchema.parse(invalid)).toThrow();
    });
  });

  describe('AgentIdentityRegistrationSchema', () => {
    const validReg = {
      publicKey: 'a'.repeat(128),
      displayName: 'TestAgent',
    };

    it('should accept valid registration', () => {
      expect(() => AgentIdentityRegistrationSchema.parse(validReg)).not.toThrow();
    });

    it('should default reputation to 10', () => {
      const result = AgentIdentityRegistrationSchema.parse(validReg);
      expect(result.reputation).toBe(10);
    });

    it('should accept custom reputation', () => {
      const withRep = { ...validReg, reputation: 50 };
      const result = AgentIdentityRegistrationSchema.parse(withRep);
      expect(result.reputation).toBe(50);
    });

    it('should reject empty display name', () => {
      const invalid = { ...validReg, displayName: '' };
      expect(() => AgentIdentityRegistrationSchema.parse(invalid)).toThrow();
    });

    it('should reject display name over 64 chars', () => {
      const invalid = { ...validReg, displayName: 'a'.repeat(65) };
      expect(() => AgentIdentityRegistrationSchema.parse(invalid)).toThrow();
    });
  });

  describe('PlatformLinkSchema', () => {
    const validLink = {
      platform: 'DISCORD' as const,
      platformUserId: '123456789',
      platformUsername: 'user#1234',
    };

    it('should accept valid platform link', () => {
      expect(() => PlatformLinkSchema.parse(validLink)).not.toThrow();
    });

    it('should default verified to false', () => {
      const result = PlatformLinkSchema.parse(validLink);
      expect(result.verified).toBe(false);
    });

    it('should accept all platform types', () => {
      const platforms = ['DISCORD', 'TELEGRAM', 'TWITTER', 'GITHUB', 'CUSTOM'] as const;
      platforms.forEach((platform) => {
        const link = { ...validLink, platform };
        expect(() => PlatformLinkSchema.parse(link)).not.toThrow();
      });
    });

    it('should reject invalid platform', () => {
      const invalid = { ...validLink, platform: 'INVALID' };
      expect(() => PlatformLinkSchema.parse(invalid)).toThrow();
    });
  });

  describe('ContractTermsSchema', () => {
    it('should accept any record structure', () => {
      const terms = {
        payment: 100,
        deadline: '2026-12-31',
        deliverables: ['item1', 'item2'],
      };
      expect(() => ContractTermsSchema.parse(terms)).not.toThrow();
    });
  });

  describe('ProposeContractRequestSchema', () => {
    const validRequest = {
      proposer: 'DAG0abcdefABCDEF123456789012345678901234',
      counterparty: 'DAG1abcdefABCDEF123456789012345678901235',
      terms: { payment: 100 },
      description: 'Test contract',
    };

    it('should accept valid request', () => {
      expect(() => ProposeContractRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject empty description', () => {
      const invalid = { ...validRequest, description: '' };
      expect(() => ProposeContractRequestSchema.parse(invalid)).toThrow();
    });

    it('should reject description over 1000 chars', () => {
      const invalid = { ...validRequest, description: 'a'.repeat(1001) };
      expect(() => ProposeContractRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe('AcceptContractRequestSchema', () => {
    const validRequest = {
      contractId: 'contract-123',
      acceptor: 'DAG0abcdefABCDEF123456789012345678901234',
    };

    it('should accept valid request', () => {
      expect(() => AcceptContractRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject empty contract ID', () => {
      const invalid = { ...validRequest, contractId: '' };
      expect(() => AcceptContractRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe('CompleteContractRequestSchema', () => {
    const validRequest = {
      contractId: 'contract-123',
      completer: 'DAG0abcdefABCDEF123456789012345678901234',
      proof: 'completion-proof-hash',
    };

    it('should accept valid request', () => {
      expect(() => CompleteContractRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject empty proof', () => {
      const invalid = { ...validRequest, proof: '' };
      expect(() => CompleteContractRequestSchema.parse(invalid)).toThrow();
    });
  });
});

describe('Validation Functions', () => {
  describe('validate', () => {
    it('should return validated data for valid input', () => {
      const result = validate(PrivateKeySchema, 'a'.repeat(64), 'privateKey');
      expect(result).toBe('a'.repeat(64));
    });

    it('should throw ValidationError for invalid input', () => {
      expect(() => validate(PrivateKeySchema, 'short', 'privateKey')).toThrow(ValidationError);
    });

    it('should include field name in error', () => {
      try {
        validate(PrivateKeySchema, 'short', 'privateKey');
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        expect((e as ValidationError).field).toBe('privateKey');
      }
    });
  });

  describe('validatePrivateKey', () => {
    it('should return validated private key', () => {
      const key = 'a'.repeat(64);
      expect(validatePrivateKey(key)).toBe(key);
    });

    it('should throw for invalid private key', () => {
      expect(() => validatePrivateKey('short')).toThrow(ValidationError);
    });
  });

  describe('validatePublicKey', () => {
    it('should return validated public key', () => {
      const key = 'a'.repeat(128);
      expect(validatePublicKey(key)).toBe(key);
    });

    it('should throw for invalid public key', () => {
      expect(() => validatePublicKey('short')).toThrow(ValidationError);
    });
  });

  describe('validateAddress', () => {
    it('should return validated address', () => {
      const addr = 'DAG0abcdefABCDEF123456789012345678901234';
      expect(validateAddress(addr)).toBe(addr);
    });

    it('should throw for invalid address', () => {
      expect(() => validateAddress('invalid')).toThrow(ValidationError);
    });
  });

  describe('validateKeyPair', () => {
    const validKeyPair = {
      privateKey: 'a'.repeat(64),
      publicKey: 'a'.repeat(128),
      address: 'DAG0abcdefABCDEF123456789012345678901234',
    };

    it('should return validated keypair', () => {
      const result = validateKeyPair(validKeyPair);
      expect(result).toEqual(validKeyPair);
    });

    it('should throw for invalid keypair', () => {
      expect(() => validateKeyPair({ ...validKeyPair, privateKey: 'short' })).toThrow(ValidationError);
    });
  });

  describe('safeParse', () => {
    it('should return success result for valid data', () => {
      const result = safeParse(PrivateKeySchema, 'a'.repeat(64));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('a'.repeat(64));
      }
    });

    it('should return error result for invalid data', () => {
      const result = safeParse(PrivateKeySchema, 'short');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe('assert', () => {
    it('should not throw when condition is true', () => {
      expect(() => assert(true, 'Should not throw')).not.toThrow();
    });

    it('should throw ValidationError when condition is false', () => {
      expect(() => assert(false, 'Assertion failed')).toThrow(ValidationError);
    });

    it('should include field in error', () => {
      try {
        assert(false, 'Failed', 'testField');
      } catch (e) {
        expect((e as ValidationError).field).toBe('testField');
      }
    });
  });
});
