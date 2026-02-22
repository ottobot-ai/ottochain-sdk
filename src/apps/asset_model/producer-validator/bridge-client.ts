/**
 * Producer-Validator Framework — Bridge API Client
 *
 * In-memory implementation of the Bridge REST API for unit testing.
 * In production, replace with actual HTTP calls to the bridge server.
 */

import {
  ProducerValidatorAgreement,
  RevokeAgreementMessage,
  ValidationProofRecord,
} from './types';
import { isValidSignature } from './utils';

// ── Wire types ─────────────────────────────────────────────────────────────

export interface AgreementResponse {
  agreementId: string;
  producer: { address: string; metadata?: Record<string, string> };
  validator: { address: string; name: string; metadata?: Record<string, string> };
  scope: { fiberIds?: string[]; allowedOperations?: string[] };
  policyJson: string;
  nonce: number;
  expiresAtOrdinal?: number;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  createdAtOrdinal: number;
  revokedAtOrdinal?: number;
}

export interface AgreementListResponse {
  agreements: AgreementResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface ValidationProofListResponse {
  proofs: ValidationProofRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface RegisterAgreementRequest {
  agreement: ProducerValidatorAgreement;
  producerSignature: string;
  validatorSignature: string;
}

// ── Structured error ───────────────────────────────────────────────────────

export class BridgeValidationError extends Error {
  response: { status: number; data: { errors: Array<{ field: string; message: string }> } };
  constructor(status: number, errors: Array<{ field: string; message: string }>) {
    super(errors.map(e => e.message).join('; '));
    this.name  = 'BridgeValidationError';
    this.response = { status, data: { errors } };
  }
}

// ── In-memory store ────────────────────────────────────────────────────────

const agreementStore = new Map<string, AgreementResponse>();
const proofStore     = new Map<string, ValidationProofRecord[]>();

// Seed test data
function seedStore(): void {
  const seedAgreement: AgreementResponse = {
    agreementId:      'test-agreement-123',
    producer:         { address: 'DAG1producer123' },
    validator:        { address: 'DAG1validator456', name: 'Test Validator' },
    scope:            { fiberIds: [], allowedOperations: ['create', 'update'] },
    policyJson:       '{"allow": true}',
    nonce:            12345,
    expiresAtOrdinal: 5000,
    status:           'ACTIVE',
    createdAtOrdinal: 1000,
  };

  const revokedAgreement: AgreementResponse = {
    agreementId:      'revoked-agreement-456',
    producer:         { address: 'DAG1producer123' },
    validator:        { address: 'DAG1validator456', name: 'Test Validator' },
    scope:            { fiberIds: [], allowedOperations: ['create'] },
    policyJson:       '{"allow": true}',
    nonce:            99999,
    status:           'REVOKED',
    createdAtOrdinal: 800,
    revokedAtOrdinal: 1050,
  };

  agreementStore.set('test-agreement-123', seedAgreement);
  agreementStore.set('revoked-agreement-456', revokedAgreement);

  // Seed some proofs for test-agreement-123
  proofStore.set('test-agreement-123', [
    {
      agreementId:        'test-agreement-123',
      dataProofHash:      'valid-data-signature-001',
      validatorAddress:   'DAG1validator456',
      validatedAtOrdinal: 1200,
      result:             'ACCEPTED',
    },
    {
      agreementId:        'test-agreement-123',
      dataProofHash:      'valid-data-signature-002',
      validatorAddress:   'DAG1validator456',
      validatedAtOrdinal: 1150,
      result:             'ACCEPTED',
    },
  ]);
}

seedStore();

// ── Client ─────────────────────────────────────────────────────────────────

export const BridgeClient = {

  /** GET /api/agreements/:id */
  async getAgreement(agreementId: string): Promise<AgreementResponse | null> {
    return agreementStore.get(agreementId) ?? null;
  },

  /** GET /api/agreements */
  async getAgreements(filters?: {
    producer?: string;
    validator?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AgreementListResponse> {
    const limit  = filters?.limit  ?? 50;
    const offset = filters?.offset ?? 0;

    let results = Array.from(agreementStore.values());

    if (filters?.producer) {
      results = results.filter(a => a.producer.address === filters.producer);
    }
    if (filters?.validator) {
      results = results.filter(a => a.validator.address === filters.validator);
    }
    if (filters?.status) {
      results = results.filter(a => a.status === filters.status);
    }

    const total     = results.length;
    const paginated = results.slice(offset, offset + limit);

    return { agreements: paginated, total, limit, offset };
  },

  /** GET /api/agreements/:id/proofs */
  async getAgreementProofs(
    agreementId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ValidationProofListResponse> {
    const limit  = options?.limit  ?? 50;
    const offset = options?.offset ?? 0;

    const proofs = (proofStore.get(agreementId) ?? [])
      .sort((a, b) => b.validatedAtOrdinal - a.validatedAtOrdinal);

    const total     = proofs.length;
    const paginated = proofs.slice(offset, offset + limit);

    return { proofs: paginated, total, limit, offset };
  },

  /** POST /api/agreements (submit RegisterAgreement) */
  async registerAgreement(
    request: RegisterAgreementRequest
  ): Promise<{ agreementId: string }> {
    const { agreement, producerSignature, validatorSignature } = request;
    const fieldErrors: Array<{ field: string; message: string }> = [];

    // Validate signatures
    if (!isValidSignature(producerSignature)) {
      fieldErrors.push({ field: 'producerSignature', message: 'Invalid producer signature' });
    }
    if (!isValidSignature(validatorSignature)) {
      fieldErrors.push({ field: 'validatorSignature', message: 'Invalid validator signature' });
    }

    // Validate producer DAG address format (must start with 'DAG' and be alphanumeric)
    const producerAddr = agreement.producer?.address ?? '';
    if (!producerAddr || !producerAddr.startsWith('DAG') || !/^DAG[A-Za-z0-9]+$/.test(producerAddr)) {
      fieldErrors.push({ field: 'producer.address', message: `Invalid producer DAG address "${producerAddr}"` });
    }

    // Validate policy JSON
    try {
      JSON.parse(agreement.policyJson);
    } catch {
      fieldErrors.push({ field: 'policyJson', message: 'policyJson is not valid JSON' });
    }

    if (fieldErrors.length > 0) {
      throw new BridgeValidationError(400, fieldErrors);
    }

    // Check for duplicate (after field validation so we get field errors first)
    if (agreementStore.has(agreement.agreementId)) {
      throw new BridgeValidationError(409, [
        { field: 'agreementId', message: `Agreement ${agreement.agreementId} already exists` },
      ]);
    }

    const response: AgreementResponse = {
      agreementId:      agreement.agreementId,
      producer:         agreement.producer,
      validator:        agreement.validator,
      scope:            agreement.scope,
      policyJson:       agreement.policyJson,
      nonce:            agreement.nonce,
      expiresAtOrdinal: agreement.expiresAtOrdinal,
      status:           'ACTIVE',
      createdAtOrdinal: Date.now(),
    };

    agreementStore.set(agreement.agreementId, response);
    return { agreementId: agreement.agreementId };
  },

  /** DELETE /api/agreements/:id (submit RevokeAgreement) */
  async revokeAgreement(
    request: RevokeAgreementMessage
  ): Promise<{ success: boolean }> {
    const existing = agreementStore.get(request.agreementId);
    if (!existing) {
      throw new BridgeValidationError(404, [
        { field: 'agreementId', message: `Agreement ${request.agreementId} not found` },
      ]);
    }
    if (existing.status !== 'ACTIVE') {
      throw new BridgeValidationError(409, [
        { field: 'status', message: `Agreement ${request.agreementId} is not ACTIVE (status: ${existing.status})` },
      ]);
    }

    // Validate revoker is producer or validator
    const producerAddr  = existing.producer.address;
    const validatorAddr = existing.validator.address;
    if (request.revokerAddress !== producerAddr && request.revokerAddress !== validatorAddr) {
      throw new BridgeValidationError(403, [
        { field: 'revokerAddress', message: `Revoker "${request.revokerAddress}" is not authorized` },
      ]);
    }

    // Validate revoker signature
    if (!isValidSignature(request.revokerSignature)) {
      throw new BridgeValidationError(400, [
        { field: 'revokerSignature', message: 'Invalid revoker signature' },
      ]);
    }

    agreementStore.set(request.agreementId, {
      ...existing,
      status:           'REVOKED',
      revokedAtOrdinal: request.revocationOrdinal,
    });

    return { success: true };
  },

  /** Reset for test isolation. */
  reset(): void {
    agreementStore.clear();
    proofStore.clear();
    seedStore();
  },
};
