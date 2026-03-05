/**
 * OttoChain-specific transaction and data helpers.
 *
 * Core signing, hashing, wallet, and network functionality is provided by
 * @constellation-network/metagraph-sdk — import from that package directly.
 *
 * This module exports only OttoChain-specific additions:
 * - Transaction payload builders (CreateStateMachine, Transition, Archive, Script, InvokeScript)
 * - Data normalization utilities
 *
 * @packageDocumentation
 */

// ─── OttoChain-specific transaction helpers ───────────────────────────────────

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

// ─── Data utilities ───────────────────────────────────────────────────────────

export {
  normalizeCreateStateMachine,
  normalizeTransitionStateMachine,
  normalizeArchiveStateMachine,
  normalizeMessage,
} from './normalize.js';
export { dropNulls } from './drop-nulls.js';
