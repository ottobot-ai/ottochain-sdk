/**
 * Ottochain SDK
 *
 * Domain-specific types and clients for the ottochain metagraph.
 *
 * @packageDocumentation
 */
// Re-export generated protobuf types
export * as proto from '../generated/index.js';
export { decodeOnChainState, getSnapshotOnChainState, getLatestOnChainState, getLogsForFiber, getEventReceipts, getScriptInvocations, extractOnChainState, } from './snapshot.js';
export { MetagraphClient } from './metagraph-client.js';
// Governance and DAO types
export * from './governance.js';
// Corporate governance types
export * from './corporate.js';
