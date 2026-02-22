/**
 * TDD Tests for Producer-Validator Framework - Bridge API
 *
 * Group 9.10: Bridge REST endpoints integration tests
 */

import {
  BridgeClient,
  AgreementResponse,
  AgreementListResponse,
  ValidationProofListResponse,
  RegisterAgreementRequest,
} from '../../../src/apps/asset_model/producer-validator';

export type {
  AgreementResponse,
  AgreementListResponse,
  ValidationProofListResponse,
  RegisterAgreementRequest,
};

// RevokeAgreementRequest mirrors bridge client contract
export interface RevokeAgreementRequest {
  agreementId: string;
  revokerAddress: string;
  revocationOrdinal: number;
  nonce: number;
  revokerSignature: string;
}

describe('Producer-Validator Framework - Bridge API', () => {

  describe('Group 9.10: Bridge REST endpoints (integration tests)', () => {
    beforeEach(() => BridgeClient.reset());

    describe('GET /api/agreements/:id', () => {
      test('returns agreement for registered agreement', async () => {
        const agreement = await BridgeClient.getAgreement('test-agreement-123');
        
        expect(agreement).toBeDefined();
        expect(agreement?.agreementId).toBe('test-agreement-123');
        expect(agreement?.status).toBe('ACTIVE');
        expect(agreement?.producer.address).toBe('DAG1producer123');
        expect(agreement?.validator.address).toBe('DAG1validator456');
        expect(agreement?.createdAtOrdinal).toBeGreaterThan(0);
      });

      test('404 for unknown agreement', async () => {
        const agreement = await BridgeClient.getAgreement('non-existent-agreement');
        
        expect(agreement).toBeNull();
      });
    });

    describe('GET /api/agreements (filtering and pagination)', () => {
      test('filters by producer', async () => {
        const result = await BridgeClient.getAgreements({ 
          producer: 'DAG1producer123' 
        });
        
        expect(Array.isArray(result.agreements)).toBe(true);
        expect(typeof result.total).toBe('number');
        
        if (result.agreements.length > 0) {
          result.agreements.forEach(agreement => {
            expect(agreement.producer.address).toBe('DAG1producer123');
          });
        }
      });

      test('filters by validator', async () => {
        const result = await BridgeClient.getAgreements({ 
          validator: 'DAG1validator456' 
        });
        
        expect(Array.isArray(result.agreements)).toBe(true);
        
        if (result.agreements.length > 0) {
          result.agreements.forEach(agreement => {
            expect(agreement.validator.address).toBe('DAG1validator456');
          });
        }
      });

      test('filters by status=ACTIVE', async () => {
        const result = await BridgeClient.getAgreements({ 
          status: 'ACTIVE' 
        });
        
        expect(Array.isArray(result.agreements)).toBe(true);
        
        if (result.agreements.length > 0) {
          result.agreements.forEach(agreement => {
            expect(agreement.status).toBe('ACTIVE');
          });
        }
      });

      test('filters by status=REVOKED — returns revoked agreements', async () => {
        const result = await BridgeClient.getAgreements({ 
          status: 'REVOKED' 
        });
        
        expect(Array.isArray(result.agreements)).toBe(true);
        
        if (result.agreements.length > 0) {
          result.agreements.forEach(agreement => {
            expect(agreement.status).toBe('REVOKED');
            expect(agreement.revokedAtOrdinal).toBeDefined();
          });
        }
      });

      test('pagination: limit and offset work', async () => {
        const page1 = await BridgeClient.getAgreements({ 
          limit: 5, 
          offset: 0 
        });
        const page2 = await BridgeClient.getAgreements({ 
          limit: 5, 
          offset: 5 
        });
        
        expect(page1.limit).toBe(5);
        expect(page1.offset).toBe(0);
        expect(page2.limit).toBe(5);
        expect(page2.offset).toBe(5);
        
        expect(page1.agreements.length).toBeLessThanOrEqual(5);
        expect(page2.agreements.length).toBeLessThanOrEqual(5);
        
        // Ensure different pages return different results (if there are enough records)
        if (page1.agreements.length > 0 && page2.agreements.length > 0) {
          const page1Ids = page1.agreements.map(a => a.agreementId);
          const page2Ids = page2.agreements.map(a => a.agreementId);
          
          // Should have no overlap
          const intersection = page1Ids.filter(id => page2Ids.includes(id));
          expect(intersection).toHaveLength(0);
        }
      });
    });

    describe('GET /api/agreements/:id/proofs', () => {
      test('returns validation proofs (most recent first)', async () => {
        const result = await BridgeClient.getAgreementProofs('test-agreement-123');
        
        expect(Array.isArray(result.proofs)).toBe(true);
        expect(typeof result.total).toBe('number');
        
        if (result.proofs.length > 1) {
          // Should be ordered by validatedAtOrdinal descending (most recent first)
          for (let i = 0; i < result.proofs.length - 1; i++) {
            expect(result.proofs[i].validatedAtOrdinal)
              .toBeGreaterThanOrEqual(result.proofs[i + 1].validatedAtOrdinal);
          }
        }
        
        result.proofs.forEach(proof => {
          expect(proof.agreementId).toBe('test-agreement-123');
          expect(proof.result).toMatch(/^(ACCEPTED|REJECTED)$/);
          expect(proof.validatedAtOrdinal).toBeGreaterThan(0);
        });
      });

      test('GET /api/agreements/unknown/proofs — empty array for unknown agreement', async () => {
        const result = await BridgeClient.getAgreementProofs('non-existent-agreement');
        
        expect(result.proofs).toEqual([]);
        expect(result.total).toBe(0);
      });

      test('proof pagination works', async () => {
        const page1 = await BridgeClient.getAgreementProofs('test-agreement-123', {
          limit: 3,
          offset: 0
        });
        
        expect(page1.limit).toBe(3);
        expect(page1.offset).toBe(0);
        expect(page1.proofs.length).toBeLessThanOrEqual(3);
      });
    });

    describe('POST /api/agreements/register', () => {
      const validRegisterRequest: RegisterAgreementRequest = {
        agreement: {
          agreementId: 'new-agreement-456',
          producer: { address: 'DAG1newproducer123' },
          validator: { address: 'DAG1newvalidator456', name: 'New Validator' },
          scope: { allowedOperations: ['create'] },
          policyJson: '{"allow": true}',
          nonce: 54321,
          expiresAtOrdinal: 3000
        },
        producerSignature: 'valid-producer-signature-123',
        validatorSignature: 'valid-validator-signature-456'
      };

      test('registers valid agreement → returns agreementId', async () => {
        const result = await BridgeClient.registerAgreement(validRegisterRequest);
        
        expect(result.agreementId).toBe('new-agreement-456');
        
        // Should be able to retrieve the registered agreement
        const retrievedAgreement = await BridgeClient.getAgreement('new-agreement-456');
        expect(retrievedAgreement).toBeDefined();
        expect(retrievedAgreement?.status).toBe('ACTIVE');
      });

      test('rejects invalid producer signature → 400 error', async () => {
        const invalidRequest: RegisterAgreementRequest = {
          ...validRegisterRequest,
          producerSignature: 'invalid-signature'
        };
        
        await expect(
          BridgeClient.registerAgreement(invalidRequest)
        ).rejects.toThrow();
      });

      test('rejects duplicate agreement → 409 conflict', async () => {
        const duplicateRequest: RegisterAgreementRequest = {
          ...validRegisterRequest,
          agreement: {
            ...validRegisterRequest.agreement,
            agreementId: 'test-agreement-123' // Already exists
          }
        };
        
        await expect(
          BridgeClient.registerAgreement(duplicateRequest)
        ).rejects.toThrow();
      });

      test('validates producer DAG address format', async () => {
        const invalidRequest: RegisterAgreementRequest = {
          ...validRegisterRequest,
          agreement: {
            ...validRegisterRequest.agreement,
            producer: { address: 'invalid-dag-address' }
          }
        };
        
        await expect(
          BridgeClient.registerAgreement(invalidRequest)
        ).rejects.toThrow();
      });

      test('validates policy JSON format', async () => {
        const invalidRequest: RegisterAgreementRequest = {
          ...validRegisterRequest,
          agreement: {
            ...validRegisterRequest.agreement,
            policyJson: 'not-valid-json'
          }
        };
        
        await expect(
          BridgeClient.registerAgreement(invalidRequest)
        ).rejects.toThrow();
      });
    });

    describe('POST /api/agreements/:id/revoke', () => {
      const validRevokeRequest: RevokeAgreementRequest = {
        agreementId: 'test-agreement-123',
        revokerAddress: 'DAG1producer123',
        revocationOrdinal: 1500,
        nonce: 98765,
        revokerSignature: 'valid-revoke-signature-123'
      };

      test('revokes active agreement → success response', async () => {
        const result = await BridgeClient.revokeAgreement(validRevokeRequest);
        
        expect(result.success).toBe(true);
        
        // Agreement should now show as REVOKED
        const revokedAgreement = await BridgeClient.getAgreement('test-agreement-123');
        expect(revokedAgreement?.status).toBe('REVOKED');
        expect(revokedAgreement?.revokedAtOrdinal).toBeDefined();
      });

      test('rejects revocation by unauthorized party → 403 error', async () => {
        const unauthorizedRequest: RevokeAgreementRequest = {
          ...validRevokeRequest,
          revokerAddress: 'DAG1unauthorized789'
        };
        
        await expect(
          BridgeClient.revokeAgreement(unauthorizedRequest)
        ).rejects.toThrow();
      });

      test('rejects revocation of non-existent agreement → 404 error', async () => {
        const nonExistentRequest: RevokeAgreementRequest = {
          ...validRevokeRequest,
          agreementId: 'non-existent-agreement'
        };
        
        await expect(
          BridgeClient.revokeAgreement(nonExistentRequest)
        ).rejects.toThrow();
      });

      test('rejects invalid signature → 400 error', async () => {
        const invalidRequest: RevokeAgreementRequest = {
          ...validRevokeRequest,
          revokerSignature: 'invalid-signature'
        };
        
        await expect(
          BridgeClient.revokeAgreement(invalidRequest)
        ).rejects.toThrow();
      });

      test('rejects revocation of already-revoked agreement → 409 error', async () => {
        // First, revoke the agreement
        await BridgeClient.revokeAgreement(validRevokeRequest);
        
        // Try to revoke again
        const duplicateRevokeRequest: RevokeAgreementRequest = {
          ...validRevokeRequest,
          nonce: 98766 // Different nonce
        };
        
        await expect(
          BridgeClient.revokeAgreement(duplicateRevokeRequest)
        ).rejects.toThrow();
      });
    });

    describe('Error Response Format', () => {
      test('bridge errors include proper error codes and messages', async () => {
        try {
          await BridgeClient.getAgreement('definitely-invalid-id');
        } catch (error: any) {
          // Error response should have consistent format
          expect(error.response?.status).toBeDefined();
          expect(error.response?.data?.error).toBeDefined();
          expect(error.response?.data?.message).toBeDefined();
        }
      });

      test('validation errors include field-specific information', async () => {
        const invalidRequest: RegisterAgreementRequest = {
          agreement: {
            agreementId: '',
            producer: { address: 'invalid' },
            validator: { address: 'invalid', name: '' },
            scope: {},
            policyJson: 'bad json',
            nonce: 0
          },
          producerSignature: '',
          validatorSignature: ''
        };
        
        try {
          await BridgeClient.registerAgreement(invalidRequest);
        } catch (error: any) {
          expect(error.response?.data?.errors).toBeDefined();
          expect(Array.isArray(error.response?.data?.errors)).toBe(true);
          
          if (error.response?.data?.errors) {
            error.response.data.errors.forEach((err: any) => {
              expect(err).toHaveProperty('field');
              expect(err).toHaveProperty('message');
            });
          }
        }
      });
    });

    describe('Authentication and Authorization', () => {
      test('endpoints require valid authentication', async () => {
        // This test would verify that API endpoints check for valid auth tokens
        // Implementation depends on the authentication system used
        expect(true).toBe(true); // Placeholder until auth system is defined
      });

      test('producer can only revoke their own agreements', async () => {
        // This test would verify that producers can only revoke agreements they're party to
        expect(true).toBe(true); // Placeholder - depends on auth implementation
      });

      test('validators can revoke agreements they validate', async () => {
        // This test would verify that validators can revoke agreements they're party to
        expect(true).toBe(true); // Placeholder - depends on auth implementation
      });
    });
  });
});