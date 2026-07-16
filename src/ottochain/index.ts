/**
 * Ottochain SDK
 *
 * Domain-specific types and clients for the ottochain metagraph.
 *
 * @packageDocumentation
 */

// Re-export generated protobuf types (for binary encoding)
export * as proto from '../generated/index.js';

// Core types matching metagraph wire format
export type {
  // Primitive types (re-exported from src/types.ts)
  Address,
  FiberId,
  StateId,
  HashValue,
  FiberOrdinal,
  SnapshotOrdinal,

  // JSON Logic
  JsonLogicValue,
  JsonLogicExpression,

  // Enums
  FiberStatus,

  // Access control
  AccessControlPolicy,

  // State machine definition
  StateMachineDefinition,

  // Registry: versioning, naming, schema shapes
  SemVer,
  RegistryStatus,
  VersionReq,
  SchemaRef,
  FieldShape,
  MessageShape,
  MachineShape,
  ScriptShape,
  RegistryShape,
  SchemaBinding,
  RegisteredVersion,
  VersionLineage,
  RegistryTarget,
  RegistryEntry,

  // Log entries
  EmittedEvent,
  EventReceipt,
  ScriptInvocation,
  CreationReceipt,
  UpgradeReceipt,
  RejectionReceipt,
  FiberLogEntry,

  // Fiber records
  StateMachineFiberRecord,
  ScriptFiberRecord,
  FiberRecord,

  // On-chain state
  FiberCommit,
  OnChain,

  // Calculated state
  CalculatedState,

  // Message types
  CreateStateMachine,
  TransitionStateMachine,
  ArchiveStateMachine,
  UpgradeFiber,
  CreateScript,
  InvokeScript,
  UpgradeScript,
  PublishMachineVersion,
  PublishScriptVersion,
  SetVersionStatus,
  RegisterAlias,
  CreateAssetPolicy,
  MintAsset,
  ApplyMorphism,
  AuthorizeCompose,
  OttochainMessage,
  OttochainMessageType,

  // Asset model
  MorphismKind,
  MorphismVisibility,
  TokenBehavior,
  SupplyPolicy,
  MorphismSpec,
  AssetHolder,
  OriginProvenance,
  ComponentWitness,
  AssetRecord,
  AssetCommit,
} from './types.js';

// Runtime message type validation
export { OTTOCHAIN_MESSAGE_TYPES, TOKEN_BEHAVIOR_BITS } from './types.js';

// Snapshot decoder
export type { CurrencySnapshotResponse } from './snapshot.js';
export {
  decodeOnChainState,
  getSnapshotOnChainState,
  getLatestOnChainState,
  getLogsForFiber,
  getEventReceipts,
  getScriptInvocations,
  extractOnChainState,
} from './snapshot.js';

// Metagraph client
export type {
  Checkpoint,
  StateProof,
  NullifierSpendProof,
  FeeEstimate,
  TransitionFeeEstimate,
  ScriptFeeEstimate,
  VersionInfo,
  SubscribeRequest,
  SubscribeResponse,
  SubscriberList,
  MetagraphClientConfig,
  SubscribeOptions,
  FiberStateCallback,
  Unsubscribe,
} from './metagraph-client.js';
export { MetagraphClient } from './metagraph-client.js';

// Light-client state-proof verification (no trust in the serving node)
export type {
  MptWitnessNode,
  MptInclusionProof,
  MptAbsenceProof,
  MptProof,
  StateProofVerification,
} from './state-proof.js';
export {
  verifyStateProof,
  verifyAbsenceProof,
  verifyMptInclusion,
  verifyMptAbsence,
  verifyMptProof,
  commitKeyPath,
} from './state-proof.js';

// Webhook PUSH payload types (server-initiated `snapshot.finalized` notification). Hand-authored to
// mirror the chain's `webhooks/Subscriber.scala` — the push is not in the OpenAPI contract, see file.
export type { SnapshotNotification, NotificationStats, SnapshotRejection } from './webhook-notifications.js';
export { SNAPSHOT_FINALIZED_EVENT } from './webhook-notifications.js';

// Transaction helpers (state machine payloads, signing)
export {
  createTransitionPayload,
  createArchivePayload,
  createInvokeScriptPayload,
  signTransaction,
  addTransactionSignature,
  getPublicKeyForRegistration,
  createStateMachinePayload,
  createScriptPayload,
  createDataTransactionRequest,
  createAssetPolicyPayload,
  createMintAssetPayload,
  createApplyMorphismPayload,
  createAuthorizeComposePayload,
} from './transaction.js';

export type {
  CreateStateMachineParams,
  CreateStateMachineMessage,
  CreateScriptParams,
  CreateScriptMessage,
  DataTransactionRequest,
  TransitionParams,
  TransitionStateMachineMessage,
  ArchiveParams,
  ArchiveStateMachineMessage,
  InvokeScriptParams,
  InvokeScriptMessage,
} from './transaction.js';

// Message-layer advisory lint for ApplyMorphism (Compose/Pool C2 mistakes the chain rejects).
export { lintApplyMorphism, MORPHISM_LINT_CODES } from './morphism-lint.js';
export type { LintViolation, LintSeverity } from './morphism-lint.js';

// Data utilities
export { dropNulls } from './drop-nulls.js';

// Canonical nullifier normalizer (chain `NullifierHex.scala` mirror; protocol-nullifier-set.md)
export { normalizeNullifierHex } from '../schema/nullifier.js';

// Genesis manifest exporter (std-app pre-registration content)
export { buildGenesisManifest, GENESIS_MANIFEST_VERSION } from './genesis-manifest.js';
export type {
  GenesisManifest,
  GenesisPackage,
  MachineShape as GenesisMachineShape,
  MessageShape as GenesisMessageShape,
  FieldShape as GenesisFieldShape,
  StateMachineDefinition as GenesisStateMachineDefinition,
} from './genesis-manifest.js';

// Note: Governance and Corporate types are now in src/apps/
// Import from '@ottochain/sdk/apps' instead
