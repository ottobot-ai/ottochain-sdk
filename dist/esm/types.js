/**
 * OttoChain Type Aliases
 *
 * Semantic type aliases for common primitive types.
 * These match the wire format used by the metagraph's JSON Logic engine.
 *
 * @packageDocumentation
 */
/**
 * Validate a DAG address format.
 */
export function isValidAddress(value) {
    return /^DAG[0-9a-zA-Z]+$/.test(value);
}
/**
 * Validate a UUID format.
 */
export function isValidFiberId(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
