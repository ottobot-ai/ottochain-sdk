/**
 * Producer-Validator model types for the OttoChain asset model.
 *
 * These types define the identity primitives used in the producer-validator
 * framework where producers create assets and validators verify them.
 */
/** DAG address string (dag1....) */
export type Address = string;
/** Unix timestamp in milliseconds */
export type Timestamp = number;
/** Unique identifier for an asset on-chain */
export type AssetId = string;
/** Identifier for an asset producer (typically a wallet address) */
export type ProducerId = string;
/** Identifier for an asset validator (typically a validator node address) */
export type ValidatorId = string;
