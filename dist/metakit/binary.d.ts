/**
 * Binary Encoding
 *
 * Converts JSON data to binary format for cryptographic operations.
 * Supports both regular encoding and DataUpdate encoding with Constellation prefix.
 */
/**
 * Convert data to binary bytes for signing
 *
 * For regular data:
 *   JSON -> RFC 8785 canonicalization -> UTF-8 bytes
 *
 * For DataUpdate (isDataUpdate=true):
 *   JSON -> RFC 8785 -> UTF-8 -> Base64 -> prepend Constellation prefix -> UTF-8 bytes
 *
 * @param data - Any JSON-serializable object
 * @param isDataUpdate - If true, applies DataUpdate encoding with Constellation prefix
 * @returns Binary bytes as Uint8Array
 *
 * @example
 * ```typescript
 * // Regular encoding
 * const bytes = toBytes({ action: 'test' });
 *
 * // DataUpdate encoding
 * const updateBytes = toBytes({ action: 'test' }, true);
 * ```
 */
export declare function toBytes<T>(data: T, isDataUpdate?: boolean): Uint8Array;
/**
 * Encode data as a DataUpdate with Constellation prefix
 *
 * This is equivalent to `toBytes(data, true)`.
 *
 * @param data - Any JSON-serializable object
 * @returns Binary bytes with Constellation prefix
 */
export declare function encodeDataUpdate<T>(data: T): Uint8Array;
