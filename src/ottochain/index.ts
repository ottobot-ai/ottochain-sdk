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
  FeeEstimate,
  MetagraphClientConfig,
  SubscribeOptions,
  FiberStateCallback,
  Unsubscribe,
} from './metagraph-client.js';
export { MetagraphClient } from './metagraph-client.js';

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

// Data utilities
export { dropNulls } from './drop-nulls.js';

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
