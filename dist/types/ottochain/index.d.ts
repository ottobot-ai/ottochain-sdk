/**
 * Ottochain SDK
 *
 * Domain-specific types and clients for the ottochain metagraph.
 *
 * @packageDocumentation
 */
export * as proto from '../generated/index.js';
export type { FiberOrdinal, SnapshotOrdinal, StateId, Address, HashValue, JsonLogicValue, JsonLogicExpression, FiberStatus, AccessControlPolicy, StateMachineDefinition, EmittedEvent, EventReceipt, OracleInvocation, FiberLogEntry, StateMachineFiberRecord, ScriptFiberRecord, FiberRecord, FiberCommit, OnChain, CalculatedState, CreateStateMachine, TransitionStateMachine, ArchiveStateMachine, CreateScript, InvokeScript, OttochainMessage, } from './types.js';
export type { CurrencySnapshotResponse } from './snapshot.js';
export { decodeOnChainState, getSnapshotOnChainState, getLatestOnChainState, getLogsForFiber, getEventReceipts, getScriptInvocations, extractOnChainState, } from './snapshot.js';
export type { Checkpoint, MetagraphClientConfig } from './metagraph-client.js';
export { MetagraphClient } from './metagraph-client.js';
export * from './governance.js';
export * from './corporate.js';
