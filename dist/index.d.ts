/**
 * Ottochain SDK
 *
 * Unified SDK combining metakit framework operations with ottochain domain types.
 *
 * Structure:
 * - `metakit` — Signing, encoding, hashing, and network clients for Constellation metagraphs
 * - `generated` — Protobuf-generated types (source of truth)
 * - `apps/identity` — Agent Identity application types
 * - `apps/contracts` — Contract application types
 * - `errors` — Custom error classes for structured error handling
 * - `validation` — Input validation with Zod schemas
 *
 * @packageDocumentation
 */
export * from './metakit/index.js';
export * from './generated/index.js';
export { OttoChainError, NetworkError, ValidationError, SigningError, TransactionError, ErrorCode, isErrorCode, wrapError, } from './errors.js';
export { DagAddressSchema, PrivateKeySchema, PublicKeySchema, KeyPairSchema, SignatureProofSchema, SignedSchema, TransactionReferenceSchema, CurrencyTransactionValueSchema, CurrencyTransactionSchema, TransferParamsSchema, AgentIdentityRegistrationSchema, PlatformLinkSchema, ContractTermsSchema, ProposeContractRequestSchema, AcceptContractRequestSchema, CompleteContractRequestSchema, validate, validatePrivateKey, validatePublicKey, validateAddress, validateKeyPair, safeParse, assert, type ValidatedKeyPair, type ValidatedSignatureProof, type ValidatedCurrencyTransaction, type ValidatedTransferParams, type ValidatedAgentIdentityRegistration, type ValidatedPlatformLink, type ValidatedProposeContractRequest, type ValidatedAcceptContractRequest, type ValidatedCompleteContractRequest, } from './validation.js';
export * from './errors.js';
export * from './validation.js';
