/**
 * Producer-Validator Framework
 * @packageDocumentation
 */

export type {
  ProducerIdentity,
  ValidatorIdentity,
  AgreementScope,
  ProducerValidatorAgreement,
  RegisterAgreementMessage,
  RevokeAgreementMessage,
  DataProof,
  ValidationProof,
  ValidationError,
  ValidationResult,
  AgreementState,
  ValidationProofRecord,
} from './types';
export { ProducerValidatorErrorCode } from './types';

export {
  agreementSignatureMessage,
  computeAgreementId,
  revocationSignatureMessage,
  buildAgreement,
  buildRegisterAgreementMessage,
  buildDataProof,
  attachDataProof,
  isValidSignature,
} from './utils';

export {
  storeAgreement,
  getAgreement,
  storeValidationProof,
  getValidationProofs,
  resetStore,
  validateRegisterAgreement,
  validateRevokeAgreement,
  validateTransitionWithDataProof,
} from './validation';

export { BridgeClient, BridgeValidationError } from './bridge-client';
export type {
  AgreementResponse,
  AgreementListResponse,
  ValidationProofListResponse,
  RegisterAgreementRequest,
} from './bridge-client';
