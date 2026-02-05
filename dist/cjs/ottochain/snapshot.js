"use strict";
/**
 * Snapshot decoder for ottochain on-chain state
 *
 * Fetches currency incremental snapshots from metagraph L0 and decodes the
 * on-chain state from the DataApplicationPart's binary payload.
 *
 * The on-chain state is serialized using JsonBinaryCodec (canonical JSON → UTF-8 bytes).
 *
 * @see modules/models/src/main/scala/xyz/kd5ujc/schema/OnChain.scala
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeOnChainState = decodeOnChainState;
exports.getSnapshotOnChainState = getSnapshotOnChainState;
exports.getLatestOnChainState = getLatestOnChainState;
exports.extractOnChainState = extractOnChainState;
exports.getLogsForFiber = getLogsForFiber;
exports.getEventReceipts = getEventReceipts;
exports.getOracleInvocations = getOracleInvocations;
const client_js_1 = require("../metakit/network/client.js");
/**
 * Decode on-chain state from binary (JsonBinaryCodec format).
 *
 * JsonBinaryCodec serialization is: canonical JSON → UTF-8 bytes.
 * So decoding is simply: UTF-8 bytes → JSON.parse.
 *
 * @param bytes - UTF-8 encoded canonical JSON bytes
 * @returns Decoded OnChain state
 */
function decodeOnChainState(bytes) {
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
}
/**
 * Fetch and decode the on-chain state from a specific snapshot ordinal.
 *
 * @param ml0BaseUrl - Metagraph L0 node base URL (e.g., 'http://localhost:9200')
 * @param ordinal - Snapshot ordinal number
 * @returns Decoded OnChain state, or null if no data application part
 */
async function getSnapshotOnChainState(ml0BaseUrl, ordinal) {
    const client = new client_js_1.HttpClient(ml0BaseUrl);
    const snapshot = await client.get(`/snapshots/${ordinal}`);
    return extractOnChainState(snapshot);
}
/**
 * Fetch and decode the on-chain state from the latest snapshot.
 *
 * @param ml0BaseUrl - Metagraph L0 node base URL (e.g., 'http://localhost:9200')
 * @returns Decoded OnChain state, or null if no data application part
 */
async function getLatestOnChainState(ml0BaseUrl) {
    const client = new client_js_1.HttpClient(ml0BaseUrl);
    const snapshot = await client.get('/snapshots/latest');
    return extractOnChainState(snapshot);
}
/**
 * Extract and decode on-chain state from a snapshot response.
 */
function extractOnChainState(snapshot) {
    const dataPart = snapshot.value?.dataApplication;
    if (!dataPart?.onChainState) {
        return null;
    }
    const bytes = new Uint8Array(dataPart.onChainState);
    return decodeOnChainState(bytes);
}
// ---------------------------------------------------------------------------
// Log filtering helpers
// ---------------------------------------------------------------------------
/**
 * Get all log entries for a specific fiber from on-chain state.
 *
 * @param onChain - Decoded on-chain state
 * @param fiberId - Fiber UUID to filter by
 * @returns Array of log entries for the fiber, or empty array
 */
function getLogsForFiber(onChain, fiberId) {
    return onChain.latestLogs[fiberId] ?? [];
}
/**
 * Get EventReceipt log entries for a specific fiber.
 *
 * EventReceipts are distinguished from OracleInvocations by the presence
 * of the `eventName` field.
 *
 * @param onChain - Decoded on-chain state
 * @param fiberId - Fiber UUID to filter by
 * @returns Array of EventReceipt entries
 */
function getEventReceipts(onChain, fiberId) {
    return getLogsForFiber(onChain, fiberId)
        .filter((entry) => 'eventName' in entry && 'success' in entry);
}
/**
 * Get OracleInvocation log entries for a specific fiber.
 *
 * OracleInvocations are distinguished from EventReceipts by the presence
 * of the `method` field.
 *
 * @param onChain - Decoded on-chain state
 * @param fiberId - Fiber UUID to filter by
 * @returns Array of OracleInvocation entries
 */
function getOracleInvocations(onChain, fiberId) {
    return getLogsForFiber(onChain, fiberId)
        .filter((entry) => 'method' in entry && 'result' in entry);
}
