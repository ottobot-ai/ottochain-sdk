/**
 * Ottochain SDK
 *
 * Domain-specific types and clients for the ottochain metagraph.
 *
 * @packageDocumentation
 */
// Re-export generated protobuf types
export * as proto from '../generated/index.js';
export { decodeOnChainState, getSnapshotOnChainState, getLatestOnChainState, getLogsForFiber, getEventReceipts, getOracleInvocations, extractOnChainState, } from './snapshot.js';
export { MetagraphClient } from './metagraph-client.js';
