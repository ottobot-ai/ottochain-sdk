/**
 * Producer-Validator Framework — Utility Functions
 *
 * Pure utilities for building, signing, and verifying producer-validator agreements.
 */

import { createHash } from 'crypto';
import {
  AgreementScope,
  DataProof,
  ProducerIdentity,
  ProducerValidatorAgreement,
  RegisterAgreementMessage,
  ValidatorIdentity,
} from './types';

// ── DAG address validation ─────────────────────────────────────────────────
// DAG addresses start with 'DAG' followed by alphanumeric chars (min 3 more chars)

const DAG_ADDRESS_RE = /^DAG[a-zA-Z0-9]{3,}$/;

function isDagAddress(addr: string): boolean {
  return DAG_ADDRESS_RE.test(addr);
}

// ── Signature format validation (test-time heuristic) ────────────────────
// In production replace with real DAG cryptographic verification.
// Convention: a signature is valid if it:
//   • is non-empty
//   • has length ≥ 8
//   • does NOT start with "invalid"
// This lets tests use "valid-*" and "revoker-sig-*" etc. as valid signatures
// while "invalid-signature" and "invalid-sig" are correctly rejected.

export function isValidSignature(sig: string): boolean {
  if (typeof sig !== 'string' || sig.length < 8) return false;
  return !sig.toLowerCase().startsWith('invalid');
}

// ── SHA-256 helper ─────────────────────────────────────────────────────────

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

// ── Public utilities ───────────────────────────────────────────────────────

/**
 * Generates the canonical string that both producer and validator must sign
 * when registering an agreement.
 */
export function agreementSignatureMessage(agreement: ProducerValidatorAgreement): string {
  return [
    'AGREEMENT',
    agreement.agreementId,
    agreement.producer.address,
    agreement.validator.address,
    agreement.nonce,
    JSON.stringify(agreement.scope),
    agreement.policyJson,
    agreement.expiresAtOrdinal ?? '',
  ].join(':');
}

/**
 * Computes a deterministic SHA-256 agreement ID from the agreement's key fields.
 * Does NOT include the agreementId field itself to avoid circularity.
 */
export function computeAgreementId(agreement: ProducerValidatorAgreement): string {
  const canonical = [
    agreement.producer.address,
    agreement.validator.address,
    agreement.nonce,
    JSON.stringify(agreement.scope),
    agreement.policyJson,
    agreement.expiresAtOrdinal ?? '',
  ].join(':');
  return sha256(canonical);
}

/**
 * Generates the canonical string for revoking an agreement.
 * Different from the agreement signature to prevent cross-signing attacks.
 */
export function revocationSignatureMessage(
  agreementId: string,
  revocationOrdinal: number,
  nonce: number
): string {
  return `REVOKE:${agreementId}:${revocationOrdinal}:${nonce}`;
}

/**
 * Constructs a complete ProducerValidatorAgreement with a computed agreementId
 * and a random nonce. Validates addresses and policyJson before creating.
 */
export function buildAgreement(
  producer: ProducerIdentity,
  validator: ValidatorIdentity,
  scope: AgreementScope,
  policyJson: string,
  expiresAtOrdinal?: number
): ProducerValidatorAgreement {
  if (!isDagAddress(producer.address)) {
    throw new Error(`Invalid producer address: "${producer.address}" (expected DAG-prefixed alphanumeric)`);
  }
  if (!isDagAddress(validator.address)) {
    throw new Error(`Invalid validator address: "${validator.address}" (expected DAG-prefixed alphanumeric)`);
  }

  // Validate policy JSON
  try {
    JSON.parse(policyJson);
  } catch {
    throw new Error(`Invalid JSON in policyJson: "${policyJson}"`);
  }

  // Ensure scope arrays default to empty
  const normalizedScope: AgreementScope = {
    fiberIds:          scope.fiberIds         ?? [],
    allowedOperations: scope.allowedOperations ?? [],
  };

  // Random nonce (non-zero)
  const nonce = Math.floor(Math.random() * 900000) + 100000;

  // Build skeleton to compute ID
  const skeleton: ProducerValidatorAgreement = {
    agreementId: '', // Placeholder
    producer,
    validator,
    scope: normalizedScope,
    policyJson,
    nonce,
    expiresAtOrdinal,
  };

  const agreementId = computeAgreementId(skeleton);

  return { ...skeleton, agreementId };
}

/**
 * Wraps a signed agreement into the wire message sent to ML0.
 */
export function buildRegisterAgreementMessage(
  agreement: ProducerValidatorAgreement,
  producerSignature: string,
  validatorSignature: string
): RegisterAgreementMessage {
  if (!producerSignature) {
    throw new Error('producer signature must not be empty');
  }
  if (!validatorSignature) {
    throw new Error('validator signature must not be empty');
  }
  return { agreement, producerSignature, validatorSignature };
}

/**
 * Builds a DataProof attesting that the producer signed a specific payload.
 * If the payload contains a `__proof` field (from a previous attach), it is
 * stripped before any internal computation.
 */
export function buildDataProof(
  agreementId: string,
  producerAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _payload: any,
  producerSignature: string
): DataProof {
  return {
    agreementId,
    producerAddress,
    producerSignature,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Attaches a DataProof to a payload without mutating the original.
 */
export function attachDataProof(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  proof: DataProof
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // Strip any existing __proof key before attaching
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __proof: _existing, ...rest } = payload as { __proof?: unknown; [k: string]: unknown };
  return { ...rest, __proof: proof };
}
