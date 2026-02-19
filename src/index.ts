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
 * - `delegation` — Session key delegation, intent signing, and validation
 * - `errors` — Custom error classes for structured error handling
 * - `validation` — Input validation with Zod schemas
 *
 * @packageDocumentation
 */

// Type aliases for semantic clarity (matches wire format)
export * from './types.js';

// Metakit utilities (signing, hashing, HTTP client)
export * from './metakit/index.js';

// Generated protobuf types (canonical definitions)
export * from './generated/index.js';

// Custom error classes
export {
  OttoChainError,
  NetworkError,
  ValidationError,
  SigningError,
  TransactionError,
  ErrorCode,
  isErrorCode,
  wrapError,
} from './errors.js';

// Validation schemas and helpers
export {
  // Schemas
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
  // Helpers
  validate,
  validatePrivateKey,
  validatePublicKey,
  validateAddress,
  validateKeyPair,
  safeParse,
  assert,
  // Types
  type ValidatedKeyPair,
  type ValidatedSignatureProof,
  type ValidatedCurrencyTransaction,
  type ValidatedTransferParams,
  type ValidatedAgentIdentityRegistration,
  type ValidatedPlatformLink,
  type ValidatedProposeContractRequest,
  type ValidatedAcceptContractRequest,
  type ValidatedCompleteContractRequest,
} from './validation.js';

// Delegation management (session keys, intents, validation)
export * from './delegation/index.js';

// Error classes
export * from './errors.js';

// Validation schemas and helpers
export * from './validation.js';
