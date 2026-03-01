/**
 * Drop Null Values from JSON Objects
 *
 * Recursively removes null-valued keys from objects to match
 * the Scala-side `JsonBinaryCodec.dropNulls` behavior in metakit.
 *
 * This ensures that the canonical JSON used for signing on the
 * TypeScript side matches what the Scala metagraph produces when
 * verifying signatures.
 *
 * Note: null values inside arrays are preserved (to maintain index
 * positions). Only object field values that are null are removed.
 */
/**
 * Recursively remove null values from objects
 *
 * @param value - Any JSON-serializable value
 * @returns A deep copy with null object fields removed
 *
 * @example
 * ```typescript
 * dropNulls({ a: 1, b: null, c: { d: null, e: 2 } })
 * // => { a: 1, c: { e: 2 } }
 *
 * dropNulls([1, null, 3])
 * // => [1, null, 3]  (array nulls preserved)
 * ```
 */
export declare function dropNulls<T>(value: T): T;
