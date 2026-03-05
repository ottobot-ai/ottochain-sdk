/**
 * Ottochain SDK
 *
 * Unified SDK combining @constellation-network/metagraph-sdk with OttoChain domain types.
 *
 * Structure:
 * - `@constellation-network/metagraph-sdk` — Core signing, hashing, encoding, wallet, currency transactions
 * - `@constellation-network/metagraph-sdk/network` — HttpClient, MetagraphClient, NetworkError
 * - `metakit` — OttoChain-specific transaction helpers (state machine payloads, etc.)
 * - `generated` — Protobuf-generated types (source of truth)
 * - `apps/identity` — Agent Identity application types
 * - `apps/contracts` — Contract application types
 * - `errors` — Custom error classes for structured error handling
 * - `validation` — Input validation with Zod schemas
 *
 * @packageDocumentation
 */

// ─── Core metagraph SDK ───────────────────────────────────────────────────────
// Consumers can also import directly from '@constellation-network/metagraph-sdk'

export * from '@constellation-network/metagraph-sdk';

// Override verify with backward-compatible version that always honors isDataUpdate
// even when the signed object has a `mode` field.
export { verify } from './verify.js';

// ─── Network clients ──────────────────────────────────────────────────────────
// MetagraphClient and HttpClient from the package network subpath

export {
  MetagraphClient,
  createMetagraphClient,
  HttpClient,
  CurrencyL1Client,
  DataL1Client,
} from './network-clients.js';

export type {
  NetworkConfig,
  RequestOptions,
  TransactionStatus,
  PendingTransaction,
  PostTransactionResponse,
  EstimateFeeResponse,
  PostDataResponse,
} from './network-clients.js';

// ─── Type aliases for semantic clarity (matches wire format) ──────────────────
export * from './types.js';

// ─── OttoChain-specific transaction helpers ───────────────────────────────────
export * from './metakit/index.js';

// ─── Generated protobuf types (canonical definitions) ────────────────────────
export * from './generated/index.js';

// ─── Custom error classes ─────────────────────────────────────────────────────
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

// ─── Validation schemas and helpers ──────────────────────────────────────────
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

// ─── OttoChain metagraph client ───────────────────────────────────────────────
export { MetagraphClient as OttoMetagraphClient } from './ottochain/metagraph-client.js';
export type {
  MetagraphClientConfig,
  Checkpoint,
  SubscribeOptions,
  FiberStateCallback,
  Unsubscribe,
} from './ottochain/metagraph-client.js';
