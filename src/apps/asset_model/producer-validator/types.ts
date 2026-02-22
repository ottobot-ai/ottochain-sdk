/**
 * Producer-Validator Framework — Shared Types
 */

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
  producerSignature?: string;
  validatorSignature?: string;
}

export interface RegisterAgreementMessage {
  agreement: ProducerValidatorAgreement;
  producerSignature: string;
  validatorSignature: string;
}

export interface RevokeAgreementMessage {
  agreementId: string;
  revokerAddress: string;
  revocationOrdinal: number;
  nonce: number;
  revokerSignature: string;
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

export enum ProducerValidatorErrorCode {
  AGREEMENT_ALREADY_EXISTS     = 'AGREEMENT_ALREADY_EXISTS',
  AGREEMENT_ID_MISMATCH        = 'AGREEMENT_ID_MISMATCH',
  INVALID_PRODUCER_SIGNATURE   = 'INVALID_PRODUCER_SIGNATURE',
  INVALID_VALIDATOR_SIGNATURE  = 'INVALID_VALIDATOR_SIGNATURE',
  AGREEMENT_ALREADY_EXPIRED    = 'AGREEMENT_ALREADY_EXPIRED',
  INVALID_POLICY_JSON          = 'INVALID_POLICY_JSON',
  INVALID_PRODUCER_ADDRESS     = 'INVALID_PRODUCER_ADDRESS',
  INVALID_VALIDATOR_ADDRESS    = 'INVALID_VALIDATOR_ADDRESS',
  AGREEMENT_NOT_FOUND          = 'AGREEMENT_NOT_FOUND',
  AGREEMENT_NOT_ACTIVE         = 'AGREEMENT_NOT_ACTIVE',
  UNAUTHORIZED_REVOKER         = 'UNAUTHORIZED_REVOKER',
  INVALID_REVOCATION_ORDINAL   = 'INVALID_REVOCATION_ORDINAL',
  INVALID_REVOKER_SIGNATURE    = 'INVALID_REVOKER_SIGNATURE',
  NONCE_ALREADY_USED           = 'NONCE_ALREADY_USED',
  PROOF_REQUIRED               = 'PROOF_REQUIRED',
  AGREEMENT_EXPIRED            = 'AGREEMENT_EXPIRED',
  PRODUCER_MISMATCH            = 'PRODUCER_MISMATCH',
  SCOPE_OPERATION_VIOLATION    = 'SCOPE_OPERATION_VIOLATION',
  SCOPE_FIBER_VIOLATION        = 'SCOPE_FIBER_VIOLATION',
  POLICY_EVALUATION_FAILED     = 'POLICY_EVALUATION_FAILED',
}

export interface ValidationError {
  code: ProducerValidatorErrorCode;
  message: string;
  field?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface AgreementState {
  agreement: ProducerValidatorAgreement;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  createdAtOrdinal: number;
  revokedAtOrdinal?: number;
}

export interface ValidationProofRecord {
  agreementId: string;
  dataProofHash: string;
  validatorAddress: string;
  validatedAtOrdinal: number;
  result: 'ACCEPTED' | 'REJECTED';
  reason?: string;
}
