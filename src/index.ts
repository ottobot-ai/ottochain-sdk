/**
 * Ottochain SDK
 *
 * Unified SDK combining @constellation-network/metagraph-sdk with OttoChain domain types.
 *
 * Structure:
 * - `@constellation-network/metagraph-sdk` — Core signing, hashing, encoding, wallet, currency transactions
 * - `@constellation-network/metagraph-sdk/network` — HttpClient, MetagraphClient, NetworkError
 * - `ottochain` — OttoChain-specific transaction helpers, types, snapshot, and client
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

// Override verify — package embeds `mode` in signed objects and ignores isDataUpdate
// when mode is present. Our wrapper strips mode so isDataUpdate always wins,
// and dataUpdate verification happens over null-dropped canonical bytes.
export { verify } from './verify.js';

// Override the dataUpdate signing surface — dropNulls is applied internally
// (drop null object fields, preserve array nulls, then RFC 8785) to match
// metakit's content-hash rule. Standard-mode signing is passed through.
export { signDataUpdate, createSignedObject, addSignature, batchSign } from './signing.js';

// ─── Network clients ──────────────────────────────────────────────────────────
// Re-export from package network subpath

export {
  MetagraphClient,
  createMetagraphClient,
  HttpClient,
  NetworkError as MetagraphNetworkError,
} from '@constellation-network/metagraph-sdk/network';

export type {
  MetagraphClientConfig as BaseMetagraphClientConfig,
  LayerType,
  ClusterInfo,
} from '@constellation-network/metagraph-sdk/network';

export type {
  RequestOptions,
  TransactionStatus,
  PendingTransaction,
  PostTransactionResponse,
  EstimateFeeResponse,
  PostDataResponse,
} from '@constellation-network/metagraph-sdk/network';

// ─── Type aliases for semantic clarity (matches wire format) ──────────────────
export * from './types.js';

// ─── OttoChain-specific transaction helpers ───────────────────────────────────
export * from './ottochain/transaction.js';
export { dropNulls } from './ottochain/drop-nulls.js';

// ─── Genesis manifest exporter (std-app pre-registration content) ─────────────
export { buildGenesisManifest, GENESIS_MANIFEST_VERSION } from './ottochain/genesis-manifest.js';
export type {
  GenesisManifest,
  GenesisPackage,
  GenesisMachineShape,
  GenesisMessageShape,
  GenesisFieldShape,
  GenesisStateMachineDefinition,
} from './ottochain/index.js';

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

// Proto definition helper
export {
  toProtoDefinition,
  defineFiberApp,
  type ProtoStateMachineDefinition,
  type FiberAppDefinition,
  type FiberAppMetadata,
  type StateDefinition,
  type StdStateMetadata,
  type StateCategory,
  type Transition,
} from './schema/fiber-app.js';

// Canonical authorization-guard builders (bind to verified signers, not attacker payloads).
export {
  type GuardRule,
  signerIsParty,
  signerIsAnyParty,
  signerInSet,
  signerIsNotParty,
  signerHasEntry,
  assetSignerIs,
  // effect-key coupling (S1): bind a dynamic map key to a verified signer
  actorIsSigner,
  actorInSet,
  actorHasEntry,
  // identity-registry reads (static machines.<uuid> path)
  signerHasReputation,
  signerHasRole,
  // identity-registry reads (runtime-bound registry id, #24)
  signerHasReputationVia,
  signerHasRoleVia,
  // cross-fiber state gate (runtime-bound dependency, #24) — replaces object-form deps
  depInState,
} from './schema/guards.js';

// Reserved EFFECT-directive builders (dynamic dependencies, #24).
export { addDependency, setDependencyActive } from './schema/effects.js';
