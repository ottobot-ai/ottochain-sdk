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

  // Log entries
  EmittedEvent,
  EventReceipt,
  OracleInvocation,
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
  CreateScript,
  InvokeScript,
  OttochainMessage,
} from './types.js';

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
  MetagraphClientConfig,
  SubscribeOptions,
  FiberStateCallback,
  Unsubscribe,
} from './metagraph-client.js';
export { MetagraphClient } from './metagraph-client.js';

// Note: Governance and Corporate types are now in src/apps/
// Import from '@ottochain/sdk/apps' instead
