/**
 * OttoChain Type Aliases
 *
 * Semantic type aliases for common primitive types.
 * These match the wire format used by the metagraph's JSON Logic engine.
 *
 * @packageDocumentation
 */
/**
 * DAG address (Constellation network address).
 * Format: DAG followed by alphanumeric characters.
 * @example "DAG4o8VX63jPFLQ6pZ5XE7qT8vGp8gkgBHj1QL5c"
 */
export type Address = string;
/**
 * Fiber UUID identifier.
 * @example "550e8400-e29b-41d4-a716-446655440000"
 */
export type FiberId = string;
/**
 * State machine state identifier.
 * @example "ACTIVE", "PENDING", "REGISTERED"
 */
export type StateId = string;
/**
 * Hex-encoded hash value.
 * @example "a1b2c3d4e5f6..."
 */
export type HashValue = string;
/**
 * Fiber sequence number (non-negative integer).
 * Increments with each state update.
 */
export type FiberOrdinal = number;
/**
 * Constellation snapshot ordinal (non-negative integer).
 * Global ordering of snapshots on the DAG network.
 */
export type SnapshotOrdinal = number;
/**
 * Unix timestamp in milliseconds.
 */
export type Timestamp = number;
/**
 * Validate a DAG address format.
 */
export declare function isValidAddress(value: string): value is Address;
/**
 * Validate a UUID format.
 */
export declare function isValidFiberId(value: string): value is FiberId;
