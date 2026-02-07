/**
 * Codec Utilities
 *
 * Encoding/decoding utilities for the Constellation signature protocol.
 * Re-exports from binary.ts for backwards compatibility and provides additional utilities.
 */
export { toBytes, encodeDataUpdate } from './binary.js';
export { CONSTELLATION_PREFIX } from './types.js';
/**
 * Decode a DataUpdate encoded message back to its original JSON
 *
 * @param bytes - DataUpdate encoded bytes
 * @returns Decoded JSON object
 * @throws Error if bytes are not valid DataUpdate encoding
 */
export declare function decodeDataUpdate<T>(bytes: Uint8Array): T;
